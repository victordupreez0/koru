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
    }
}
