using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Feedback>>> GetAll()
        {
            return await _context.Feedbacks
                .Include(f => f.Submission)
                .Include(f => f.Teacher)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Feedback>> GetById(string id)
        {
            var feedback = await _context.Feedbacks
                .Include(f => f.Submission)
                .Include(f => f.Teacher)
                .FirstOrDefaultAsync(f => f.Id == id);
            if (feedback == null) return NotFound();
            return feedback;
        }

        [HttpPost]
        public async Task<ActionResult<Feedback>> Create(Feedback feedback)
        {
            feedback.Id = Guid.NewGuid().ToString();
            feedback.CreatedAt = DateTime.UtcNow;
            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = feedback.Id }, feedback);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Feedback updated)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound();

            feedback.Content = updated.Content;
            feedback.SubmissionId = updated.SubmissionId;
            feedback.TeacherId = updated.TeacherId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound();
            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
