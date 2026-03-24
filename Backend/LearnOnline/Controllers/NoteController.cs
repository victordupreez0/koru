using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NoteController : ControllerBase
    {
        private readonly AppDbContext _context;
        public NoteController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Note>>> GetAll()
        {
            return await _context.Notes
                .Include(n => n.Course)
                .Include(n => n.Student)
                .Include(n => n.Author)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Note>> GetById(string id)
        {
            var note = await _context.Notes
                .Include(n => n.Course)
                .Include(n => n.Student)
                .Include(n => n.Author)
                .FirstOrDefaultAsync(n => n.Id == id);
            if (note == null) return NotFound();
            return note;
        }

        [HttpPost]
        public async Task<ActionResult<Note>> Create(Note note)
        {
            note.Id = Guid.NewGuid().ToString();
            note.CreatedAt = DateTime.UtcNow;
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Note updated)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return NotFound();

            note.Content = updated.Content;
            note.CourseId = updated.CourseId;
            note.StudentId = updated.StudentId;
            note.AuthorId = updated.AuthorId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return NotFound();
            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
