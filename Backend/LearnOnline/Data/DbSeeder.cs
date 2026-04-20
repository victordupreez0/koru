using LearnOnline.Models;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            // Ensure the schema is created
            context.Database.EnsureCreated();

            // 1. Seed Default Developer Accounts
            // We search by email to see if they already exist
            var student = context.Users.FirstOrDefault(u => u.Email == "devstudent@learnonline.co.za");
            var teacher = context.Users.FirstOrDefault(u => u.Email == "devteacher@learnonline.co.za");
            var admin = context.Users.FirstOrDefault(u => u.Email == "devadmin@learnonline.co.za");

            // The exact BCrypt hash for "dev@123"
            var hash = "$2b$10$Cma9hPOlUNJt2VNaK0etgO1ZhFefacPgubTlhcnMvwcNPZfNAnx.2";

            if (student == null)
            {
                student = new User { Email = "devstudent@learnonline.co.za", PasswordHash = hash, FirstName = "Dev", LastName = "Student", Role = UserRole.student };
                context.Users.Add(student);
            }

            if (teacher == null)
            {
                teacher = new User { Email = "devteacher@learnonline.co.za", PasswordHash = hash, FirstName = "Dev", LastName = "Teacher", Role = UserRole.teacher };
                context.Users.Add(teacher);
            }

            if (admin == null)
            {
                admin = new User { Email = "devadmin@learnonline.co.za", PasswordHash = hash, FirstName = "Dev", LastName = "Admin", Role = UserRole.admin };
                context.Users.Add(admin);
            }

            context.SaveChanges(); // Save users so they have IDs to link to below

            // 2. Seed Subjects, Courses and Enrollments
            // Seed UX300
            if (!context.Subjects.Any(s => s.Code == "UX300"))
            {
                var subject = new Subject { Name = "User Experience Design 300", Code = "UX300", Description = "Inclusive & Neurodiverse UX foundation course.", CreatedBy = admin.Id };
                context.Subjects.Add(subject);
                context.SaveChanges();
                var course = new Course { Term = "Term 1", Year = 2026, Capacity = 150, SubjectId = subject.Id, TeacherId = teacher.Id };
                context.Courses.Add(course);
                context.SaveChanges();
                context.Enrollments.Add(new Enrollment { Status = "Active", CourseId = course.Id, StudentId = student.Id });
                context.SaveChanges();
            }

            // Seed DV300
            if (!context.Subjects.Any(s => s.Code == "DV300"))
            {
                var subject = new Subject { Name = "Development 300", Code = "DV300", Description = "Advanced Full-Stack Engineering and Architecture.", CreatedBy = admin.Id };
                context.Subjects.Add(subject);
                context.SaveChanges();
                var course = new Course { Term = "Term 1", Year = 2026, Capacity = 150, SubjectId = subject.Id, TeacherId = teacher.Id };
                context.Courses.Add(course);
                context.SaveChanges();
                context.Enrollments.Add(new Enrollment { Status = "Active", CourseId = course.Id, StudentId = student.Id });
                context.SaveChanges();
            }

            // Seed VC300
            if (!context.Subjects.Any(s => s.Code == "VC300"))
            {
                var subject = new Subject { Name = "Visual Culture 300", Code = "VC300", Description = "Exploration of visual systems, semiotics, and interactive media aesthetics.", CreatedBy = admin.Id };
                context.Subjects.Add(subject);
                context.SaveChanges();
                var course = new Course { Term = "Term 1", Year = 2026, Capacity = 150, SubjectId = subject.Id, TeacherId = teacher.Id };
                context.Courses.Add(course);
                context.SaveChanges();
                context.Enrollments.Add(new Enrollment { Status = "Active", CourseId = course.Id, StudentId = student.Id });
                context.SaveChanges();
            }
        }
    }
}
