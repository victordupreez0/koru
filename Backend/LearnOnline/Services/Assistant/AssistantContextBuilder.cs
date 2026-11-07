using System.Text;
using LearnOnline.Data;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Services.Assistant;

/// <summary>What was actually loaded for the user, used for prompt text, stage words and context.summary.</summary>
public sealed class AssistantContext
{
    public string Text { get; init; } = string.Empty;
    public bool IsTeacher { get; init; }
    public int Courses { get; init; }
    public int Assignments { get; init; }
    public int RecentGrades { get; init; }
    public bool HasAttendance { get; init; }
    public bool HasGradingProgress { get; init; }
    public int RecentSessions { get; init; }

    private record Item(string Text, bool Possessive);

    /// <summary>"your 3 courses, 8 assignments, grading progress and 2 earlier messages" (empty if nothing).</summary>
    public string BuildSummary(int earlierMessages)
    {
        var items = new List<Item>();
        if (Courses > 0) items.Add(new($"{Courses} {(Courses == 1 ? "course" : "courses")}", true));
        if (Assignments > 0) items.Add(new($"{Assignments} {(Assignments == 1 ? "assignment" : "assignments")}", true));
        if (RecentGrades > 0) items.Add(new($"{RecentGrades} recent {(RecentGrades == 1 ? "grade" : "grades")}", true));
        if (HasGradingProgress) items.Add(new("grading progress", true));
        if (RecentSessions > 0) items.Add(new($"{RecentSessions} recent {(RecentSessions == 1 ? "session" : "sessions")}", true));
        if (HasAttendance) items.Add(new("your attendance", false));
        if (earlierMessages > 0) items.Add(new($"{earlierMessages} earlier {(earlierMessages == 1 ? "message" : "messages")}", false));
        if (items.Count == 0) return string.Empty;

        var texts = items.Select(i => i.Text).ToList();
        if (items[0].Possessive) texts[0] = "your " + texts[0];
        return texts.Count == 1
            ? texts[0]
            : string.Join(", ", texts.Take(texts.Count - 1)) + " and " + texts[^1];
    }

    /// <summary>Stage text for "reading".</summary>
    public string BuildReadingText(int earlierMessages)
    {
        var summary = BuildSummary(earlierMessages);
        return summary.Length == 0 ? "Reading your message" : "Reading your message alongside " + summary;
    }
}

public interface IAssistantContextBuilder
{
    Task<AssistantContext> LoadAsync(string? userId, string? role, CancellationToken ct);
}

/// <summary>Loads the user's academic data from the database (same data and caps as before).</summary>
public sealed class AssistantContextBuilder : IAssistantContextBuilder
{
    private readonly AppDbContext _context;
    private readonly ILogger<AssistantContextBuilder> _logger;

    public AssistantContextBuilder(AppDbContext context, ILogger<AssistantContextBuilder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AssistantContext> LoadAsync(string? userId, string? role, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(role))
            return new AssistantContext();

        var normalizedRole = role.Trim().ToLowerInvariant();
        var isTeacher = normalizedRole == "teacher" || normalizedRole == "admin";
        var ctx = new StringBuilder();
        int courseCount = 0, assignmentCount = 0, gradeCount = 0, sessionCount = 0;
        bool hasAttendance = false, hasGrading = false;

        try
        {
            if (isTeacher)
            {
                var courses = await _context.Courses
                    .Include(c => c.Subject)
                    .Where(c => c.TeacherId == userId)
                    .Take(8)
                    .ToListAsync(ct);
                courseCount = courses.Count;

                ctx.AppendLine("COURSES:");
                if (courses.Count == 0) { ctx.AppendLine("None."); }
                else { foreach (var c in courses) ctx.AppendLine($"- {c.Subject?.Code} {c.Subject?.Name} ({c.Term} {c.Year})"); }

                var courseIds = courses.Select(c => c.Id).ToList();

                var assignments = await _context.Assignments
                    .Where(a => courseIds.Contains(a.CourseId))
                    .OrderBy(a => a.DueDate)
                    .Take(10)
                    .ToListAsync(ct);
                assignmentCount = assignments.Count;
                hasGrading = assignments.Count > 0;

                ctx.AppendLine("ASSIGNMENTS:");
                if (assignments.Count == 0) { ctx.AppendLine("None."); }
                else
                {
                    foreach (var a in assignments)
                    {
                        var due = a.DueDate.HasValue ? a.DueDate.Value.ToString("yyyy-MM-dd") : "TBD";
                        ctx.AppendLine($"- \"{a.Title}\" ({a.Type}) due {due}, max {a.MaxPoints}pts, closed={a.IsClosed}");
                    }
                }

                var assignmentIds = assignments.Select(a => a.Id).ToList();
                var submissionCounts = await _context.Submissions
                    .Where(s => assignmentIds.Contains(s.AssignmentId))
                    .GroupBy(s => s.AssignmentId)
                    .Select(g => new { AssignmentId = g.Key, Total = g.Count() })
                    .ToListAsync(ct);

                var submissionIds = await _context.Submissions
                    .Where(s => assignmentIds.Contains(s.AssignmentId))
                    .Select(s => s.Id)
                    .ToListAsync(ct);

                var gradedCounts = await _context.Grades
                    .Where(g => submissionIds.Contains(g.SubmissionId))
                    .Join(_context.Submissions, g => g.SubmissionId, s => s.Id, (g, s) => s.AssignmentId)
                    .GroupBy(aid => aid)
                    .Select(g => new { AssignmentId = g.Key, Graded = g.Count() })
                    .ToListAsync(ct);

                ctx.AppendLine("GRADING:");
                foreach (var a in assignments)
                {
                    var total = submissionCounts.FirstOrDefault(x => x.AssignmentId == a.Id)?.Total ?? 0;
                    var graded = gradedCounts.FirstOrDefault(x => x.AssignmentId == a.Id)?.Graded ?? 0;
                    ctx.AppendLine($"- \"{a.Title}\": {graded}/{total} graded");
                }

                var sessions = await _context.AttendanceSessions
                    .Include(s => s.ClassGroup)
                    .Where(s => s.LecturerId == userId)
                    .OrderByDescending(s => s.SessionDate)
                    .Take(5)
                    .ToListAsync(ct);
                sessionCount = sessions.Count;

                ctx.AppendLine("RECENT ATTENDANCE:");
                if (sessions.Count == 0) { ctx.AppendLine("None."); }
                else
                {
                    var sessionIds = sessions.Select(s => s.Id).ToList();
                    var records = await _context.AttendanceRecords
                        .Where(r => sessionIds.Contains(r.AttendanceSessionId))
                        .ToListAsync(ct);

                    foreach (var s in sessions)
                    {
                        var recs = records.Where(r => r.AttendanceSessionId == s.Id).ToList();
                        var present = recs.Count(r => r.Status == "Present" || r.Status == "Late");
                        var total = recs.Count;
                        var rate = total > 0 ? (double)present / total * 100 : 100;
                        ctx.AppendLine($"- {s.SessionDate:yyyy-MM-dd} {s.ClassGroup?.Name}: {present}/{total} present ({rate:F0}%)");
                    }
                }

                var cohorts = await _context.ClassGroups
                    .Include(g => g.Course).ThenInclude(c => c.Subject)
                    .Where(g => courseIds.Contains(g.CourseId))
                    .Take(8)
                    .ToListAsync(ct);

                ctx.AppendLine("COHORTS:");
                if (cohorts.Count == 0) { ctx.AppendLine("None."); }
                else
                {
                    foreach (var g in cohorts)
                    {
                        var enrolled = await _context.Enrollments.CountAsync(e => e.CourseId == g.CourseId, ct);
                        ctx.AppendLine($"- {g.Name} ({g.Course?.Subject?.Code}): {enrolled} students");
                    }
                }
            }
            else
            {
                var enrollments = await _context.Enrollments
                    .Include(e => e.Course).ThenInclude(c => c.Subject)
                    .Where(e => e.StudentId == userId)
                    .Take(8)
                    .ToListAsync(ct);
                courseCount = enrollments.Count;

                var courseIds = enrollments.Select(e => e.CourseId).ToList();

                ctx.AppendLine("ENROLLED COURSES:");
                if (enrollments.Count == 0) { ctx.AppendLine("None."); }
                else { foreach (var e in enrollments) ctx.AppendLine($"- {e.Course?.Subject?.Code} {e.Course?.Subject?.Name}"); }

                var assignments = await _context.Assignments
                    .Where(a => courseIds.Contains(a.CourseId))
                    .OrderBy(a => a.DueDate)
                    .Take(8)
                    .ToListAsync(ct);
                assignmentCount = assignments.Count;

                ctx.AppendLine("ASSIGNMENTS:");
                if (assignments.Count == 0) { ctx.AppendLine("None."); }
                else
                {
                    foreach (var a in assignments)
                    {
                        var due = a.DueDate.HasValue ? a.DueDate.Value.ToString("yyyy-MM-dd") : "TBD";
                        ctx.AppendLine($"- \"{a.Title}\" due {due}, max {a.MaxPoints}pts, closed={a.IsClosed}");
                    }
                }

                var submissions = await _context.Submissions
                    .Include(s => s.Assignment)
                    .Where(s => s.StudentId == userId)
                    .OrderByDescending(s => s.SubmittedAt)
                    .Take(10)
                    .ToListAsync(ct);
                gradeCount = submissions.Count;

                var subIds = submissions.Select(s => s.Id).ToList();
                var grades = await _context.Grades
                    .Where(g => subIds.Contains(g.SubmissionId))
                    .ToListAsync(ct);

                ctx.AppendLine("RECENT GRADES:");
                if (submissions.Count == 0) { ctx.AppendLine("None."); }
                else
                {
                    foreach (var s in submissions)
                    {
                        var g = grades.FirstOrDefault(x => x.SubmissionId == s.Id);
                        var score = g?.PointsEarned.HasValue == true ? $"{g.PointsEarned}/{s.Assignment?.MaxPoints}" : "pending";
                        ctx.AppendLine($"- \"{s.Assignment?.Title}\": {score} ({s.Status})");
                    }
                }

                var allAttendance = await _context.AttendanceRecords
                    .Where(r => r.StudentId == userId)
                    .ToListAsync(ct);

                var totalSessions = allAttendance.Count;
                hasAttendance = totalSessions > 0;
                var attended = allAttendance.Count(r => r.Status == "Present" || r.Status == "Late" || r.Status == "Excused");
                var overallRate = totalSessions > 0 ? (double)attended / totalSessions * 100 : 100;

                ctx.AppendLine($"ATTENDANCE: {overallRate:F0}% overall ({attended}/{totalSessions} sessions)");

                var recentAttendance = await _context.AttendanceRecords
                    .Include(r => r.Session).ThenInclude(s => s.ClassGroup)
                    .Where(r => r.StudentId == userId)
                    .OrderByDescending(r => r.Session.SessionDate)
                    .Take(5)
                    .ToListAsync(ct);

                foreach (var r in recentAttendance)
                    ctx.AppendLine($"- {r.Session?.SessionDate:yyyy-MM-dd} {r.Session?.ClassGroup?.Name}: {r.Status}");
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            // Details stay in the server log; the model and the client only learn that some data is missing.
            _logger.LogError(ex, "Error assembling academic data for assistant");
            ctx.AppendLine("(Some data could not be loaded.)");
        }

        return new AssistantContext
        {
            Text = ctx.ToString(),
            IsTeacher = isTeacher,
            Courses = courseCount,
            Assignments = assignmentCount,
            RecentGrades = gradeCount,
            HasAttendance = hasAttendance,
            HasGradingProgress = hasGrading,
            RecentSessions = sessionCount,
        };
    }
}
