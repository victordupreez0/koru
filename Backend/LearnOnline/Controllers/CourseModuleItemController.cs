using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // CourseModuleItem API – CRUD for items nested inside a CourseModule section
    // Items can be rich-text documents, external links, or file attachments
    [ApiController]
    [Route("api/[controller]")]
    public class CourseModuleItemController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CourseModuleItemController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/CourseModuleItem/{id} – return a single item by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseModuleItem>> GetById(string id)
        {
            var item = await _context.CourseModuleItems.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        // GET /api/CourseModuleItem/module/{moduleId} – return all items for a given module section
        [HttpGet("module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<CourseModuleItem>>> GetByModule(string moduleId)
        {
            return await _context.CourseModuleItems
                .Where(i => i.ModuleId == moduleId)
                .OrderBy(i => i.SortOrder)
                .ToListAsync();
        }

        // POST /api/CourseModuleItem – create a new item inside a module section
        [HttpPost]
        public async Task<ActionResult<CourseModuleItem>> Create(CourseModuleItem item)
        {
            item.Id = Guid.NewGuid().ToString();
            item.CreatedAt = DateTime.UtcNow;

            // Set SortOrder to the end of existing items in the same module
            var maxOrder = await _context.CourseModuleItems
                .Where(i => i.ModuleId == item.ModuleId)
                .Select(i => (int?)i.SortOrder)
                .MaxAsync() ?? -1;
            item.SortOrder = maxOrder + 1;

            _context.CourseModuleItems.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        // PUT /api/CourseModuleItem/{id} – update an item's label, type, or publish state
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, CourseModuleItem updated)
        {
            var item = await _context.CourseModuleItems.FindAsync(id);
            if (item == null) return NotFound();

            item.Label = updated.Label;
            item.Type = updated.Type;
            item.IsPublished = updated.IsPublished;
            item.IsExternal = updated.IsExternal;
            item.SortOrder = updated.SortOrder;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT /api/CourseModuleItem/{id}/content – save the NovelEditor page content for a document item
        [HttpPut("{id}/content")]
        public async Task<IActionResult> UpdateContent(string id, [FromBody] ItemContentUpdateRequest request)
        {
            var item = await _context.CourseModuleItems.FindAsync(id);
            if (item == null) return NotFound();

            item.Content = request.Content;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/CourseModuleItem/{id} – permanently remove an item
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var item = await _context.CourseModuleItems.FindAsync(id);
            if (item == null) return NotFound();
            _context.CourseModuleItems.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // Payload for the /content sub-route
    public class ItemContentUpdateRequest
    {
        public string? Content { get; set; }
    }
}
