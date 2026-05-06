using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnnouncementController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Announcement/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAnnouncementsByCourse(string courseId)
        {
            var announcements = await _context.Announcements
                .Where(a => a.CourseId == courseId)
                .Include(a => a.Lecturer)
                .OrderByDescending(a => a.DatePosted)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.Preview,
                    a.Label,
                    a.Color,
                    a.DatePosted,
                    lecturerName = a.Lecturer != null ? $"{a.Lecturer.FirstName} {a.Lecturer.LastName}" : "Unknown"
                })
                .ToListAsync();

            return Ok(announcements);
        }

        // POST: api/Announcement
        [HttpPost]
        public async Task<ActionResult<object>> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var announcement = new Announcement
            {
                CourseId = dto.CourseId,
                LecturerId = dto.LecturerId,
                Title = dto.Title,
                Preview = dto.Preview,
                Label = dto.Label,
                Color = dto.Color,
                DatePosted = DateTime.UtcNow
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            var lecturer = await _context.Users.FindAsync(announcement.LecturerId);
            return CreatedAtAction(nameof(GetAnnouncementsByCourse), new { courseId = dto.CourseId }, new
            {
                announcement.Id,
                announcement.Title,
                announcement.Preview,
                announcement.Label,
                announcement.Color,
                announcement.DatePosted,
                lecturerName = lecturer != null ? $"{lecturer.FirstName} {lecturer.LastName}" : "Unknown"
            });
        }

        // DELETE: api/Announcement/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAnnouncement(string id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null)
                return NotFound();

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CreateAnnouncementDto
    {
        public string CourseId { get; set; } = null!;
        public string LecturerId { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public string Preview { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }
}
