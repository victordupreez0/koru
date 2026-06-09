using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Enrollment API – CRUD for student-course enrolments
    // Links students to courses and tracks their enrolment status
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        public EnrollmentController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Enrollment – return all enrolments with their Course and Student
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Enrollment>>> GetAll()
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .ToListAsync();
        }

        // GET /api/Enrollment/{id} – return a single enrolment by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Enrollment>> GetById(string id)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Subject)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (enrollment == null) return NotFound();
            return enrollment;
        }

        // GET /api/Enrollment/student/{studentId} – return all active courses a student is enrolled in
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<Enrollment>>> GetByStudentId(string studentId)
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Subject)
                .Include(e => e.Course.Teacher)
                .Where(e => e.StudentId == studentId && e.Status == "Active" && e.Course.IsVisible)
                .ToListAsync();

            if (!enrollments.Any()) return NotFound("No active courses found for this student.");
            
            return enrollments;
        }

        // POST /api/Enrollment/course/{courseId}/students – bulk enroll/set students for a course
        [HttpPost("course/{courseId}/students")]
        public async Task<IActionResult> BulkEnroll(string courseId, [FromBody] List<string> studentIds)
        {
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists) return NotFound("Course not found");

            // Fetch current enrollments for this course
            var currentEnrollments = await _context.Enrollments
                .Where(e => e.CourseId == courseId)
                .ToListAsync();

            // Find or create cohort (ClassGroup) for this course (e.g. Group A) to link the enrollments
            var classGroup = await _context.ClassGroups
                .FirstOrDefaultAsync(g => g.CourseId == courseId && g.Name == "Group A");
            if (classGroup == null)
            {
                classGroup = new ClassGroup { CourseId = courseId, Name = "Group A" };
                _context.ClassGroups.Add(classGroup);
                await _context.SaveChangesAsync();
            }

            // Remove students who are no longer in the list
            foreach (var e in currentEnrollments)
            {
                if (!studentIds.Contains(e.StudentId))
                {
                    _context.Enrollments.Remove(e);
                }
            }

            // Add students who are not yet enrolled
            var currentStudentIds = currentEnrollments.Select(e => e.StudentId).ToList();
            foreach (var studentId in studentIds)
            {
                if (!currentStudentIds.Contains(studentId))
                {
                    var enrollment = new Enrollment
                    {
                        Id = Guid.NewGuid().ToString(),
                        CourseId = courseId,
                        StudentId = studentId,
                        Status = "Active",
                        ClassGroupId = classGroup.Id,
                        EnrolledAt = DateTime.UtcNow
                    };
                    _context.Enrollments.Add(enrollment);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Bulk enrollment updated successfully" });
        }

        // GET /api/Enrollment/course/{courseId}/count – return count of active students in a course
        [HttpGet("course/{courseId}/count")]
        public async Task<ActionResult<int>> GetCourseStudentCount(string courseId)
        {
            var count = await _context.Enrollments
                .CountAsync(e => e.CourseId == courseId && e.Status == "Active");
            return count;
        }

        // POST /api/Enrollment – enrol a student in a course
        [HttpPost]
        public async Task<ActionResult<Enrollment>> Create(Enrollment enrollment)
        {
            enrollment.Id = Guid.NewGuid().ToString();
            enrollment.EnrolledAt = DateTime.UtcNow;
            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = enrollment.Id }, enrollment);
        }

        // PUT /api/Enrollment/{id} – update enrolment status (e.g. Active → Dropped)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Enrollment updated)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();

            enrollment.Status = updated.Status;
            enrollment.CourseId = updated.CourseId;
            enrollment.StudentId = updated.StudentId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Enrollment/{id} – permanently remove an enrolment record
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();
            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
