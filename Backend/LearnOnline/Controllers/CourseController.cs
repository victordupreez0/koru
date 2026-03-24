using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CourseController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetAll()
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Teacher)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetById(string id)
        {
            var course = await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Teacher)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (course == null) return NotFound();
            return course;
        }

        [HttpPost]
        public async Task<ActionResult<Course>> Create(Course course)
        {
            course.Id = Guid.NewGuid().ToString();
            course.CreatedAt = DateTime.UtcNow;
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Course updated)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.Term = updated.Term;
            course.Year = updated.Year;
            course.Capacity = updated.Capacity;
            course.SubjectId = updated.SubjectId;
            course.TeacherId = updated.TeacherId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();
            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
