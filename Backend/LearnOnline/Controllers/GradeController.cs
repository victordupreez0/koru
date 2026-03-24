using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradeController : ControllerBase
    {
        private readonly AppDbContext _context;
        public GradeController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Grade>>> GetAll()
        {
            return await _context.Grades
                .Include(g => g.Submission)
                .Include(g => g.Grader)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Grade>> GetById(string id)
        {
            var grade = await _context.Grades
                .Include(g => g.Submission)
                .Include(g => g.Grader)
                .FirstOrDefaultAsync(g => g.Id == id);
            if (grade == null) return NotFound();
            return grade;
        }

        [HttpPost]
        public async Task<ActionResult<Grade>> Create(Grade grade)
        {
            grade.Id = Guid.NewGuid().ToString();
            grade.GradedAt = DateTime.UtcNow;
            _context.Grades.Add(grade);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = grade.Id }, grade);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Grade updated)
        {
            var grade = await _context.Grades.FindAsync(id);
            if (grade == null) return NotFound();

            grade.PointsEarned = updated.PointsEarned;
            grade.SubmissionId = updated.SubmissionId;
            grade.GradedBy = updated.GradedBy;
            grade.GradedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var grade = await _context.Grades.FindAsync(id);
            if (grade == null) return NotFound();
            _context.Grades.Remove(grade);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
