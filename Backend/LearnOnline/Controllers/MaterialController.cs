using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    // Material API – CRUD for course materials (slides, PDFs, videos, etc.)
    // Teachers upload materials; students access them through the course view
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MaterialController(AppDbContext context)
        {
            _context = context;
        }

        // GET /api/Material – return all materials with their related Course
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetAll()
        {
            return await _context.Materials
                .Include(m => m.Course)
                .ToListAsync();
        }

        // GET /api/Material/{id} – return a single material by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetById(string id)
        {
            var material = await _context.Materials
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (material == null) return NotFound();
            return material;
        }

        // POST /api/Material – upload a new material to a course
        [HttpPost]
        public async Task<ActionResult<Material>> Create(Material material)
        {
            material.Id = Guid.NewGuid().ToString();
            material.UploadedAt = DateTime.UtcNow;
            _context.Materials.Add(material);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = material.Id }, material);
        }

        // PUT /api/Material/{id} – update a material's metadata or file URL
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Material updated)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();

            material.Title = updated.Title;
            material.FileUrl = updated.FileUrl;
            material.FileType = updated.FileType;
            material.UploadedBy = updated.UploadedBy;
            material.CourseId = updated.CourseId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Material/{id} – permanently remove a material
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();
            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
