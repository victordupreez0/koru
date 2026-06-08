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

                // ─── 6. Assignment Class Overrides & Attendance Session ───────────────────
                var dvCourseId = CourseId(context, "DV300");
                if (dvCourseId != null)
                {
                    var groupA = context.ClassGroups.FirstOrDefault(g => g.CourseId == dvCourseId && g.Name == "Group A");
                    var groupB = context.ClassGroups.FirstOrDefault(g => g.CourseId == dvCourseId && g.Name == "Group B");
                    var assignment = context.Assignments.FirstOrDefault(a => a.CourseId == dvCourseId && a.Title == "Full-Stack Application – Sprint 1");
                    if (assignment != null && groupA != null && groupB != null)
                    {
                        if (!context.AssignmentClassOverrides.Any(o => o.AssignmentId == assignment.Id))
                        {
                            var saZone   = TimeSpan.FromHours(2);
                            var todaySa  = DateTimeOffset.UtcNow.ToOffset(saZone).Date;
                            var baseDate = new DateTimeOffset(todaySa, saZone).UtcDateTime;

                            context.AssignmentClassOverrides.AddRange(
                                new AssignmentClassOverride { AssignmentId = assignment.Id, ClassGroupId = groupA.Id, DueDate = baseDate.AddDays(2).AddHours(17) }, // Group A
                                new AssignmentClassOverride { AssignmentId = assignment.Id, ClassGroupId = groupB.Id, DueDate = baseDate.AddDays(3).AddHours(12) }  // Group B
                            );
                        }
                    }
                }

                var studentUser = context.Users.FirstOrDefault(u => u.Email == "devstudent@learnonline.co.za");
                var lecturerUser = context.Users.FirstOrDefault(u => u.Email == "william@learnonline.co.za");
                if (dvCourseId != null && studentUser != null && lecturerUser != null)
                {
                    var groupA = context.ClassGroups.FirstOrDefault(g => g.CourseId == dvCourseId && g.Name == "Group A");
                    if (groupA != null && !context.AttendanceSessions.Any(s => s.ClassGroupId == groupA.Id))
                    {
                        var session = new AttendanceSession
                        {
                            ClassGroupId = groupA.Id,
                            SessionDate = DateTime.UtcNow.AddDays(-1), // yesterday
                            LecturerId = lecturerUser.Id
                        };
                        context.AttendanceSessions.Add(session);
                        context.SaveChanges();

                        context.AttendanceRecords.Add(new AttendanceRecord
                        {
                            AttendanceSessionId = session.Id,
                            StudentId = studentUser.Id,
                            Status = "Present",
                            Remarks = "Attended practical on time"
                        });
                    }
                }

                context.SaveChanges();
            }
        }

        // ─── Helpers ─────────────────────────────────────────────────────────────────────

        private static void EnsureCourse(AppDbContext context, string adminId, string code, string name,
            string description, string term, int year, string teacherId, string studentId)
        {
            Course? course = null;
            if (!context.Subjects.Any(s => s.Code == code))
            {
                var subject = new Subject { Name = name, Code = code, Description = description, CreatedBy = adminId };
                context.Subjects.Add(subject);
                context.SaveChanges();

                course = new Course { Term = term, Year = year, Capacity = 150, SubjectId = subject.Id, TeacherId = teacherId };
                context.Courses.Add(course);
                context.SaveChanges();
            }
            else
            {
                var subject = context.Subjects.First(s => s.Code == code);
                course = context.Courses.FirstOrDefault(c => c.SubjectId == subject.Id);
                if (course != null && course.TeacherId != teacherId) 
                { 
                    course.TeacherId = teacherId; 
                    context.SaveChanges(); 
                }
            }

            if (course != null)
            {
                // Ensure ClassGroups (cohorts) exist
                var groupA = context.ClassGroups.FirstOrDefault(g => g.CourseId == course.Id && g.Name == "Group A");
                if (groupA == null)
                {
                    groupA = new ClassGroup { CourseId = course.Id, Name = "Group A" };
                    context.ClassGroups.Add(groupA);
                    context.SaveChanges();
                }

                var groupB = context.ClassGroups.FirstOrDefault(g => g.CourseId == course.Id && g.Name == "Group B");
                if (groupB == null)
                {
                    groupB = new ClassGroup { CourseId = course.Id, Name = "Group B" };
                    context.ClassGroups.Add(groupB);
                    context.SaveChanges();
                }

                // Ensure Enrollment exists and is linked to Group A
                var enrollment = context.Enrollments.FirstOrDefault(e => e.CourseId == course.Id && e.StudentId == studentId);
                if (enrollment == null)
                {
                    enrollment = new Enrollment { Status = "Active", CourseId = course.Id, StudentId = studentId, ClassGroupId = groupA.Id };
                    context.Enrollments.Add(enrollment);
                    context.SaveChanges();
                }
                else if (enrollment.ClassGroupId == null)
                {
                    enrollment.ClassGroupId = groupA.Id;
                    context.SaveChanges();
                }

                // Seed some shared weekly class slots linked to the ClassGroups!
                if (!context.Classes.Any(c => c.ClassGroupId == groupA.Id))
                {
                    if (code == "DV300")
                    {
                        context.Classes.AddRange(
                            new Class { CourseId = course.Id, ClassGroupId = groupA.Id, Room = "Online", DayOfWeek = "Monday", StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(12, 0) },
                            new Class { CourseId = course.Id, ClassGroupId = groupA.Id, Room = "C1", DayOfWeek = "Wednesday", StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(18, 0) }
                        );
                    }
                    else if (code == "VC300")
                    {
                        context.Classes.Add(new Class { CourseId = course.Id, ClassGroupId = groupA.Id, Room = "Online", DayOfWeek = "Monday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(11, 0) });
                    }
                    else if (code == "ME300")
                    {
                        context.Classes.Add(new Class { CourseId = course.Id, ClassGroupId = groupA.Id, Room = "Online", DayOfWeek = "Thursday", StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(11, 0) });
                    }
                    else if (code == "CC300")
                    {
                        context.Classes.Add(new Class { CourseId = course.Id, ClassGroupId = groupA.Id, Room = "CUBE", DayOfWeek = "Thursday", StartTime = new TimeOnly(16, 0), EndTime = new TimeOnly(18, 0) });
                    }
                    context.SaveChanges();
                }

                if (!context.Classes.Any(c => c.ClassGroupId == groupB.Id))
                {
                    if (code == "DV300")
                    {
                        context.Classes.Add(new Class { CourseId = course.Id, ClassGroupId = groupB.Id, Room = "Online", DayOfWeek = "Tuesday", StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(12, 0) });
                    }
                    context.SaveChanges();
                }
            }
        }

        private static string? CourseId(AppDbContext context, string subjectCode) =>
            context.Courses.FirstOrDefault(c => c.Subject != null && c.Subject.Code == subjectCode)?.Id;
    }
}
