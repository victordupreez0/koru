using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentController : ControllerBase
    {
        private readonly AppDbContext _context;
        public EnrollmentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Enrollment>>> GetAll()
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Enrollment>> GetById(string id)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (enrollment == null) return NotFound();
            return enrollment;
        }

        [HttpPost]
        public async Task<ActionResult<Enrollment>> Create(Enrollment enrollment)
        {
            enrollment.Id = Guid.NewGuid().ToString();
            enrollment.EnrolledAt = DateTime.UtcNow;
            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = enrollment.Id }, enrollment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Enrollment updated)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();

            enrollment.Status = updated.Status;
            enrollment.CourseId = updated.CourseId;
            enrollment.StudentId = updated.StudentId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);
            if (enrollment == null) return NotFound();
            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
