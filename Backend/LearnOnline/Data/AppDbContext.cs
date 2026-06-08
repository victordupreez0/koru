using Microsoft.EntityFrameworkCore;
using LearnOnline.Models;

namespace LearnOnline.Data
{
    // EF Core database context – the single gateway between the app and PostgreSQL
    // Each DbSet maps to a table in the database
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Identity & auth
        public DbSet<User> Users { get; set; }

        // Academic catalogue
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Course> Courses { get; set; }

        // Scheduling
        public DbSet<Class> Classes { get; set; }
        public DbSet<Timetable> Timetables { get; set; }
        public DbSet<Event> Events { get; set; }

        // Course content
        public DbSet<Material> Materials { get; set; }

        // Assignments & grading
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Grade> Grades { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }

        // Notes
        public DbSet<Note> Notes { get; set; }

        // Announcements
        public DbSet<Announcement> Announcements { get; set; }

        // Course Modules (sections and nested items on the Modules page)
        public DbSet<CourseModule> CourseModules { get; set; }
        public DbSet<CourseModuleItem> CourseModuleItems { get; set; }

        // Teacher to-do items (self-created or admin-assigned)
        public DbSet<TodoItem> TodoItems { get; set; }

        // Attendance records (per-student, per-session)
        public DbSet<Attendance> Attendances { get; set; }

        // Live check-in sessions (teacher opens, students join with code)
        public DbSet<CheckInSession> CheckInSessions { get; set; }
    }
}
