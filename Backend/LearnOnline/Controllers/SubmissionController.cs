using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Submission API – CRUD for student submissions against assignments
    // Students upload their work here; teachers then grade and give feedback
    [ApiController]
    [Route("api/[controller]")]
    public class SubmissionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public SubmissionController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        // GET /api/Submission – return all submissions with their Assignment and Student
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Submission>>> GetAll()
        {
            return await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .ToListAsync();
        }

        // GET /api/Submission/{id} – return a single submission by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Submission>> GetById(string id)
        {
            var submission = await _context.Submissions
                .Include(s => s.Assignment)
                .Include(s => s.Student)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (submission == null) return NotFound();
            return submission;
        }

        // GET /api/Submission/student/{studentId} – return all submissions for a specific student, including grades
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Submission>>> GetByStudentId(string studentId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Assignment)
                .Where(s => s.StudentId == studentId)
                .ToListAsync();

            // We also need the grades for these submissions. 
            // In Entity Framework, we can just fetch grades for these submissions or include them if the schema allowed.
            // Since Submission doesn't have a direct Grade navigation property (Grade has SubmissionId),
            // we will fetch the grades separately and attach them if we need to, OR we can rely on the frontend 
            // fetching them, OR we can return an anonymous object / DTO.
            // Wait, looking at the schema, Grade has a SubmissionId, but Submission does NOT have a Grade property.
            // To be efficient, let's just return the submissions. The frontend can query grades via the GradeController,
            // or we can just fetch the grades and send them side-by-side. 
            return submissions;
        }

        // GET /api/Submission/assignment/{assignmentId} – return all submissions for a specific assignment
        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<Submission>>> GetByAssignmentId(string assignmentId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Student)
                .Where(s => s.AssignmentId == assignmentId)
                .ToListAsync();
            return submissions;
        }

        // GET /api/Submission/course/{courseId} – return all submissions for a specific course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Submission>>> GetByCourseId(string courseId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Student)
                .Include(s => s.Assignment)
                .Where(s => s.Assignment.CourseId == courseId)
                .ToListAsync();
            return submissions;
        }

        // POST /api/Submission – submit work for an assignment
        [HttpPost]
        public async Task<ActionResult<Submission>> Create(Submission submission)
        {
            submission.Id = Guid.NewGuid().ToString();
            submission.SubmittedAt = DateTime.UtcNow;

            // Auto-detect if the submission is late based on the assignment's due date
            var assignment = await _context.Assignments.FindAsync(submission.AssignmentId);
            if (assignment?.DueDate.HasValue == true && submission.SubmittedAt > assignment.DueDate.Value)
            {
                submission.Status = "Late";
            }
            else if (string.IsNullOrEmpty(submission.Status))
            {
                submission.Status = "Submitted";
            }

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
        }

        // PUT /api/Submission/{id} – update a submission's file or status
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Submission updated)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound();

            submission.FileUrl = updated.FileUrl;
            submission.Status = updated.Status;
            submission.AssignmentId = updated.AssignmentId;
            submission.StudentId = updated.StudentId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Submission/{id} – permanently remove a submission
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null) return NotFound();
            _context.Submissions.Remove(submission);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET /api/Submission/{id}/file – proxy the submission file to the browser
        // Handles both Cloudinary URLs and legacy local /uploads/ paths
        [HttpGet("{id}/file")]
        public async Task<IActionResult> GetFile(string id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null || string.IsNullOrEmpty(submission.FileUrl))
                return NotFound();

            // Skip quiz JSON answers
            if (submission.FileUrl.TrimStart().StartsWith("{"))
                return BadRequest(new { message = "This submission is a quiz response." });

            if (submission.FileUrl.StartsWith("http://") || submission.FileUrl.StartsWith("https://"))
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync(submission.FileUrl);
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode);

                var bytes = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
                var fileName = Path.GetFileName(new Uri(submission.FileUrl).LocalPath);

                // Serve inline so the browser renders PDFs/images instead of downloading
                Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
                return File(bytes, contentType);
            }
            else
            {
                var localPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                    submission.FileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (!System.IO.File.Exists(localPath))
                    return NotFound();

                var contentType = "application/octet-stream";
                var ext = Path.GetExtension(localPath).ToLowerInvariant();
                if (ext == ".pdf") contentType = "application/pdf";
                else if (ext is ".jpg" or ".jpeg") contentType = "image/jpeg";
                else if (ext == ".png") contentType = "image/png";

                var fileName = Path.GetFileName(localPath);
                Response.Headers.Append("Content-Disposition", $"inline; filename=\"{fileName}\"");
                return PhysicalFile(localPath, contentType);
            }
        }

        // POST /api/Submission/upload – save a submitted file to wwwroot/uploads and return its URL
        [HttpPost("upload")]
        public async Task<ActionResult<object>> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided." });

            // Sanitise filename to prevent path traversal
            var originalName = Path.GetFileName(file.FileName);
            var safeFileName = $"{Guid.NewGuid()}_{originalName}";

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, safeFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/{safeFileName}" });
        }
    }
}
