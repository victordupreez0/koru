using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimetableController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TimetableController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Timetable>>> GetAll()
        {
            return await _context.Timetables
                .Include(t => t.User)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Timetable>> GetById(string id)
        {
            var timetable = await _context.Timetables
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (timetable == null) return NotFound();
            return timetable;
        }

        [HttpPost]
        public async Task<ActionResult<Timetable>> Create(Timetable timetable)
        {
            timetable.Id = Guid.NewGuid().ToString();
            timetable.GeneratedAt = DateTime.UtcNow;
            _context.Timetables.Add(timetable);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = timetable.Id }, timetable);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Timetable updated)
        {
            var timetable = await _context.Timetables.FindAsync(id);
            if (timetable == null) return NotFound();

            timetable.Term = updated.Term;
            timetable.Year = updated.Year;
            timetable.GeneratedBy = updated.GeneratedBy;
            timetable.UserId = updated.UserId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var timetable = await _context.Timetables.FindAsync(id);
            if (timetable == null) return NotFound();
            _context.Timetables.Remove(timetable);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
