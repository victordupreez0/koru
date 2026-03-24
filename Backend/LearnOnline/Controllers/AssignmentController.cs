using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AssignmentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Assignment>>> GetAll()
        {
            return await _context.Assignments
                .Include(a => a.Course)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Assignment>> GetById(string id)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (assignment == null) return NotFound();
            return assignment;
        }

        [HttpPost]
        public async Task<ActionResult<Assignment>> Create(Assignment assignment)
        {
            assignment.Id = Guid.NewGuid().ToString();
            assignment.CreatedAt = DateTime.UtcNow;
            _context.Assignments.Add(assignment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Assignment updated)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();

            assignment.Title = updated.Title;
            assignment.Description = updated.Description;
            assignment.DueDate = updated.DueDate;
            assignment.MaxPoints = updated.MaxPoints;
            assignment.CourseId = updated.CourseId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var assignment = await _context.Assignments.FindAsync(id);
            if (assignment == null) return NotFound();
            _context.Assignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
