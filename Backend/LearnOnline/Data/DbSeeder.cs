using LearnOnline.Models;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {


            // Ensure the schema is newly created perfectly
            context.Database.EnsureCreated();

            // Manually ensure Announcements table exists (trigger rebuild)
            context.Database.ExecuteSqlRaw(@"DROP TABLE IF EXISTS ""Announcements"";");
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE ""Announcements"" (
                    ""Id"" text NOT NULL,
                    ""Title"" text NOT NULL,
                    ""LecturerName"" text NOT NULL,
                    ""DatePosted"" timestamp with time zone NOT NULL,
                    ""Preview"" text NOT NULL,
                    ""Label"" text NOT NULL,
                    ""Color"" text NOT NULL,
                    ""CourseId"" text NOT NULL,
                    CONSTRAINT ""PK_Announcements"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Announcements_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE
                );
            ");

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

            // 3. Seed Mock Assignments for existing courses
            // If there are no assignments anywhere in the DB, let's seed them.
            if (!context.Assignments.Any())
            {
                var uxCourseId = context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == "UX300")?.Id;
                var dvCourseId = context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == "DV300")?.Id;
                var vcCourseId = context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == "VC300")?.Id;

                var baseDate = DateTime.UtcNow.Date; // Anchors to exactly midnight today so times don't drift on restart

                // UX Assignments
                if (uxCourseId != null) {
                    context.Assignments.AddRange(
                        new Assignment { CourseId = uxCourseId, Title = "High-Fidelity Prototyping", Description = "Submit your final high-fidelity Figma prototype with interactive states.", MaxPoints = 100, DueDate = baseDate.AddDays(14).AddHours(23).AddMinutes(59) }, // exactly 11:59 PM
                        new Assignment { CourseId = uxCourseId, Title = "Usability Testing Report", Description = "Conduct a usability test and draft a full analysis brief.", MaxPoints = 100, DueDate = baseDate.AddDays(-2).AddHours(10) }, // Late, exactly 10:00 AM
                        new Assignment { CourseId = uxCourseId, Title = "Component Library Delivery", Description = "Build a scalable component library using design tokens.", MaxPoints = 50, DueDate = baseDate.AddDays(2).AddHours(15) } // Due Soon, exactly 15:00 PM
                    );
                }

                // DV Assignments
                if (dvCourseId != null) {
                    context.Assignments.AddRange(
                        new Assignment { CourseId = dvCourseId, Title = "React Dashboard Component", Description = "Build a dynamic React Dashboard using Framer Motion.", MaxPoints = 100, DueDate = baseDate.AddDays(-10).AddHours(23).AddMinutes(59) }, // Closed, exactly 11:59 PM
                        new Assignment { CourseId = dvCourseId, Title = ".NET API Auth Setup", Description = "Configure Bearer tokens and role authorization inside an ASP.NET container.", MaxPoints = 100, DueDate = baseDate.AddDays(1).AddHours(10) }, // Due Soon, exactly 10:00 AM
                        new Assignment { CourseId = dvCourseId, Title = "SQL Schema Design", Description = "Draft your ER diagram and migrate your database layer.", MaxPoints = 50, DueDate = baseDate.AddDays(4).AddHours(12) } // Due Soon, exactly 12:00 PM
                    );
                }

                // VC Assignments
                if (vcCourseId != null) {
                    context.Assignments.AddRange(
                        new Assignment { CourseId = vcCourseId, Title = "Essay Draft", Description = "Submit an initial draft analyzing semiotics in digital design.", MaxPoints = 100, DueDate = baseDate.AddDays(-1).AddHours(23).AddMinutes(59) }, // Late, exactly 11:59 PM
                        new Assignment { CourseId = vcCourseId, Title = "Visual Deconstruction Presentation", Description = "Provide recorded feedback on an existing ad campaign.", MaxPoints = 100, DueDate = baseDate.AddDays(30).AddHours(10) }, // Due, exactly 10:00 AM
                        new Assignment { CourseId = vcCourseId, Title = "Literature Review Module", Description = "Compare 3 distinct articles focusing on sensory experiences.", MaxPoints = 50, DueDate = baseDate.AddDays(-20).AddHours(8) } // Closed, exactly 08:00 AM
                    );
                }

                context.SaveChanges();
            }

            // 4. Seed Mock Announcements
            if (!context.Announcements.Any())
            {
                var uxCourseId = context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == "UX300")?.Id;
                var dvCourseId = context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == "DV300")?.Id;

                if (uxCourseId != null)
                {
                    context.Announcements.AddRange(
                        new Announcement { CourseId = uxCourseId, Title = "Project 3 Brief Released", LecturerName = "Dr. Sarah Miller", DatePosted = DateTime.UtcNow.AddHours(-2), Preview = "The brief for Project 3: High-Fidelity Prototyping is now available in the Modules section. Please review the technical requirements before Monday's lecture.", Label = "Notice", Color = "#3C0078" },
                        new Announcement { CourseId = uxCourseId, Title = "Guest Lecture: Industry UX Trends", LecturerName = "Prof. Mark Chen", DatePosted = DateTime.UtcNow.AddDays(-1), Preview = "We have an exciting guest speaker from a leading fintech startup joining us next week Tuesday. Attendance is mandatory for UX300 students.", Label = "Event", Color = "#FF8731" },
                        new Announcement { CourseId = uxCourseId, Title = "Lab Room Change - Block D", LecturerName = "Admin", DatePosted = DateTime.UtcNow.AddDays(-5), Preview = "The practical session for Friday will be moved to Lab 402 in Block D due to maintenance in the main studio.", Label = "Update", Color = "#87CEFA" }
                    );
                }

                if (dvCourseId != null)
                {
                    context.Announcements.AddRange(
                        new Announcement { CourseId = dvCourseId, Title = "Midterm Results Posted", LecturerName = "Dr. Jane Doe", DatePosted = DateTime.UtcNow.AddDays(-2), Preview = "The results for your midterm examination have been posted. Please check your grades.", Label = "Grades", Color = "#3C0078" }
                    );
                }

                context.SaveChanges();
            }
        }
    }
}
