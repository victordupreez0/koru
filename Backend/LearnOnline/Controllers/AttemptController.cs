using System.Text.Json;
using System.Text.Json.Nodes;
using LearnOnline.Data;
using LearnOnline.Helpers;
using LearnOnline.Models;
using LearnOnline.Services.Marking;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Controllers
{
    // Interactive blocks: students submit answers here and the server marks them.
    [ApiController]
    [Route("api/[controller]")]
    public class AttemptController : ControllerBase
    {
        private const int MaxAnswerLength = 20_000;

        private readonly AppDbContext _context;

        public AttemptController(AppDbContext context)
        {
            _context = context;
        }

        // Deliberately has no "passed" or "score": those are only ever worked out below.
        public class SubmitRequest
        {
            public string UserId { get; set; } = string.Empty;
            public JsonElement Answer { get; set; }
        }

        private sealed record Page(string? Content, string CourseId, bool Published);

        private async Task<Page?> FindPage(string pageId)
        {
            var item = await _context.CourseModuleItems.Include(i => i.Module).FirstOrDefaultAsync(i => i.Id == pageId);
            if (item?.Module != null) return new Page(item.Content, item.Module.CourseId, item.IsPublished && item.Module.IsPublished);

            var module = await _context.CourseModules.FirstOrDefaultAsync(m => m.Id == pageId);
            return module == null ? null : new Page(module.Content, module.CourseId, module.IsPublished);
        }

        // POST /api/Attempt/pages/{pageId}/blocks/{blockId} – mark an answer; students' attempts are saved
        [HttpPost("pages/{pageId}/blocks/{blockId}")]
        public async Task<IActionResult> Submit(string pageId, string blockId, [FromBody] SubmitRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null) return Unauthorized(new { message = "Please sign in again." });

            var page = await FindPage(pageId);
            var block = PageBlocks.FindBlock(page?.Content, blockId);
            if (page == null || block == null) return NotFound(new { message = "This activity no longer exists." });

            var isStudent = user.Role == UserRole.student;
            if (isStudent)
            {
                var enrolled = await _context.Enrollments.AnyAsync(e => e.CourseId == page.CourseId && e.StudentId == user.Id);
                if (!enrolled || !page.Published) return StatusCode(403, new { message = "You don't have access to this activity." });
            }

            var answerJson = request.Answer.ValueKind == JsonValueKind.Undefined ? "{}" : request.Answer.GetRawText();
            if (answerJson.Length > MaxAnswerLength) return BadRequest(new { message = "That answer is too long." });

            MarkResult result;
            try
            {
                result = BlockMarker.Mark(block, request.Answer);
            }
            catch (MarkingException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            // Lecturers trying their own activity get marked but don't appear in the results.
            if (isStudent)
            {
                _context.Attempts.Add(new Attempt
                {
                    StudentId = user.Id,
                    PageId = pageId,
                    BlockId = blockId,
                    AnswerJson = answerJson,
                    Passed = result.Passed,
                    Score = result.Score,
                    MaxScore = result.MaxScore,
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { result.Passed, result.Score, result.MaxScore, result.Message, result.Details, recorded = isStudent });
        }

        // A lecturer trying out a block they are still building. The block comes from their editor,
        // not from a saved page, so nothing here is stored and only staff may call it.
        public class PreviewRequest
        {
            public string? UserId { get; set; }
            public JsonObject? Block { get; set; }
            public JsonElement Answer { get; set; }
        }

        // POST /api/Attempt/preview/student-view – the block exactly as a student would receive it
        [HttpPost("preview/student-view")]
        public async Task<IActionResult> PreviewStudentView([FromBody] PreviewRequest request)
        {
            if (!await _context.IsStaffAsync(request.UserId)) return StatusCode(403, new { message = "Only lecturers can preview activities." });
            if (request.Block?["attrs"] is not JsonObject) return BadRequest(new { message = "This block has no settings." });

            PageBlocks.StripBlock(request.Block);
            return Ok(new { attrs = request.Block["attrs"] });
        }

        // POST /api/Attempt/preview/mark – mark an answer against the unsaved block
        [HttpPost("preview/mark")]
        public async Task<IActionResult> PreviewMark([FromBody] PreviewRequest request)
        {
            if (!await _context.IsStaffAsync(request.UserId)) return StatusCode(403, new { message = "Only lecturers can preview activities." });
            if (request.Block == null) return BadRequest(new { message = "This block has no settings." });
            if (request.Answer.ValueKind != JsonValueKind.Undefined && request.Answer.GetRawText().Length > MaxAnswerLength)
                return BadRequest(new { message = "That answer is too long." });

            try
            {
                var result = BlockMarker.Mark(request.Block, request.Answer);
                return Ok(new { result.Passed, result.Score, result.MaxScore, result.Message, result.Details, recorded = false });
            }
            catch (MarkingException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET /api/Attempt/pages/{pageId}/mine?userId= – a student's progress on each block of a page
        [HttpGet("pages/{pageId}/mine")]
        public async Task<IActionResult> Mine(string pageId, [FromQuery] string userId)
        {
            var attempts = await _context.Attempts
                .Where(a => a.PageId == pageId && a.StudentId == userId)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            return Ok(attempts.GroupBy(a => a.BlockId).Select(g => new
            {
                blockId = g.Key,
                attempts = g.Count(),
                passed = g.Any(a => a.Passed),
                bestScore = g.Max(a => a.Score),
                maxScore = g.Last().MaxScore,
                lastAnswer = JsonDocument.Parse(g.Last().AnswerJson).RootElement,
            }));
        }

        // GET /api/Attempt/pages/{pageId}/blocks/{blockId}/results?userId= – who tried this block, for staff
        [HttpGet("pages/{pageId}/blocks/{blockId}/results")]
        public async Task<IActionResult> Results(string pageId, string blockId, [FromQuery] string? userId)
        {
            if (!await _context.IsStaffAsync(userId)) return StatusCode(403, new { message = "Only lecturers can see results." });

            var page = await FindPage(pageId);
            if (page == null || PageBlocks.FindBlock(page.Content, blockId) == null)
                return NotFound(new { message = "This activity no longer exists." });

            var attempts = await _context.Attempts
                .Where(a => a.PageId == pageId && a.BlockId == blockId)
                .Include(a => a.Student)
                .ToListAsync();

            var students = attempts.GroupBy(a => a.StudentId).Select(g =>
            {
                var student = g.First().Student!;
                return new
                {
                    id = student.Id,
                    firstName = student.FirstName,
                    lastName = student.LastName,
                    profileImageUrl = student.ProfileImageUrl,
                    attempts = g.Count(),
                    passed = g.Any(a => a.Passed),
                    bestScore = g.Max(a => a.Score),
                    maxScore = g.Max(a => a.MaxScore),
                    lastAttemptAt = g.Max(a => a.CreatedAt),
                };
            }).OrderByDescending(s => s.lastAttemptAt).ToList();

            var enrolled = await _context.Enrollments.CountAsync(e => e.CourseId == page.CourseId);
            return Ok(new { enrolled, attempted = students.Count, passed = students.Count(s => s.passed), students });
        }
    }
}
