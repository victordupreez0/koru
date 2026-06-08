using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AttendanceController(AppDbContext context) { _context = context; }

        // GET /api/Attendance/course/{courseId} – all attendance records for a course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetByCourse(string courseId)
        {
            var records = await _context.Attendances
                .Include(a => a.Student)
                .Where(a => a.CourseId == courseId)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.Status,
                    a.SessionType,
                    a.Time,
                    a.CourseId,
                    a.StudentId,
                    a.RecordedById,
                    a.RecordedAt,
                    student = a.Student == null ? null : new
                    {
                        a.Student.Id,
                        a.Student.FirstName,
                        a.Student.LastName,
                        a.Student.Email
                    }
                })
                .ToListAsync();

            return Ok(records);
        }

        // POST /api/Attendance/bulk – record a whole session at once
        [HttpPost("bulk")]
        public async Task<ActionResult<IEnumerable<object>>> BulkCreate([FromBody] List<CreateAttendanceDto> dtos)
        {
            if (dtos == null || dtos.Count == 0)
                return BadRequest(new { message = "No records provided." });

            var records = dtos.Select(dto => new Attendance
            {
                CourseId = dto.CourseId,
                StudentId = dto.StudentId,
                Date = dto.Date,
                Status = dto.Status,
                SessionType = dto.SessionType,
                Time = dto.Time,
                RecordedById = dto.RecordedById,
                RecordedAt = DateTime.UtcNow
            }).ToList();

            _context.Attendances.AddRange(records);
            await _context.SaveChangesAsync();

            return Ok(records.Select(r => new
            {
                r.Id,
                r.CourseId,
                r.StudentId,
                r.Date,
                r.Status,
                r.SessionType,
                r.Time,
                r.RecordedAt
            }));
        }

        // PUT /api/Attendance/{id} – update a single record's status
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateAttendanceDto dto)
        {
            var record = await _context.Attendances.FindAsync(id);
            if (record == null) return NotFound();
            record.Status = dto.Status;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/Attendance/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var record = await _context.Attendances.FindAsync(id);
            if (record == null) return NotFound();
            _context.Attendances.Remove(record);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CreateAttendanceDto
    {
        public string CourseId { get; set; } = null!;
        public string StudentId { get; set; } = null!;
        public DateTime Date { get; set; }
        public string Status { get; set; } = "Present";
        public string SessionType { get; set; } = "Lecture";
        public string? Time { get; set; }
        public string RecordedById { get; set; } = null!;
    }

    public class UpdateAttendanceDto
    {
        public string Status { get; set; } = "Present";
    }
}
