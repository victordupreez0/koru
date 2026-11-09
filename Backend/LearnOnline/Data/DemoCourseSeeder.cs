using System.Reflection;
using System.Text.Json;
using LearnOnline.Models;

namespace LearnOnline.Data
{
    // Adds the "Intro to Coding (Grade 5)" course used to demo the editor.
    // Only runs with SEED_DEMO_COURSE=true, adds rows without touching existing ones, and runs once.
    public static class DemoCourseSeeder
    {
        public const string CourseName = "Intro to Coding (Grade 5)";
        public const string Password = "Demo@123";
        public const string LecturerEmail = "demo.lecturer@koru.demo";
        public const string StudentEmail = "demo.student@koru.demo";
        public const string AdminEmail = "demo.admin@koru.demo";

        public static void Seed(AppDbContext context)
        {
            if (context.Courses.Any(c => c.Name == CourseName)) return;

            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("LearnOnline.Data.demo-course.json")!;
            using var demo = JsonDocument.Parse(stream);
            var root = demo.RootElement;

            var hash = BCrypt.Net.BCrypt.HashPassword(Password);
            User MakeUser(string email, string first, string last, UserRole role) => new()
            {
                Email = email,
                PasswordHash = hash,
                FirstName = first,
                LastName = last,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var lecturer = MakeUser(LecturerEmail, "Demo", "Lecturer", UserRole.teacher);
            var student = MakeUser(StudentEmail, "Demo", "Student", UserRole.student);
            var admin = MakeUser(AdminEmail, "Demo", "Admin", UserRole.admin);
            var classmates = new[]
            {
                MakeUser("thabo@koru.demo", "Thabo", "Mokoena", UserRole.student),
                MakeUser("lerato@koru.demo", "Lerato", "Dlamini", UserRole.student),
                MakeUser("aisha@koru.demo", "Aisha", "Khan", UserRole.student),
                MakeUser("sipho@koru.demo", "Sipho", "Nkosi", UserRole.student),
            };
            context.Users.AddRange(lecturer, student, admin);
            context.Users.AddRange(classmates);

            var subject = new Subject { Name = CourseName, Code = "CD105", Description = "A first taste of programming for Grade 5 learners.", CreatedBy = lecturer.Id };
            var course = new Course
            {
                Name = CourseName,
                Code = "CD105",
                Term = "Term 4",
                Year = 2026,
                Capacity = 30,
                SubjectId = subject.Id,
                TeacherId = lecturer.Id,
                IsVisible = true,
                Content = root.GetProperty("home").GetRawText(),
            };
            context.Subjects.Add(subject);
            context.Courses.Add(course);
            foreach (var learner in classmates.Append(student))
                context.Enrollments.Add(new Enrollment { CourseId = course.Id, StudentId = learner.Id, Status = "Active" });

            var module = new CourseModule { CourseId = course.Id, Title = root.GetProperty("module").GetString()!, IsPublished = true, IsOpen = true };
            context.CourseModules.Add(module);

            var pages = root.GetProperty("items").EnumerateArray().Select((page, order) => new CourseModuleItem
            {
                ModuleId = module.Id,
                Label = page.GetProperty("label").GetString()!,
                Type = "document",
                IsPublished = true,
                SortOrder = order,
                Content = page.GetProperty("content").GetRawText(),
            }).ToList();
            context.CourseModuleItems.AddRange(pages);

            // Some classmates have already had a go, so the results view has a story to tell.
            // The demo student has none: their first submit is the one you watch appear.
            void Attempted(User who, int page, string block, bool passed, double score, double max, string answer, int minutesAgo) =>
                context.Attempts.Add(new Attempt
                {
                    StudentId = who.Id,
                    PageId = pages[page].Id,
                    BlockId = block,
                    AnswerJson = answer,
                    Passed = passed,
                    Score = score,
                    MaxScore = max,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-minutesAgo),
                });

            Attempted(classmates[0], 1, "demo-squares", true, 5, 5, """{"cells":[0,1,2,4,7]}""", 90);
            Attempted(classmates[1], 1, "demo-squares", false, 3, 5, """{"cells":[0,1,2]}""", 70);
            Attempted(classmates[1], 1, "demo-squares", true, 5, 5, """{"cells":[0,1,2,4,7]}""", 65);
            Attempted(classmates[2], 1, "demo-squares", false, 2, 5, """{"cells":[0,1,4,5]}""", 40);
            Attempted(classmates[0], 2, "demo-move", true, 1, 1, """{"program":"move right 2\nmove up 4\nmove right 2"}""", 80);
            Attempted(classmates[3], 2, "demo-move", false, 0, 1, """{"program":"move up 4"}""", 30);
            Attempted(classmates[0], 3, "demo-quiz", true, 3, 3, """{"answers":[0,1,2]}""", 75);
            Attempted(classmates[2], 3, "demo-quiz", true, 2, 3, """{"answers":[0,1,0]}""", 20);

            context.SaveChanges();
        }
    }
}
