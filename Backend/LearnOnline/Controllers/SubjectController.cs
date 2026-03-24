using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SubjectController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Subject>>> GetAll()
        {
            return await _context.Subjects.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Subject>> GetById(string id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return NotFound();
            return subject;
        }

        [HttpPost]
        public async Task<ActionResult<Subject>> Create(Subject subject)
        {
            subject.Id = Guid.NewGuid().ToString();
            subject.CreatedAt = DateTime.UtcNow;
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = subject.Id }, subject);
        }

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
