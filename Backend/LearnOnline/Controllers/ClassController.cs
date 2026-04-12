using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Class API – CRUD for scheduled class sessions
    // Each Class is a time-slot in a Timetable linked to a Course
    [ApiController]
    [Route("api/[controller]")]
    public class ClassController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ClassController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Class – return all class sessions with their Timetable and Course
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Class>>> GetAll()
        {
            return await _context.Classes
                .Include(c => c.Timetable)
                .Include(c => c.Course)
                .ToListAsync();
        }

        // GET /api/Class/{id} – return a single class session by ID
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

        // POST /api/Class – create a new class session
        [HttpPost]
        public async Task<ActionResult<Class>> Create(Class cls)
        {
            cls.Id = Guid.NewGuid().ToString();
            _context.Classes.Add(cls);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = cls.Id }, cls);
        }

        // PUT /api/Class/{id} – update room, day, times, or reassign to a different timetable/course
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Class updated)
        {
            var cls = await _context.Classes.FindAsync(id);
            if (cls == null) return NotFound();

            cls.TimetableId = updated.TimetableId;
            cls.CourseId = updated.CourseId;
            cls.Room = updated.Room;
            cls.DayOfWeek = updated.DayOfWeek;
            cls.StartTime = updated.StartTime;
            cls.EndTime = updated.EndTime;
            cls.IsGenerated = updated.IsGenerated;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Class/{id} – permanently remove a class session
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
