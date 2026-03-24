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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Class>>> GetAll()
        {
            return await _context.Classes
                .Include(c => c.Timetable)
                .Include(c => c.Course)
                .ToListAsync();
        }

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

        [HttpPost]
        public async Task<ActionResult<Class>> Create(Class cls)
        {
            cls.Id = Guid.NewGuid().ToString();
            _context.Classes.Add(cls);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = cls.Id }, cls);
        }

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
