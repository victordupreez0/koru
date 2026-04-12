using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Event API – full CRUD for calendar events
    // Used by the FullCalendar frontend to create, read, update, and delete events
    [ApiController]
    [Route("api/[controller]")]
    public class EventController : ControllerBase
    {
        private readonly AppDbContext _context;
        public EventController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Event – return all events with their related Course
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetAll()
        {
            return await _context.Events
                .Include(e => e.Course)
                .ToListAsync();
        }

        // GET /api/Event/{id} – return a single event by its ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetById(string id)
        {
            var ev = await _context.Events
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (ev == null) return NotFound();
            return ev;
        }

        // POST /api/Event – create a new event and return it with a 201 status
        [HttpPost]
        public async Task<ActionResult<Event>> Create(Event ev)
        {
            ev.Id = Guid.NewGuid().ToString();
            _context.Events.Add(ev);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        // PUT /api/Event/{id} – update all fields of an existing event
        // Called by the frontend on modal save and on drag-and-drop / resize
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Event updated)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();

            ev.Title = updated.Title;
            ev.Description = updated.Description;
            ev.EventType = updated.EventType;
            ev.StartTime = updated.StartTime;
            ev.EndTime = updated.EndTime;
            ev.CreatedBy = updated.CreatedBy;
            ev.BgColor = updated.BgColor;
            ev.TextColor = updated.TextColor;
            ev.CourseId = updated.CourseId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Event/{id} – permanently remove an event
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev == null) return NotFound();
            _context.Events.Remove(ev);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
