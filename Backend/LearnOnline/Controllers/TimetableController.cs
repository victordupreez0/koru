using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Timetable API – CRUD for user timetables
    // A timetable groups Class sessions for a specific user, term, and year
    [ApiController]
    [Route("api/[controller]")]
    public class TimetableController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TimetableController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Timetable – return all timetables with their associated User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Timetable>>> GetAll()
        {
            return await _context.Timetables
                .Include(t => t.User)
                .ToListAsync();
        }

        // GET /api/Timetable/{id} – return a single timetable by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Timetable>> GetById(string id)
        {
            var timetable = await _context.Timetables
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (timetable == null) return NotFound();
            return timetable;
        }

        // POST /api/Timetable – generate a new timetable for a user
        [HttpPost]
        public async Task<ActionResult<Timetable>> Create(Timetable timetable)
        {
            timetable.Id = Guid.NewGuid().ToString();
            timetable.GeneratedAt = DateTime.UtcNow;
            _context.Timetables.Add(timetable);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = timetable.Id }, timetable);
        }

        // PUT /api/Timetable/{id} – update timetable details (term, year, owner)
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

        // DELETE /api/Timetable/{id} – permanently remove a timetable
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
