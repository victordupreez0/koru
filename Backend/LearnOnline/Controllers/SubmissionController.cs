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
        public SubmissionController(AppDbContext context)
        {
            _context = context;
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

        // POST /api/Submission – submit work for an assignment
        [HttpPost]
        public async Task<ActionResult<Submission>> Create(Submission submission)
        {
            submission.Id = Guid.NewGuid().ToString();
            submission.SubmittedAt = DateTime.UtcNow;
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
    }
}
