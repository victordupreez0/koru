using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Assignment API – CRUD for course assignments (tasks, projects, exams)
    // Teachers create assignments; students submit work against them
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AssignmentController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Assignment – return all assignments with their related Course
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetAll()
        {
            return await _context.Assignments
                .Include(a => a.Course)
                .ToListAsync();
        }

        // GET /api/Assignment/{id} – return a single assignment by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Assignment>> GetById(string id)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (assignment == null) return NotFound();
            return assignment;
        }

        // GET /api/Assignment/course/{courseId} – return assignments strictly for a course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetByCourseId(string courseId)
        {
            var assignments = await _context.Assignments
                .Include(a => a.Course)
                    .ThenInclude(c => c.Subject)
                .Where(a => a.CourseId == courseId)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return assignments;
        }

        // GET /api/Assignment/student/{studentId} – return global assignments across all enrolled active courses
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetByStudentId(string studentId)
        {
            // Extract the IDs of the active courses to prevent massive joins loading full course entity models into RAM
            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status == "Active")
                .Select(e => e.CourseId)
                .ToListAsync();

            var assignments = await _context.Assignments
                .Include(a => a.Course)
                    .ThenInclude(c => c.Subject)
                .Where(a => enrolledCourseIds.Contains(a.CourseId))
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            return assignments;
        }

        // POST /api/Assignment – create a new assignment for a course
        [HttpPost]
        public async Task<ActionResult<Assignment>> Create(Assignment assignment)
        {
            assignment.Id = Guid.NewGuid().ToString();
            assignment.CreatedAt = DateTime.UtcNow;
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
        }

        // PUT /api/Assignment/{id} – update an existing assignment's details
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Assignment updated)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();

            assignment.Title = updated.Title;
            assignment.Description = updated.Description;
            assignment.DueDate = updated.DueDate;
            assignment.OpenDate = updated.OpenDate;
            assignment.CloseDate = updated.CloseDate;
            assignment.MaxPoints = updated.MaxPoints;
            assignment.CourseId = updated.CourseId;
            assignment.Type = updated.Type;
            assignment.IsClosed = updated.IsClosed;
            assignment.AllowMultipleAttempts = updated.AllowMultipleAttempts;
            assignment.QuizQuestionsJson = updated.QuizQuestionsJson;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/Assignment/{id}/close – toggle the closed state of an assignment
        [HttpPatch("{id}/close")]
        public async Task<IActionResult> Close(string id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();
            assignment.IsClosed = !assignment.IsClosed;
            await _context.SaveChangesAsync();
            return Ok(new { isClosed = assignment.IsClosed });
        }

        // DELETE /api/Assignment/{id} – permanently remove an assignment
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();
            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
