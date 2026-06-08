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

        // GET /api/Attendance/course/{courseId} – all attendance records for a course (simple flat model)
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

        // POST /api/Attendance/bulk – record a whole session at once (simple flat model)
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

        // POST /api/Attendance/session – Create a cohort attendance session
        [HttpPost("session")]
        public async Task<ActionResult<AttendanceSession>> CreateSession(AttendanceSession session)
        {
            session.Id = Guid.NewGuid().ToString();
            session.SessionDate = DateTime.SpecifyKind(session.SessionDate, DateTimeKind.Utc);
            _context.AttendanceSessions.Add(session);
            await _context.SaveChangesAsync();
            return Ok(session);
        }

        // GET /api/Attendance/session/{sessionId} – Get details of a session including student records
        [HttpGet("session/{sessionId}")]
        public async Task<ActionResult<object>> GetSessionDetails(string sessionId)
        {
            var session = await _context.AttendanceSessions
                .Include(s => s.ClassGroup)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound();

            var records = await _context.AttendanceRecords
                .Include(r => r.Student)
                .Where(r => r.AttendanceSessionId == sessionId)
                .Select(r => new
                {
                    r.Id,
                    r.StudentId,
                    StudentName = r.Student != null ? $"{r.Student.FirstName} {r.Student.LastName}" : "Unknown Student",
                    r.Status,
                    r.Remarks
                })
                .ToListAsync();

            return Ok(new
            {
                session.Id,
                session.ClassGroupId,
                GroupName = session.ClassGroup?.Name,
                session.SessionDate,
                session.LecturerId,
                Records = records
            });
        }

        // POST /api/Attendance/submit – Submit a batch of student attendance records for a session
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitAttendance([FromBody] List<AttendanceRecord> records)
        {
            if (records == null || !records.Any()) return BadRequest("No records provided.");

            var sessionId = records.First().AttendanceSessionId;

            var existing = _context.AttendanceRecords.Where(r => r.AttendanceSessionId == sessionId);
            _context.AttendanceRecords.RemoveRange(existing);

            foreach (var record in records)
            {
                record.Id = Guid.NewGuid().ToString();
                _context.AttendanceRecords.Add(record);
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Attendance successfully saved." });
        }

        // GET /api/Attendance/sessions/cohort/{cohortId} – Get all sessions for a cohort
        [HttpGet("sessions/cohort/{cohortId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCohortSessions(string cohortId)
        {
            var sessions = await _context.AttendanceSessions
                .Include(s => s.Lecturer)
                .Where(s => s.ClassGroupId == cohortId)
                .OrderByDescending(s => s.SessionDate)
                .Select(s => new
                {
                    s.Id,
                    s.SessionDate,
                    s.LecturerId,
                    LecturerName = s.Lecturer != null ? $"{s.Lecturer.FirstName} {s.Lecturer.LastName}" : "William Basson",
                    TotalStudents = _context.AttendanceRecords.Count(r => r.AttendanceSessionId == s.Id),
                    PresentCount = _context.AttendanceRecords.Count(r => r.AttendanceSessionId == s.Id && (r.Status == "Present" || r.Status == "Late"))
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // GET /api/Attendance/stats/course/{courseId} – Cohort attendance statistics for a course
        [HttpGet("stats/course/{courseId}")]
        public async Task<ActionResult<object>> GetCourseStats(string courseId)
        {
            var cohorts = await _context.ClassGroups
                .Where(g => g.CourseId == courseId)
                .ToListAsync();

            var cohortStats = new List<object>();

            foreach (var cohort in cohorts)
            {
                var sessions = await _context.AttendanceSessions
                    .Where(s => s.ClassGroupId == cohort.Id)
                    .Select(s => s.Id)
                    .ToListAsync();

                if (!sessions.Any())
                {
                    cohortStats.Add(new { cohort.Id, cohort.Name, AttendanceRate = 100.0, TotalSessions = 0 });
                    continue;
                }

                var totalRecords = await _context.AttendanceRecords
                    .Where(r => sessions.Contains(r.AttendanceSessionId))
                    .CountAsync();

                var presentCount = await _context.AttendanceRecords
                    .Where(r => sessions.Contains(r.AttendanceSessionId) && (r.Status == "Present" || r.Status == "Late"))
                    .CountAsync();

                double rate = totalRecords == 0 ? 100.0 : Math.Round(((double)presentCount / totalRecords) * 100, 1);

                cohortStats.Add(new { cohort.Id, cohort.Name, AttendanceRate = rate, TotalSessions = sessions.Count });
            }

            return Ok(cohortStats);
        }

        // GET /api/Attendance/stats/student/{studentId} – Overall attendance stats for a student
        [HttpGet("stats/student/{studentId}")]
        public async Task<ActionResult<object>> GetStudentStats(string studentId)
        {
            var student = await _context.Users.FindAsync(studentId);
            if (student == null) return NotFound("Student not found.");

            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                .ThenInclude(c => c!.Subject)
                .Where(e => e.StudentId == studentId && e.Status == "Active")
                .ToListAsync();

            var courseStats = new List<object>();
            int grandTotal = 0;
            int grandPresent = 0;

            foreach (var enrollment in enrollments)
            {
                if (enrollment.ClassGroupId == null) continue;

                var sessions = await _context.AttendanceSessions
                    .Where(s => s.ClassGroupId == enrollment.ClassGroupId)
                    .Select(s => new { s.Id, s.SessionDate })
                    .ToListAsync();

                var sessionIds = sessions.Select(s => s.Id).ToList();

                var records = await _context.AttendanceRecords
                    .Where(r => r.StudentId == studentId && sessionIds.Contains(r.AttendanceSessionId))
                    .ToListAsync();

                int total = sessions.Count;
                int present = records.Count(r => r.Status == "Present" || r.Status == "Late");

                grandTotal += total;
                grandPresent += present;

                double rate = total == 0 ? 100.0 : Math.Round(((double)present / total) * 100, 1);

                courseStats.Add(new
                {
                    CourseId = enrollment.CourseId,
                    SubjectCode = enrollment.Course?.Subject?.Code ?? "UNKNOWN",
                    SubjectName = enrollment.Course?.Subject?.Name ?? "Unknown Course",
                    AttendanceRate = rate,
                    TotalSessions = total,
                    AttendedSessions = present
                });
            }

            double overallRate = grandTotal == 0 ? 100.0 : Math.Round(((double)grandPresent / grandTotal) * 100, 1);

            return Ok(new
            {
                StudentId = studentId,
                StudentName = $"{student.FirstName} {student.LastName}",
                OverallAttendanceRate = overallRate,
                TotalClassesScheduled = grandTotal,
                TotalClassesAttended = grandPresent,
                Courses = courseStats
            });
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
