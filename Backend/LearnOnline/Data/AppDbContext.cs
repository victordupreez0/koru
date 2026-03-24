using Microsoft.EntityFrameworkCore;
using LearnOnline.Models;

namespace LearnOnline.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Timetable> Timetables { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Grade> Grades { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Note> Notes { get; set; }
    }
}
