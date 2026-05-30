using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // CourseModule API – CRUD for course module sections
    // Teachers manage sections; students read them via CourseModuleItem
    [ApiController]
    [Route("api/[controller]")]
    public class CourseModuleController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CourseModuleController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/CourseModule – return all modules with their items (admin / debug use)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseModule>>> GetAll()
        {
            return await _context.CourseModules
                .Include(m => m.Items)
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }

        // GET /api/CourseModule/course/{courseId} – return all module sections for a course, ordered, with nested items
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<CourseModule>>> GetByCourse(string courseId)
        {
            return await _context.CourseModules
                .Where(m => m.CourseId == courseId)
                .Include(m => m.Items.OrderBy(i => i.SortOrder))
                .OrderBy(m => m.SortOrder)
                .ToListAsync();
        }

        // GET /api/CourseModule/{id} – return a single module with its items
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseModule>> GetById(string id)
        {
            var module = await _context.CourseModules
                .Include(m => m.Items.OrderBy(i => i.SortOrder))
                .FirstOrDefaultAsync(m => m.Id == id);
            if (module == null) return NotFound();
            return module;
        }

        // POST /api/CourseModule – create a new module section for a course
        [HttpPost]
        public async Task<ActionResult<CourseModule>> Create(CourseModule module)
        {
            module.Id = Guid.NewGuid().ToString();
            module.CreatedAt = DateTime.UtcNow;

            // Set SortOrder to the end of the existing modules for this course
            var maxOrder = await _context.CourseModules
                .Where(m => m.CourseId == module.CourseId)
                .Select(m => (int?)m.SortOrder)
                .MaxAsync() ?? -1;
            module.SortOrder = maxOrder + 1;

            _context.CourseModules.Add(module);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = module.Id }, module);
        }

        // PUT /api/CourseModule/{id} – update a module section's metadata
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, CourseModule updated)
        {
            var module = await _context.CourseModules.FindAsync(id);
            if (module == null) return NotFound();

            module.Title = updated.Title;
            module.IsPublished = updated.IsPublished;
            module.IsOpen = updated.IsOpen;
            module.SortOrder = updated.SortOrder;
            module.Prefix = updated.Prefix;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT /api/CourseModule/{id}/content – save the NovelEditor page content for a module's own page
        [HttpPut("{id}/content")]
        public async Task<IActionResult> UpdateContent(string id, [FromBody] ContentUpdateRequest request)
        {
            var module = await _context.CourseModules.FindAsync(id);
            if (module == null) return NotFound();

            module.Content = request.Content;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/CourseModule/{id} – remove a module section and all its nested items
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var module = await _context.CourseModules.FindAsync(id);
            if (module == null) return NotFound();

            // Explicitly remove nested items before deleting the section
            var items = await _context.CourseModuleItems
                .Where(i => i.ModuleId == id)
                .ToListAsync();
            _context.CourseModuleItems.RemoveRange(items);
            _context.CourseModules.Remove(module);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // Payload for the /content sub-route
    public class ContentUpdateRequest
    {
        public string? Content { get; set; }
    }
}
