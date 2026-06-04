using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CheckInController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly Random _rng = new();

        public CheckInController(AppDbContext context) { _context = context; }

        // POST /api/CheckIn/sessions – teacher opens (or retrieves existing) session
        [HttpPost("sessions")]
        public async Task<ActionResult<object>> OpenSession([FromBody] OpenSessionDto? dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Request body is missing." });
                if (string.IsNullOrWhiteSpace(dto.CourseId))
                    return BadRequest(new { message = "CourseId is required." });
                if (string.IsNullOrWhiteSpace(dto.TeacherId))
                    return BadRequest(new { message = "TeacherId is required." });

                var courseExists = await _context.Courses.AnyAsync(c => c.Id == dto.CourseId);
                if (!courseExists)
                    return BadRequest(new { message = $"Course not found: {dto.CourseId}" });

                var autoCloseAt = dto.AutoCloseMinutes.HasValue
                    ? DateTime.UtcNow.AddMinutes(dto.AutoCloseMinutes.Value)
                    : (DateTime?)null;

                // Return existing open session, updating settings in case they changed
                var existing = await _context.CheckInSessions
                    .FirstOrDefaultAsync(s => s.CourseId == dto.CourseId && s.IsOpen);

                if (existing != null)
                {
                    existing.LateAfterMinutes = dto.LateAfterMinutes;
                    existing.AutoCloseAt      = autoCloseAt;
                    await _context.SaveChangesAsync();
                    return Ok(MapSession(existing));
                }

                // Reopen today's closed session (same code, reset absent records, apply new settings)
                var today = DateTime.UtcNow.Date;
                var todayClosed = await _context.CheckInSessions
                    .Where(s => s.CourseId == dto.CourseId && !s.IsOpen && s.Date == today)
                    .OrderByDescending(s => s.OpenedAt)
                    .FirstOrDefaultAsync();

                if (todayClosed != null)
                {
                    todayClosed.IsOpen           = true;
                    todayClosed.ClosedAt         = null;
                    todayClosed.LateAfterMinutes  = dto.LateAfterMinutes;
                    todayClosed.AutoCloseAt       = autoCloseAt;

                    var autoAbsent = await _context.Attendances
                        .Where(a => a.CheckInSessionId == todayClosed.Id && a.Status == "Absent")
                        .ToListAsync();
                    _context.Attendances.RemoveRange(autoAbsent);

                    await _context.SaveChangesAsync();
                    return Ok(MapSession(todayClosed));
                }

                // No session today — create a brand new one
                var session = new CheckInSession
                {
                    Code             = _rng.Next(1000, 9999).ToString(),
                    CourseId         = dto.CourseId,
                    TeacherId        = dto.TeacherId,
                    Date             = DateTime.UtcNow.Date,
                    SessionType      = dto.SessionType ?? "Lecture",
                    LateAfterMinutes = dto.LateAfterMinutes,
                    AutoCloseAt      = autoCloseAt,
                };
                _context.CheckInSessions.Add(session);
                await _context.SaveChangesAsync();
                return Ok(MapSession(session));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // PUT /api/CheckIn/sessions/{id}/close – teacher closes session and marks no-shows absent
        [HttpPut("sessions/{id}/close")]
        public async Task<IActionResult> CloseSession(string id)
        {
            var session = await _context.CheckInSessions.FindAsync(id);
            if (session == null) return NotFound();

            session.IsOpen   = false;
            session.ClosedAt = DateTime.UtcNow;

            // Find students who were enrolled but never checked in
            var checkedInIds = await _context.Attendances
                .Where(a => a.CheckInSessionId == id)
                .Select(a => a.StudentId)
                .ToListAsync();

            var absentStudents = await _context.Enrollments
                .Where(e => e.CourseId == session.CourseId &&
                            e.Status == "Active" &&
                            !checkedInIds.Contains(e.StudentId))
                .Select(e => e.StudentId)
                .ToListAsync();

            foreach (var studentId in absentStudents)
            {
                _context.Attendances.Add(new Attendance
                {
                    CourseId         = session.CourseId,
                    StudentId        = studentId,
                    Date             = session.Date,
                    Status           = "Absent",
                    SessionType      = session.SessionType,
                    Time             = session.ClosedAt?.ToString("HH:mm"),
                    RecordedById     = session.TeacherId,
                    CheckInSessionId = session.Id,
                    RecordedAt       = DateTime.UtcNow,
                });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET /api/CheckIn/sessions/active/{courseId} – active session for a course
        [HttpGet("sessions/active/{courseId}")]
        public async Task<ActionResult<object>> GetActiveSession(string courseId)
        {
            var session = await _context.CheckInSessions
                .FirstOrDefaultAsync(s => s.CourseId == courseId && s.IsOpen);
            if (session == null) return NotFound();
            return Ok(MapSession(session));
        }

        // GET /api/CheckIn/sessions/available/{studentId} – open sessions for student's enrolled courses
        [HttpGet("sessions/available/{studentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableForStudent(string studentId)
        {
            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status == "Active")
                .Select(e => e.CourseId)
                .ToListAsync();

            var sessions = await _context.CheckInSessions
                .Include(s => s.Course).ThenInclude(c => c!.Subject)
                .Where(s =>
                    s.IsOpen &&
                    enrolledCourseIds.Contains(s.CourseId) &&
                    !_context.Attendances.Any(a => a.StudentId == studentId && a.CheckInSessionId == s.Id))
                .Select(s => new
                {
                    s.Id,
                    s.CourseId,
                    s.SessionType,
                    s.OpenedAt,
                    courseName = s.Course != null && s.Course.Subject != null
                        ? s.Course.Subject.Name
                        : s.CourseId
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // GET /api/CheckIn/sessions/{id}/status – live roster for teacher
        [HttpGet("sessions/{id}/status")]
        public async Task<ActionResult<object>> GetSessionStatus(string id)
        {
            var session = await _context.CheckInSessions.FindAsync(id);
            if (session == null) return NotFound();

            // Auto-close if the scheduled time has passed
            if (session.IsOpen && session.AutoCloseAt.HasValue && DateTime.UtcNow >= session.AutoCloseAt.Value)
            {
                session.IsOpen   = false;
                session.ClosedAt = session.AutoCloseAt;

                var checkedIds = await _context.Attendances
                    .Where(a => a.CheckInSessionId == id)
                    .Select(a => a.StudentId)
                    .ToListAsync();

                var absentStudents = await _context.Enrollments
                    .Where(e => e.CourseId == session.CourseId &&
                                e.Status == "Active" &&
                                !checkedIds.Contains(e.StudentId))
                    .Select(e => e.StudentId)
                    .ToListAsync();

                foreach (var sid in absentStudents)
                    _context.Attendances.Add(new Attendance
                    {
                        CourseId         = session.CourseId,
                        StudentId        = sid,
                        Date             = session.Date,
                        Status           = "Absent",
                        SessionType      = session.SessionType,
                        Time             = session.ClosedAt?.ToString("HH:mm"),
                        RecordedById     = session.TeacherId,
                        CheckInSessionId = session.Id,
                        RecordedAt       = DateTime.UtcNow,
                    });

                await _context.SaveChangesAsync();
            }

            var enrolled = await _context.Enrollments
                .Include(e => e.Student)
                .Where(e => e.CourseId == session.CourseId && e.Status == "Active")
                .Select(e => new { e.StudentId, e.Student!.FirstName, e.Student.LastName })
                .ToListAsync();

            var checkedInRecords = await _context.Attendances
                .Where(a => a.CheckInSessionId == id)
                .Select(a => new { a.StudentId, a.RecordedAt })
                .ToListAsync();

            var checkedInMap = checkedInRecords.ToDictionary(x => x.StudentId, x => x.RecordedAt);

            var checkedIn = enrolled
                .Where(e => checkedInMap.ContainsKey(e.StudentId))
                .Select(e => new
                {
                    e.StudentId,
                    name       = $"{e.FirstName} {e.LastName}",
                    checkedInAt = checkedInMap[e.StudentId]
                })
                .OrderBy(e => e.checkedInAt)
                .ToList<object>();

            var notCheckedIn = enrolled
                .Where(e => !checkedInMap.ContainsKey(e.StudentId))
                .Select(e => new { e.StudentId, name = $"{e.FirstName} {e.LastName}" })
                .OrderBy(e => e.name)
                .ToList<object>();

            return Ok(new
            {
                session.Id,
                session.Code,
                session.CourseId,
                session.SessionType,
                session.IsOpen,
                session.OpenedAt,
                session.ClosedAt,
                totalEnrolled = enrolled.Count,
                checkedIn,
                notCheckedIn,
            });
        }

        // POST /api/CheckIn/sessions/{id}/mark/{studentId} – teacher manually marks a student present
        [HttpPost("sessions/{id}/mark/{studentId}")]
        public async Task<ActionResult<object>> MarkPresent(string id, string studentId)
        {
            var session = await _context.CheckInSessions.FindAsync(id);
            if (session == null) return NotFound(new { message = "Session not found." });
            if (!session.IsOpen)  return BadRequest(new { message = "Session is closed." });

            var alreadyIn = await _context.Attendances.AnyAsync(
                a => a.CheckInSessionId == id && a.StudentId == studentId);
            if (alreadyIn) return BadRequest(new { message = "Already marked present." });

            _context.Attendances.Add(new Attendance
            {
                CourseId         = session.CourseId,
                StudentId        = studentId,
                Date             = session.Date,
                Status           = "Present",
                SessionType      = session.SessionType,
                Time             = DateTime.UtcNow.ToString("HH:mm"),
                RecordedById     = session.TeacherId,
                CheckInSessionId = session.Id,
                RecordedAt       = DateTime.UtcNow,
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked present." });
        }

        // POST /api/CheckIn/checkin – student submits code
        [HttpPost("checkin")]
        public async Task<ActionResult<object>> CheckIn([FromBody] CheckInDto dto)
        {
            var session = await _context.CheckInSessions
                .FirstOrDefaultAsync(s => s.Code == dto.Code && s.IsOpen);
            if (session == null)
                return BadRequest(new { message = "Invalid or expired code." });

            var enrolled = await _context.Enrollments.AnyAsync(
                e => e.CourseId == session.CourseId &&
                     e.StudentId == dto.StudentId &&
                     e.Status == "Active");
            if (!enrolled)
                return BadRequest(new { message = "You are not enrolled in this course." });

            var alreadyIn = await _context.Attendances.AnyAsync(
                a => a.CheckInSessionId == session.Id && a.StudentId == dto.StudentId);
            if (alreadyIn)
                return BadRequest(new { message = "Already checked in." });

            var minutesSinceOpen = (DateTime.UtcNow - session.OpenedAt).TotalMinutes;
            var status = session.LateAfterMinutes.HasValue && minutesSinceOpen > session.LateAfterMinutes.Value
                ? "Late"
                : "Present";

            var record = new Attendance
            {
                CourseId         = session.CourseId,
                StudentId        = dto.StudentId,
                Date             = session.Date,
                Status           = status,
                SessionType      = session.SessionType,
                Time             = DateTime.UtcNow.ToString("HH:mm"),
                RecordedById     = dto.StudentId,
                CheckInSessionId = session.Id,
                RecordedAt       = DateTime.UtcNow,
            };
            _context.Attendances.Add(record);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Checked in successfully.", status, attendanceId = record.Id });
        }

        private static object MapSession(CheckInSession s) => new
        {
            s.Id, s.Code, s.CourseId, s.SessionType,
            s.IsOpen, s.OpenedAt, s.ClosedAt,
            s.LateAfterMinutes, s.AutoCloseAt
        };
    }

    public class OpenSessionDto
    {
        public string CourseId        { get; set; } = null!;
        public string TeacherId       { get; set; } = null!;
        public string? SessionType    { get; set; }
        // Minutes after opening before check-ins are marked Late (null = never)
        public int? LateAfterMinutes  { get; set; }
        // Auto-close the session this many minutes from now (null = manual only)
        public int? AutoCloseMinutes  { get; set; }
    }

    public class CheckInDto
    {
        public string Code      { get; set; } = null!;
        public string StudentId { get; set; } = null!;
    }
}
