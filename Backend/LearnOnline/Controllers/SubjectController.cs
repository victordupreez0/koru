using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Subject API – CRUD for the subject catalogue
    // Subjects are the templates; Courses are specific offerings of a Subject
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SubjectController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Subject – return all subjects in the catalogue
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subject>>> GetAll()
        {
            return await _context.Subjects.ToListAsync();
        }

        // GET /api/Subject/{id} – return a single subject by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Subject>> GetById(string id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return NotFound();
            return subject;
        }

        // POST /api/Subject – add a new subject to the catalogue
        [HttpPost]
        public async Task<ActionResult<Subject>> Create(Subject subject)
        {
            subject.Id = Guid.NewGuid().ToString();
            subject.CreatedAt = DateTime.UtcNow;
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = subject.Id }, subject);
        }

        // PUT /api/Subject/{id} – update a subject's name, code, or description
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Subject updated)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return NotFound();

            subject.Name = updated.Name;
            subject.Code = updated.Code;
            subject.Description = updated.Description;
            subject.CreatedBy = updated.CreatedBy;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Subject/{id} – permanently remove a subject from the catalogue
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return NotFound();
            _context.Subjects.Remove(subject);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
