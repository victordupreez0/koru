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
        public async Task<ActionResult<IEnumerable<Announcement>>> GetAnnouncementsByCourse(string courseId)
        {
            var announcements = await _context.Announcements
                .Where(a => a.CourseId == courseId)
                .OrderByDescending(a => a.DatePosted)
                .ToListAsync();

            return Ok(announcements);
        }
    }
}
