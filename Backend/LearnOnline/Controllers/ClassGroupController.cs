using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // ClassGroup API – CRUD and cohort assignments for admin student class routing and timetabling
    [ApiController]
    [Route("api/[controller]")]
    public class ClassGroupController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClassGroupController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET /api/ClassGroup – get all cohorts with Course info
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClassGroup>>> GetAll()
        {
            return await _context.ClassGroups
                .Include(g => g.Course)
                .ThenInclude(c => c!.Subject)
                .ToListAsync();
        }

        // 2. GET /api/ClassGroup/course/{courseId} – get all cohorts for a specific Course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByCourse(string courseId)
        {
            var groups = await _context.ClassGroups
                .Where(g => g.CourseId == courseId)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.CourseId,
                    StudentCount = _context.Enrollments.Count(e => e.ClassGroupId == g.Id && e.Status == "Active")
                })
                .ToListAsync();

            return Ok(groups);
        }

        // GET /api/ClassGroup/course/{courseId}/students – get all active students enrolled in this course with cohort info
        [HttpGet("course/{courseId}/students")]
        public async Task<ActionResult<IEnumerable<object>>> GetCourseStudents(string courseId)
        {
            var students = await _context.Enrollments
                .Include(e => e.Student)
                .Include(e => e.ClassGroup)
                .Where(e => e.CourseId == courseId && e.Status == "Active")
                .Select(e => new
                {
                    StudentId = e.StudentId,
                    StudentName = e.Student != null ? $"{e.Student.FirstName} {e.Student.LastName}" : "Unknown Student",
                    Email = e.Student != null ? e.Student.Email : "",
                    ClassGroupId = e.ClassGroupId,
                    GroupName = e.ClassGroup != null ? e.ClassGroup.Name : "Unassigned"
                })
                .ToListAsync();

            return Ok(students);
        }

        // 3. GET /api/ClassGroup/{id} – get single cohort with full enrolled students roster
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(string id)
        {
            var cohort = await _context.ClassGroups
                .Include(g => g.Course)
                .ThenInclude(c => c!.Subject)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (cohort == null) return NotFound();

            // Find enrolled students in this cohort
            var students = await _context.Enrollments
                .Include(e => e.Student)
                .Where(e => e.ClassGroupId == id && e.Status == "Active")
                .Select(e => new
                {
                    e.Student!.Id,
                    e.Student.FirstName,
                    e.Student.LastName,
                    e.Student.Email
                })
                .ToListAsync();

            // Find scheduled class weekly slots for this cohort
            var schedules = await _context.Classes
                .Include(c => c.Teacher)
                .Where(c => c.ClassGroupId == id)
                .Select(c => new {
                    c.Id,
                    c.Name,
                    c.CourseId,
                    c.ClassGroupId,
                    c.Room,
                    c.DayOfWeek,
                    c.StartTime,
                    c.EndTime,
                    c.DurationHours,
                    c.IsGenerated,
                    c.TeacherId,
                    TeacherName = c.Teacher != null ? c.Teacher.FirstName + " " + c.Teacher.LastName : null,
                })
                .ToListAsync();

            return Ok(new
            {
                cohort.Id,
                cohort.Name,
                cohort.CourseId,
                CourseName = cohort.Course != null ? (cohort.Course.Name ?? cohort.Course.Subject?.Name) : null,
                Students = students,
                Schedules = schedules
            });
        }

        // 4. POST /api/ClassGroup – create a new ClassGroup (Cohort)
        [HttpPost]
        public async Task<ActionResult<ClassGroup>> Create(ClassGroup cohort)
        {
            cohort.Id = Guid.NewGuid().ToString();
            _context.ClassGroups.Add(cohort);
            await _context.SaveChangesAsync();
            return Ok(cohort);
        }

        // 5. PUT /api/ClassGroup/{id}/assign-students – assign a batch of students to this cohort
        [HttpPut("{id}/assign-students")]
        public async Task<IActionResult> AssignStudents(string id, [FromBody] List<string> studentIds)
        {
            var cohort = await _context.ClassGroups.FindAsync(id);
            if (cohort == null) return NotFound("Cohort not found.");

            if (studentIds == null) return BadRequest("Student IDs list cannot be null.");

            // Find all active enrollments for this Course
            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == cohort.CourseId && e.Status == "Active")
                .ToListAsync();

            foreach (var enrollment in enrollments)
            {
                // If this student is in the assignment list, set their cohort
                if (studentIds.Contains(enrollment.StudentId))
                {
                    enrollment.ClassGroupId = id;
                }
                // Otherwise, if they were in this cohort, clear their cohort link
                else if (enrollment.ClassGroupId == id)
                {
                    enrollment.ClassGroupId = null; // unassign
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Student roster successfully updated for cohort." });
        }

        // 6. DELETE /api/ClassGroup/{id} – delete a cohort
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var cohort = await _context.ClassGroups.FindAsync(id);
            if (cohort == null) return NotFound();

            // Clear any student enrollment links to this cohort
            var enrollments = await _context.Enrollments.Where(e => e.ClassGroupId == id).ToListAsync();
            foreach (var e in enrollments) e.ClassGroupId = null;

            // Delete scheduled weekly class slots for this cohort
            var classes = await _context.Classes.Where(c => c.ClassGroupId == id).ToListAsync();
            _context.Classes.RemoveRange(classes);

            _context.ClassGroups.Remove(cohort);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
