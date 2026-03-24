using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;
        public MaterialController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetAll()
        {
            return await _context.Materials
                .Include(m => m.Course)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetById(string id)
        {
            var material = await _context.Materials
                .Include(m => m.Course)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (material == null) return NotFound();
            return material;
        }

        [HttpPost]
        public async Task<ActionResult<Material>> Create(Material material)
        {
            material.Id = Guid.NewGuid().ToString();
            material.UploadedAt = DateTime.UtcNow;
            _context.Materials.Add(material);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = material.Id }, material);
        }

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
