using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Course API – CRUD for course offerings
    // Each course links a Subject to a Teacher for a specific term and year
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CourseController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Course – return all courses with their Subject and Teacher
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetAll()
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Teacher)
                .ToListAsync();
        }

        // GET /api/Course/{id} – return a single course by ID
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

        // GET /api/Course/teacher/{teacherId} – return all courses assigned to a teacher
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<Course>>> GetByTeacher(string teacherId)
        {
            var courses = await _context.Courses
                .Include(c => c.Subject)
                .Where(c => c.TeacherId == teacherId)
                .ToListAsync();
            return courses;
        }

        // POST /api/Course – create a new course offering
        [HttpPost]
        public async Task<ActionResult<Course>> Create(Course course)
        {
            course.Id = Guid.NewGuid().ToString();
            course.CreatedAt = DateTime.UtcNow;
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
        }

        // PUT /api/Course/{id} – update an existing course's details
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
            course.IsVisible = updated.IsVisible;
            course.Degree = updated.Degree;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT /api/Course/{id}/visibility – update course visibility status
        [HttpPut("{id}/visibility")]
        public async Task<IActionResult> UpdateVisibility(string id, [FromBody] bool isVisible)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.IsVisible = isVisible;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Course/{id} – permanently remove a course
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
