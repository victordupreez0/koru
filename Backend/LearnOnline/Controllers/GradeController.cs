using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Grade API – CRUD for scores awarded to student submissions
    // Each grade records who graded it and when, for audit purposes
    [ApiController]
    [Route("api/[controller]")]
    public class GradeController : ControllerBase
    {
        private readonly AppDbContext _context;
        public GradeController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Grade – return all grades with their Submission and Grader
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Grade>>> GetAll()
        {
            return await _context.Grades
                .Include(g => g.Submission)
                .Include(g => g.Grader)
                .ToListAsync();
        }

        // GET /api/Grade/{id} – return a single grade by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Grade>> GetById(string id)
        {
            var grade = await _context.Grades
                .Include(g => g.Submission)
                .Include(g => g.Grader)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (grade == null) return NotFound();
            return grade;
        }

        // GET /api/Grade/student/{studentId} – return all grades for a specific student
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Grade>>> GetByStudentId(string studentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Submission)
                    .ThenInclude(s => s.Assignment)
                        .ThenInclude(a => a.Course)
                            .ThenInclude(c => c.Subject)
                .Where(g => g.Submission != null && g.Submission.StudentId == studentId)
                .ToListAsync();

            return grades;
        }

        // GET /api/Grade/assignment/{assignmentId} – return all grades for a specific assignment
        [HttpGet("assignment/{assignmentId}")]
        public async Task<ActionResult<IEnumerable<Grade>>> GetByAssignmentId(string assignmentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Submission)
                    .ThenInclude(s => s.Student)
                .Include(g => g.Grader)
                .Where(g => g.Submission != null && g.Submission.AssignmentId == assignmentId)
                .ToListAsync();

            return grades;
        }

        // GET /api/Grade/course/{courseId} – return all grades for a specific course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Grade>>> GetByCourseId(string courseId)
        {
            var grades = await _context.Grades
                .Include(g => g.Submission)
                    .ThenInclude(s => s.Assignment)
                .Include(g => g.Submission)
                    .ThenInclude(s => s.Student)
                .Where(g => g.Submission != null && g.Submission.Assignment != null && g.Submission.Assignment.CourseId == courseId)
                .ToListAsync();

            return grades;
        }

        // POST /api/Grade – record a new grade for a submission
        [HttpPost]
        public async Task<ActionResult<Grade>> Create(Grade grade)
        {
            grade.Id = Guid.NewGuid().ToString();
            grade.GradedAt = DateTime.UtcNow;
            _context.Grades.Add(grade);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = grade.Id }, grade);
        }

        // PUT /api/Grade/{id} – update a grade (re-grade) and refresh the timestamp
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Grade updated)
        {
            var grade = await _context.Grades.FindAsync(id);
            if (grade == null) return NotFound();

            grade.PointsEarned = updated.PointsEarned;
            grade.SubmissionId = updated.SubmissionId;
            grade.GradedBy = updated.GradedBy;
            grade.GradedAt = DateTime.UtcNow;
            // IsReleased is only changed via the /release endpoint – not here

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST /api/Grade/assignment/{assignmentId}/release – bulk-release all grades for an assignment
        [HttpPost("assignment/{assignmentId}/release")]
        public async Task<IActionResult> ReleaseByAssignment(string assignmentId)
        {
            var grades = await _context.Grades
                .Include(g => g.Submission)
                .Where(g => g.Submission != null && g.Submission.AssignmentId == assignmentId)
                .ToListAsync();

            foreach (var g in grades) g.IsReleased = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Grade/{id} – permanently remove a grade record
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var grade = await _context.Grades.FindAsync(id);
            if (grade == null) return NotFound();
            _context.Grades.Remove(grade);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
