using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ClassController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Class – all class slots with Teacher and Course info (used by admin calendar)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var result = await _context.Classes
                .Include(c => c.Course)
                .Include(c => c.Teacher)
                .Select(c => new {
                    c.Id,
                    c.Name,
                    c.CourseId,
                    CourseName = c.Course != null ? c.Course.Name : null,
                    c.ClassGroupId,
                    c.TimetableId,
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
            return Ok(result);
        }

        // GET /api/Class/course/{courseId}/unassigned – class slots not yet assigned to any group
        [HttpGet("course/{courseId}/unassigned")]
        public async Task<ActionResult<IEnumerable<object>>> GetUnassignedByCourse(string courseId)
        {
            var result = await _context.Classes
                .Include(c => c.Teacher)
                .Where(c => c.CourseId == courseId && c.ClassGroupId == null)
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
            return Ok(result);
        }

        // GET /api/Class/group/{groupId} – all class slots for a specific group
        [HttpGet("group/{groupId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByGroup(string groupId)
        {
            var result = await _context.Classes
                .Include(c => c.Teacher)
                .Where(c => c.ClassGroupId == groupId)
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
            return Ok(result);
        }

        // GET /api/Class/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Class>> GetById(string id)
        {
            var cls = await _context.Classes
                .Include(c => c.Timetable)
                .Include(c => c.Course)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (cls == null) return NotFound();
            return cls;
        }

        // POST /api/Class – create a new class slot
        [HttpPost]
        public async Task<ActionResult<Class>> Create(Class cls)
        {
            cls.Id = Guid.NewGuid().ToString();
            _context.Classes.Add(cls);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = cls.Id }, cls);
        }

        // PUT /api/Class/{id} – update a class slot
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Class updated)
        {
            var cls = await _context.Classes.FindAsync(id);
            if (cls == null) return NotFound();

            cls.TimetableId = updated.TimetableId;
            cls.ClassGroupId = updated.ClassGroupId;
            cls.CourseId = updated.CourseId;
            cls.Name = updated.Name;
            cls.TeacherId = updated.TeacherId;
            cls.DurationHours = updated.DurationHours;
            cls.Room = updated.Room;
            cls.DayOfWeek = updated.DayOfWeek;
            cls.StartTime = updated.StartTime;
            cls.EndTime = updated.EndTime;
            cls.IsGenerated = updated.IsGenerated;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Class/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var cls = await _context.Classes.FindAsync(id);
            if (cls == null) return NotFound();
            _context.Classes.Remove(cls);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
