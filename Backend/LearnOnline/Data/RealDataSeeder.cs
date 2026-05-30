using LearnOnline.Models;
using Microsoft.EntityFrameworkCore;

namespace LearnOnline.Data
{
    // Seeds the database with real course data.
    // To switch back to mock data, swap this for DbSeeder.Seed(context) in Program.cs.
    public static class RealDataSeeder
    {
        public static void Seed(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // Rebuild Announcements table to prevent schema drift
            context.Database.ExecuteSqlRaw(@"DROP TABLE IF EXISTS ""Announcements"";");
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE ""Announcements"" (
                    ""Id"" text NOT NULL,
                    ""Title"" text NOT NULL,
                    ""DatePosted"" timestamp with time zone NOT NULL,
                    ""Preview"" text NOT NULL,
                    ""Label"" text NOT NULL,
                    ""Color"" text NOT NULL,
                    ""CourseId"" text NOT NULL,
                    ""LecturerId"" text NOT NULL,
                    CONSTRAINT ""PK_Announcements"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Announcements_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_Announcements_Users_LecturerId"" FOREIGN KEY (""LecturerId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                );
            ");

            // All dev accounts share password: dev@123
            var hash = "$2b$10$Cma9hPOlUNJt2VNaK0etgO1ZhFefacPgubTlhcnMvwcNPZfNAnx.2";

            // ─── 1. Users ────────────────────────────────────────────────────────────────

            var student = context.Users.FirstOrDefault(u => u.Email == "devstudent@learnonline.co.za");
            var admin   = context.Users.FirstOrDefault(u => u.Email == "devadmin@learnonline.co.za");

            if (student == null) { student = new User { Email = "devstudent@learnonline.co.za", PasswordHash = hash, FirstName = "Victor", LastName = "Student", Role = UserRole.student }; context.Users.Add(student); }
            if (admin == null)   { admin   = new User { Email = "devadmin@learnonline.co.za",   PasswordHash = hash, FirstName = "Dev",    LastName = "Admin",   Role = UserRole.admin   }; context.Users.Add(admin); }

            var william = context.Users.FirstOrDefault(u => u.Email == "william@learnonline.co.za");
            var simba   = context.Users.FirstOrDefault(u => u.Email == "simba@learnonline.co.za");
            var tsungai = context.Users.FirstOrDefault(u => u.Email == "tsungai@learnonline.co.za");
            var deon    = context.Users.FirstOrDefault(u => u.Email == "deon@learnonline.co.za");
            var karl    = context.Users.FirstOrDefault(u => u.Email == "karl@learnonline.co.za");

            if (william == null) { william = new User { Email = "william@learnonline.co.za", PasswordHash = hash, FirstName = "William", LastName = "Basson",      Role = UserRole.teacher }; context.Users.Add(william); }
            if (simba   == null) { simba   = new User { Email = "simba@learnonline.co.za",   PasswordHash = hash, FirstName = "Simba",   LastName = "Zengeni",     Role = UserRole.teacher }; context.Users.Add(simba); }
            if (tsungai == null) { tsungai = new User { Email = "tsungai@learnonline.co.za", PasswordHash = hash, FirstName = "Tsungai", LastName = "Katsuro",     Role = UserRole.teacher }; context.Users.Add(tsungai); }
            if (deon    == null) { deon    = new User { Email = "deon@learnonline.co.za",    PasswordHash = hash, FirstName = "Deon",    LastName = "Opperman",    Role = UserRole.teacher }; context.Users.Add(deon); }
            if (karl    == null) { karl    = new User { Email = "karl@learnonline.co.za",    PasswordHash = hash, FirstName = "Karl",    LastName = "van Heerden", Role = UserRole.teacher }; context.Users.Add(karl); }

            context.SaveChanges();

            // ─── 2. Subjects, Courses & Enrolments ──────────────────────────────────────
            //
            // DV300  – William Basson (primary lecturer, co-taught with Simba & Tsungai)
            // CC300  – William Basson
            // ME300  – Deon Opperman
            // VC300  – Dr. Karl van Heerden

            EnsureCourse(context, admin.Id, "DV300", "Interactive Development 300",
                "Full-stack web development, API design, and cloud deployment.",
                "Term 1", 2026, william.Id, student.Id);

            EnsureCourse(context, admin.Id, "CC300", "Creative Computing 300",
                "Generative art, creative coding with p5.js, and physical computing.",
                "Term 1", 2026, william.Id, student.Id);

            EnsureCourse(context, admin.Id, "ME300", "Entrepreneurship 300",
                "Lean startup methodology, business modelling, and innovation strategy.",
                "Term 1", 2026, deon.Id, student.Id);

            EnsureCourse(context, admin.Id, "VC300", "Visual Culture 300",
                "Critical analysis of visual systems, semiotics, and contemporary media culture.",
                "Term 1", 2026, karl.Id, student.Id);

            // ─── 3. Assignments ──────────────────────────────────────────────────────────
            // Upsert seeded assignments only – never delete existing rows so teacher-created
            // assignments survive server restarts. Due-date anchors are refreshed each boot.
            {
                var dvId = CourseId(context, "DV300");
                var ccId = CourseId(context, "CC300");
                var meId = CourseId(context, "ME300");
                var vcId = CourseId(context, "VC300");

                // Build baseDate as SA local midnight expressed in UTC.
                // Using DateTimeOffset avoids DateTime.Kind ambiguity that can cause +2h drift.
                var saZone   = TimeSpan.FromHours(2);
                var todaySa  = DateTimeOffset.UtcNow.ToOffset(saZone).Date;  // today in SA
                var baseDate = new DateTimeOffset(todaySa, saZone).UtcDateTime; // SA 00:00 → UTC

                var seeds = new List<(string? CourseId, string Title, string Description, int MaxPoints, DateTime DueDate)>();

                if (dvId != null)
                {
                    seeds.Add((dvId, "Technical Architecture Document",  "Design and document a full-stack system architecture covering API layer, database schema, and deployment strategy.", 100, baseDate.AddDays(21).AddHours(23).AddMinutes(59)));
                    seeds.Add((dvId, "Full-Stack Application \u2013 Sprint 1", "Deliver a working vertical slice of your term project: authentication, one complete feature, and a deployed staging environment.", 100, baseDate.AddDays(2).AddHours(17)));
                    seeds.Add((dvId, "API Documentation Review",          "Submit a documented Swagger / OpenAPI spec covering all endpoints in your project API.", 50, baseDate.AddDays(-7).AddHours(23).AddMinutes(59)));
                }
                if (ccId != null)
                {
                    seeds.Add((ccId, "Creative Coding Sketch 1",   "Build an interactive p5.js sketch that responds to mouse and keyboard input, exploring a given theme.", 100, baseDate.AddDays(7).AddHours(23).AddMinutes(59)));
                    seeds.Add((ccId, "Generative Systems Project", "Create a generative artwork using procedural rules. Include a written reflection on creative intent.", 100, baseDate.AddDays(28).AddHours(23).AddMinutes(59)));
                }
                if (meId != null)
                {
                    seeds.Add((meId, "Business Model Canvas",    "Complete a Business Model Canvas for your proposed venture, supported by primary research findings.", 100, baseDate.AddDays(10).AddHours(23).AddMinutes(59)));
                    seeds.Add((meId, "Lean Startup Pitch Deck", "Prepare a 10-slide investor pitch deck following the lean startup framework. Present in class on Thursday.", 50, baseDate.AddDays(1).AddHours(12)));
                }
                if (vcId != null)
                {
                    seeds.Add((vcId, "Visual Analysis Essay",         "Write a 1500-word essay deconstructing a chosen piece of contemporary visual media using semiotic theory.", 100, baseDate.AddDays(-1).AddHours(23).AddMinutes(59)));
                    seeds.Add((vcId, "Mood Board & Style Direction",  "Produce a 12-slide visual research document anchoring your term project's aesthetic direction.", 50, baseDate.AddDays(14).AddHours(23).AddMinutes(59)));
                    seeds.Add((vcId, "Brand Identity Deconstruction", "Analyse a chosen brand system (logo, typography, colour, tone) and present your findings in a structured deck.", 100, baseDate.AddDays(5).AddHours(17)));
                }

                foreach (var (courseId, title, description, maxPoints, dueDate) in seeds)
                {
                    var existing = context.Assignments.FirstOrDefault(a => a.CourseId == courseId && a.Title == title);
                    if (existing == null)
                        context.Assignments.Add(new Assignment { CourseId = courseId, Title = title, Description = description, MaxPoints = maxPoints, DueDate = dueDate });
                    else
                        existing.DueDate = dueDate;
                }

                context.SaveChanges();
            }

            // ─── 4. Weekly Timetable Events (4 weeks) ────────────────────────────────────
            //
            // Actual schedule (all times SA local / UTC+2, stored as UTC):
            //   Monday    09:00–11:00  VC300   – Virtually Mediated
            //   Monday    11:00–12:00  DV300   – Theory, Virtually Mediated
            //   Wednesday 14:00–18:00  DV300   – Practical, C1 / Hybrid
            //   Thursday  09:00–11:00  ME300   – Virtually Mediated
            //   Thursday  16:00–18:00  CC300   – CUBE

            context.Database.ExecuteSqlRaw(@"DELETE FROM ""Events"";");

            {
                var dvId = CourseId(context, "DV300");
                var ccId = CourseId(context, "CC300");
                var meId = CourseId(context, "ME300");
                var vcId = CourseId(context, "VC300");

                var saZone      = TimeSpan.FromHours(2);
                var todaySa     = DateTimeOffset.UtcNow.ToOffset(saZone).Date;
                int diff        = (7 + (todaySa.DayOfWeek - DayOfWeek.Monday)) % 7;
                var mondaySa    = todaySa.AddDays(-diff);
                var startOfWeek = new DateTimeOffset(mondaySa, saZone).UtcDateTime; // SA Monday 00:00 → UTC

                for (int i = 0; i < 4; i++)
                {
                    var w = startOfWeek.AddDays(i * 7);

                    if (vcId != null)
                        context.Events.Add(new Event { CourseId = vcId, Title = "VC300", Description = "Visual Culture|Online", EventType = "class", StartTime = w.AddDays(0).AddHours(9), EndTime = w.AddDays(0).AddHours(11), CreatedBy = "Dr. Karl van Heerden", BgColor = "#6d2b91", TextColor = "#ffffff" });

                    if (dvId != null)
                    {
                        context.Events.Add(new Event { CourseId = dvId, Title = "DV300 – Theory",    Description = "Theory Session|Online",        EventType = "class", StartTime = w.AddDays(0).AddHours(11), EndTime = w.AddDays(0).AddHours(12), CreatedBy = "Tsungai Katsuro", BgColor = "#1a1a8c", TextColor = "#ffffff" });
                        context.Events.Add(new Event { CourseId = dvId, Title = "DV300 – Practical", Description = "Practical Session|C1 / Hybrid", EventType = "class", StartTime = w.AddDays(2).AddHours(14), EndTime = w.AddDays(2).AddHours(18), CreatedBy = "William Basson",  BgColor = "#1a1a8c", TextColor = "#ffffff" });
                    }

                    if (meId != null)
                        context.Events.Add(new Event { CourseId = meId, Title = "ME300", Description = "Entrepreneurship|Online", EventType = "class", StartTime = w.AddDays(3).AddHours(9),  EndTime = w.AddDays(3).AddHours(11), CreatedBy = "Deon Opperman",        BgColor = "#2d6a4f", TextColor = "#ffffff" });

                    if (ccId != null)
                        context.Events.Add(new Event { CourseId = ccId, Title = "CC300", Description = "Creative Computing|CUBE", EventType = "class", StartTime = w.AddDays(3).AddHours(16), EndTime = w.AddDays(3).AddHours(18), CreatedBy = "William Basson", BgColor = "#7b2d8b", TextColor = "#ffffff" });
                }

                context.SaveChanges();
            }

            // ─── 5. Announcements ────────────────────────────────────────────────────────

            if (!context.Announcements.Any())
            {
                var dvId = CourseId(context, "DV300");
                var meId = CourseId(context, "ME300");
                var vcId = CourseId(context, "VC300");

                william = context.Users.First(u => u.Email == "william@learnonline.co.za");
                karl    = context.Users.First(u => u.Email == "karl@learnonline.co.za");
                deon    = context.Users.First(u => u.Email == "deon@learnonline.co.za");

                if (dvId != null)
                    context.Announcements.AddRange(
                        new Announcement { CourseId = dvId, LecturerId = william.Id, Title = "Sprint 1 Brief Updated",           DatePosted = DateTime.UtcNow.AddHours(-3),  Preview = "The Sprint 1 brief has been updated with revised submission criteria. Please re-download from the Modules section before Wednesday's practical.", Label = "Notice",   Color = "#1a1a8c" },
                        new Announcement { CourseId = dvId, LecturerId = william.Id, Title = "Wednesday Practical – Hybrid Info", DatePosted = DateTime.UtcNow.AddDays(-2),   Preview = "Reminder: Wednesday's session runs in C1 and hybrid simultaneously. Teams joining online must be ready to share screens during code review.", Label = "Update",   Color = "#3C0078" }
                    );

                if (vcId != null)
                    context.Announcements.AddRange(
                        new Announcement { CourseId = vcId, LecturerId = karl.Id,    Title = "Visual Analysis Essay – Due Tonight", DatePosted = DateTime.UtcNow.AddDays(-1),   Preview = "Essays are due tonight at 23:59. Late submissions will incur a 10% penalty per day as per the assessment brief.", Label = "Deadline", Color = "#FF8731" }
                    );

                if (meId != null)
                    context.Announcements.AddRange(
                        new Announcement { CourseId = meId, LecturerId = deon.Id,    Title = "Pitch Deck Template Released",        DatePosted = DateTime.UtcNow.AddHours(-5),  Preview = "The standardised pitch deck template is now on Moodle. Use this exact structure for your Lean Startup submission on Thursday.", Label = "Resource", Color = "#2d6a4f" }
                    );

                context.SaveChanges();
            }
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────────────

        private static void EnsureCourse(AppDbContext context, string adminId, string code, string name,
            string description, string term, int year, string teacherId, string studentId)
        {
            if (!context.Subjects.Any(s => s.Code == code))
            {
                var subject = new Subject { Name = name, Code = code, Description = description, CreatedBy = adminId };
                context.Subjects.Add(subject);
                context.SaveChanges();

                var course = new Course { Term = term, Year = year, Capacity = 150, SubjectId = subject.Id, TeacherId = teacherId };
                context.Courses.Add(course);
                context.SaveChanges();

                context.Enrollments.Add(new Enrollment { Status = "Active", CourseId = course.Id, StudentId = studentId });
                context.SaveChanges();
            }
            else
            {
                var subject = context.Subjects.First(s => s.Code == code);
                var course  = context.Courses.FirstOrDefault(c => c.SubjectId == subject.Id);
                if (course != null && course.TeacherId != teacherId) { course.TeacherId = teacherId; context.SaveChanges(); }
            }
        }

        private static string? CourseId(AppDbContext context, string subjectCode) =>
            context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == subjectCode)?.Id;
    }
}
