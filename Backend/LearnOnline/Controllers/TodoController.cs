using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TodoController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Todo/teacher/{teacherId}
        // Returns all todos assigned to or created by the given teacher
        [HttpGet("teacher/{teacherId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByTeacher(string teacherId)
        {
            var todos = await _context.TodoItems
                .Where(t => t.TeacherId == teacherId)
                .Include(t => t.CreatedByAdmin)
                .OrderBy(t => t.IsCompleted)
                .ThenBy(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.DueDate,
                    t.CourseCode,
                    t.IsCompleted,
                    t.CreatedAt,
                    t.TeacherId,
                    t.CreatedByAdminId,
                    createdByAdminName = t.CreatedByAdmin != null
                        ? $"{t.CreatedByAdmin.FirstName} {t.CreatedByAdmin.LastName}"
                        : null
                })
                .ToListAsync();

            return Ok(todos);
        }

        // POST: api/Todo
        // Creates a new todo – teacher-created (createdByAdminId = null) or admin-assigned
        [HttpPost]
        public async Task<ActionResult<object>> Create([FromBody] CreateTodoDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var teacherExists = await _context.Users.AnyAsync(u => u.Id == dto.TeacherId);
            if (!teacherExists)
                return NotFound(new { message = "Teacher not found." });

            if (dto.CreatedByAdminId != null)
            {
                var adminExists = await _context.Users.AnyAsync(u => u.Id == dto.CreatedByAdminId);
                if (!adminExists)
                    return NotFound(new { message = "Admin not found." });
            }

            var todo = new TodoItem
            {
                Title = dto.Title,
                DueDate = dto.DueDate,
                CourseCode = dto.CourseCode,
                TeacherId = dto.TeacherId,
                CreatedByAdminId = dto.CreatedByAdminId
            };

            _context.TodoItems.Add(todo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByTeacher), new { teacherId = todo.TeacherId }, new
            {
                todo.Id,
                todo.Title,
                todo.DueDate,
                todo.CourseCode,
                todo.IsCompleted,
                todo.CreatedAt,
                todo.TeacherId,
                todo.CreatedByAdminId
            });
        }

        // PATCH: api/Todo/{id}/toggle
        // Flips the IsCompleted flag on a single todo
        [HttpPatch("{id}/toggle")]
        public async Task<ActionResult<object>> Toggle(string id)
        {
            var todo = await _context.TodoItems.FindAsync(id);
            if (todo == null) return NotFound();

            todo.IsCompleted = !todo.IsCompleted;
            await _context.SaveChangesAsync();

            return Ok(new { todo.Id, todo.IsCompleted });
        }

        // DELETE: api/Todo/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var todo = await _context.TodoItems.FindAsync(id);
            if (todo == null) return NotFound();

            _context.TodoItems.Remove(todo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // ── DTOs ───────────────────────────────────────────────────────────────────
    public class CreateTodoDto
    {
        public string Title { get; set; } = null!;
        public string? DueDate { get; set; }
        public string? CourseCode { get; set; }
        public string TeacherId { get; set; } = null!;
        public string? CreatedByAdminId { get; set; }
    }
}
