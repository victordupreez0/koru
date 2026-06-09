using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Tests;

internal static class TestData
{
    public static User MakeUser(string? id = null, UserRole role = UserRole.student, string email = "test@example.com", bool isActive = true)
    {
        return new User
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            FirstName = "First",
            LastName = "Last",
            Role = role,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Subject MakeSubject(string? id = null, string code = "TST101")
    {
        return new Subject
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Name = "Test Subject",
            Code = code,
            Description = "Subject for tests",
            CreatedBy = "system",
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Course MakeCourse(string subjectId, string teacherId, string? id = null)
    {
        return new Course
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Term = "Term 1",
            Year = 2026,
            Capacity = 30,
            SubjectId = subjectId,
            TeacherId = teacherId,
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Assignment MakeAssignment(string courseId, string? id = null)
    {
        return new Assignment
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Title = "Assignment A",
            Description = "Do the thing",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxPoints = 100,
            CourseId = courseId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Enrollment MakeEnrollment(string studentId, string courseId, string status = "Active", string? id = null)
    {
        return new Enrollment
        {
            Id = id ?? Guid.NewGuid().ToString(),
            StudentId = studentId,
            CourseId = courseId,
            Status = status,
            EnrolledAt = DateTime.UtcNow
        };
    }

    public static Submission MakeSubmission(string assignmentId, string studentId, string? id = null)
    {
        return new Submission
        {
            Id = id ?? Guid.NewGuid().ToString(),
            AssignmentId = assignmentId,
            StudentId = studentId,
            FileUrl = "https://example.com/file.pdf",
            Status = "Pending",
            SubmittedAt = DateTime.UtcNow
        };
    }

    public static Grade MakeGrade(string submissionId, string graderId, decimal points = 85m, string? id = null)
    {
        return new Grade
        {
            Id = id ?? Guid.NewGuid().ToString(),
            SubmissionId = submissionId,
            GradedBy = graderId,
            PointsEarned = points,
            GradedAt = DateTime.UtcNow
        };
    }

    public static Feedback MakeFeedback(string submissionId, string teacherId, string? id = null)
    {
        return new Feedback
        {
            Id = id ?? Guid.NewGuid().ToString(),
            SubmissionId = submissionId,
            TeacherId = teacherId,
            Content = "Good work",
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Material MakeMaterial(string courseId, string? id = null)
    {
        return new Material
        {
            Id = id ?? Guid.NewGuid().ToString(),
            CourseId = courseId,
            Title = "Week 1",
            FileUrl = "https://example.com/slides.pdf",
            FileType = "pdf",
            UploadedBy = "teacher",
            UploadedAt = DateTime.UtcNow
        };
    }

    public static Note MakeNote(string courseId, string studentId, string authorId, string? id = null)
    {
        return new Note
        {
            Id = id ?? Guid.NewGuid().ToString(),
            CourseId = courseId,
            StudentId = studentId,
            AuthorId = authorId,
            Title = "Note title",
            Content = "Note content",
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Event MakeEvent(string courseId, string? id = null)
    {
        return new Event
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Title = "Lecture",
            Description = "Intro lecture",
            EventType = "Lecture",
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow.AddHours(1),
            CreatedBy = "teacher",
            BgColor = "#000",
            TextColor = "#fff",
            CourseId = courseId
        };
    }

    public static Timetable MakeTimetable(string userId, string? id = null)
    {
        return new Timetable
        {
            Id = id ?? Guid.NewGuid().ToString(),
            UserId = userId,
            Term = "Term 1",
            Year = 2026,
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = "system"
        };
    }

    public static Class MakeClass(string timetableId, string courseId, string? id = null)
    {
        return new Class
        {
            Id = id ?? Guid.NewGuid().ToString(),
            TimetableId = timetableId,
            CourseId = courseId,
            Room = "A101",
            DayOfWeek = "Monday",
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(10, 0),
            IsGenerated = false
        };
    }

    public static Announcement MakeAnnouncement(string courseId, string lecturerId, string? id = null)
    {
        return new Announcement
        {
            Id = id ?? Guid.NewGuid().ToString(),
            CourseId = courseId,
            LecturerId = lecturerId,
            Title = "Welcome",
            Preview = "Welcome to the course",
            Label = "Info",
            Color = "#0ea5e9",
            DatePosted = DateTime.UtcNow
        };
    }
}
