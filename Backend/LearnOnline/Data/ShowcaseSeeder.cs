using System.Globalization;
using System.Reflection;
using System.Text.Json;
using LearnOnline.Models;
using LearnOnline.Services.Marking;

namespace LearnOnline.Data
{
    // Adds the showcase: one coding course per grade from Grade 1 to Grade 12, plus first-year
    // college, each with one module that shows off the page editor, and a term's worth of
    // coursework around it: assignments, submissions, marks and comments, announcements,
    // attendance, a weekly class on the calendar and a few to-dos for the teacher.
    //
    // Everything belongs to the dev accounts (devteacher, devstudent, devadmin), so the usual
    // logins see it. Dates are relative to the day the seeder runs, so the term always looks current.
    //
    // The courses live in showcase-courses.json, which is built from the readable sources in
    // Frontend/scripts/showcase (npm run build:showcase). Only runs when SEED_DEMO_COURSE is set:
    //   true     adds whatever is missing and never touches what is already there
    //   refresh  rebuilds the showcase courses from the file (pages, attempts and coursework are replaced)
    public static class ShowcaseSeeder
    {
        public const string Password = "dev@123";
        public const string LecturerEmail = "devteacher@learnonline.co.za";
        public const string StudentEmail = "devstudent@learnonline.co.za";
        public const string AdminEmail = "devadmin@learnonline.co.za";

        // The single demo course that the showcase replaced.
        private const string RetiredCourseCode = "CD105";

        // Besides the dev student and the four classmates, each course has its own learners.
        private const int LearnersPerCourse = 10;

        private static readonly (string Email, string First, string Last)[] Classmates =
        {
            ("thabo@koru.demo", "Thabo", "Mokoena"),
            ("lerato@koru.demo", "Lerato", "Dlamini"),
            ("aisha@koru.demo", "Aisha", "Khan"),
            ("sipho@koru.demo", "Sipho", "Nkosi"),
        };

        private static readonly string[] FirstNames =
        {
            "Naledi", "Pieter", "Zanele", "Ethan", "Amahle", "Liam", "Kagiso", "Mia", "Yusuf", "Anika",
            "Bongani", "Chloe", "Tumelo", "Fatima", "Ruan", "Nomvula", "Daniel", "Palesa", "Ayanda", "Jade",
            "Lwazi", "Emma", "Karabo", "Zoe", "Sibusiso", "Leah", "Musa", "Isabella", "Tshepo", "Hannah",
        };

        private static readonly string[] LastNames =
        {
            "Botha", "Ndlovu", "Naidoo", "van Wyk", "Mahlangu", "Pillay", "Zulu", "Smith", "Petersen", "Molefe",
            "Coetzee", "Mthembu", "Govender", "Jacobs", "Sithole", "Fourie", "Nel", "Baloyi", "Abrahams", "Maseko",
        };

        // One colour per course, for its weekly class on the calendar and its welcome announcement.
        private static readonly string[] Colours =
        {
            "#e83e8c", "#fd7e14", "#20c997", "#17a2b8", "#6d2b91", "#1a1a8c", "#7b2d8b",
            "#0f8fe8", "#1e9e57", "#f27a1a", "#6d3df5", "#5a5d6b", "#3C0078",
        };

        private static readonly string[] Excellent =
        {
            "Excellent work. Your solution is clear and well tested. Try the extension task next.",
            "Outstanding. You explained your thinking really well, and it all works.",
        };
        private static readonly string[] Good =
        {
            "Good work. It works for the normal cases; test the edge cases too, like 0 or an empty answer.",
            "Nicely done. A few more comments in your work would make it easier to follow.",
        };
        private static readonly string[] Okay =
        {
            "You are on the right track. Go through the worked example on the module page again, then try once more.",
            "Some parts work. Test each step on its own before you put them together.",
        };
        private static readonly string[] Struggling =
        {
            "Let's go through this together in our next lesson. Bring your work and we'll find where it goes wrong.",
            "Not quite there yet. Redo the practice activities in the module first; they build up to this task.",
        };

        public static JsonDocument LoadCourses()
        {
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("LearnOnline.Data.showcase-courses.json")!;
            return JsonDocument.Parse(stream);
        }

        public static void Seed(AppDbContext context, bool refresh = false)
        {
            using var file = LoadCourses();
            var courses = file.RootElement.GetProperty("courses").EnumerateArray().ToList();
            var now = DateTime.UtcNow;

            var hash = new Lazy<string>(() => BCrypt.Net.BCrypt.HashPassword(Password));
            User Person(string email, string first, string last, UserRole role)
            {
                var user = context.Users.Local.FirstOrDefault(u => u.Email == email) ?? context.Users.FirstOrDefault(u => u.Email == email);
                if (user != null) return user;
                user = new User
                {
                    Email = email,
                    PasswordHash = hash.Value,
                    FirstName = first,
                    LastName = last,
                    Role = role,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                context.Users.Add(user);
                return user;
            }

            var people = new People(
                Lecturer: Person(LecturerEmail, "Dev", "Teacher", UserRole.teacher),
                Student: Person(StudentEmail, "Dev", "Student", UserRole.student),
                Admin: Person(AdminEmail, "Dev", "Admin", UserRole.admin),
                Classmates: Classmates.Select(c => Person(c.Email, c.First, c.Last, UserRole.student)).ToList());

            if (refresh)
            {
                var codes = courses.Select(c => c.GetProperty("code").GetString()).Append(RetiredCourseCode).ToHashSet();
                Remove(context, context.Courses.Where(c => codes.Contains(c.Code)).ToList());
            }

            var existing = context.Courses.Where(c => c.Code != null).Select(c => c.Code).ToHashSet();
            for (var index = 0; index < courses.Count; index++)
            {
                var data = courses[index];
                var code = data.GetProperty("code").GetString()!;
                if (existing.Contains(code)) continue;

                // Each course's own learners, named the same way every time so a rerun finds them.
                var learners = Enumerable.Range(0, LearnersPerCourse).Select(n =>
                {
                    var seed = index * LearnersPerCourse + n;
                    var first = FirstNames[seed % FirstNames.Length];
                    var last = LastNames[(seed * 7 + index) % LastNames.Length];
                    var email = $"{first}.{last.Replace(" ", "")}.{code}@koru.demo".ToLowerInvariant();
                    return Person(email, first, last, UserRole.student);
                }).ToList();

                Add(context, data, index, people, learners, now);
            }

            context.SaveChanges();
        }

        private record People(User Lecturer, User Student, User Admin, List<User> Classmates);

        private static void Add(AppDbContext context, JsonElement data, int index, People people, List<User> learners, DateTime now)
        {
            var name = data.GetProperty("name").GetString()!;
            var code = data.GetProperty("code").GetString()!;

            var subject = new Subject { Name = name, Code = code, Description = data.GetProperty("description").GetString(), CreatedBy = people.Admin.Id };
            var course = new Course
            {
                Name = name,
                Code = code,
                Term = data.GetProperty("term").GetString()!,
                Year = now.Year,
                Capacity = 30,
                SubjectId = subject.Id,
                TeacherId = people.Lecturer.Id,
                IsVisible = true,
                Content = data.GetProperty("home").GetRawText(),
            };
            context.Subjects.Add(subject);
            context.Courses.Add(course);

            // The dev student first, then the classmates, then this course's own learners.
            var everyone = people.Classmates.Prepend(people.Student).Concat(learners).ToList();
            for (var i = 0; i < everyone.Count; i++)
                context.Enrollments.Add(new Enrollment { CourseId = course.Id, StudentId = everyone[i].Id, Status = "Active", EnrolledAt = now.AddDays(-75).AddHours(i) });

            var module = new CourseModule { CourseId = course.Id, Title = data.GetProperty("module").GetString()!, IsPublished = true, IsOpen = true };
            context.CourseModules.Add(module);

            var pages = data.GetProperty("items").EnumerateArray().Select((page, order) => new CourseModuleItem
            {
                ModuleId = module.Id,
                Label = page.GetProperty("label").GetString()!,
                Type = "document",
                IsPublished = true,
                SortOrder = order,
                Content = page.GetProperty("content").GetRawText(),
            }).ToList();
            context.CourseModuleItems.AddRange(pages);

            // A few classmates have already passed the first activities, so the results view has
            // something to show. They are marked for real, with the answer the build recorded as
            // correct. The dev student has none: their first submit is the one you watch appear.
            var done = 0;
            var classmates = people.Classmates;
            foreach (var check in data.GetProperty("checks").EnumerateArray().Take(4))
            {
                var page = pages[check.GetProperty("page").GetInt32()];
                var blockId = check.GetProperty("blockId").GetString()!;
                var block = PageBlocks.FindBlock(page.Content, blockId);
                if (block == null) continue;

                var answer = check.GetProperty("answer");
                var result = BlockMarker.Mark(block, answer);
                foreach (var who in classmates.Skip(done % classmates.Count).Take(2 - done % 2))
                {
                    context.Attempts.Add(new Attempt
                    {
                        StudentId = who.Id,
                        PageId = page.Id,
                        BlockId = blockId,
                        AnswerJson = answer.GetRawText(),
                        Passed = result.Passed,
                        Score = result.Score,
                        MaxScore = result.MaxScore,
                        CreatedAt = now.AddMinutes(-30 - 17 * done),
                    });
                }
                done++;
            }

            Coursework(context, data, course, module.Title, index, people, everyone, now);
        }

        // A term that started ten weeks ago: two assignments marked, one due in a few days, one coming up.
        private static void Coursework(AppDbContext context, JsonElement data, Course course, string moduleTitle, int index, People people, List<User> everyone, DateTime now)
        {
            var code = course.Code!;
            var colour = Colours[index % Colours.Length];
            var lecturerId = people.Lecturer.Id;
            // 23:59 in South Africa (UTC+2) on the day `days` from now.
            DateTime Deadline(int days) => now.Date.AddDays(days).AddHours(21).AddMinutes(59);
            string SaDay(DateTime utc) => utc.AddHours(2).ToString("dddd d MMMM", CultureInfo.InvariantCulture);

            var schedule = new[] { (Open: -63, Due: -42), (Open: -35, Due: -14), (Open: -7, Due: 3), (Open: -1, Due: 17) };
            var assignments = data.GetProperty("assignments").EnumerateArray().Select((a, k) => new Assignment
            {
                CourseId = course.Id,
                Title = a.GetProperty("title").GetString()!,
                Description = a.GetProperty("description").GetString(),
                MaxPoints = a.GetProperty("points").GetInt32(),
                OpenDate = now.Date.AddDays(schedule[k].Open).AddHours(6),
                DueDate = Deadline(schedule[k].Due),
                CreatedAt = now.Date.AddDays(schedule[k].Open - 1),
                IsClosed = schedule[k].Due < 0,
                Type = "online",
            }).ToList();
            context.Assignments.AddRange(assignments);

            for (var k = 0; k < 3; k++)
            {
                var assignment = assignments[k];
                var due = assignment.DueDate!.Value;
                var max = assignment.MaxPoints!.Value;
                var marked = k < 2;

                for (var j = 0; j < everyone.Count; j++)
                {
                    var learner = everyone[j];
                    var isDev = j == 0;
                    var isClassmate = j > 0 && j <= people.Classmates.Count;

                    // Marked work: almost everyone handed in. The one due soon: about half so far.
                    // The dev student has handed it in for every second course, so both states show.
                    var handedIn = marked
                        ? isDev || isClassmate || (j * 7 + k * 3 + index) % 10 != 0
                        : isDev ? index % 2 == 0 : isClassmate || (j + index) % 2 == 0;
                    if (!handedIn) continue;

                    var late = marked && !isDev && (j * 3 + k + index) % 9 == 0;
                    var submission = new Submission
                    {
                        AssignmentId = assignment.Id,
                        StudentId = learner.Id,
                        SubmittedAt = late ? due.AddHours(2 + j % 20) : due.AddDays(-(j % 5) - 1).AddHours(-(j % 12)),
                        Status = !marked ? "Submitted" : late ? "Late" : "Graded",
                        FileUrl = $"/uploads/{code.ToLowerInvariant()}/{Slug(assignment.Title)}/{learner.Id}.pdf",
                    };
                    context.Submissions.Add(submission);
                    if (!marked) continue;

                    var percent = isDev ? 84 + 7 * k : Percent(j, k, index);
                    var points = Math.Round(percent / 100m * max, 0);
                    var markedAt = due.AddDays(6).AddHours(j % 24);
                    context.Grades.Add(new Grade { SubmissionId = submission.Id, PointsEarned = points, GradedAt = markedAt, GradedBy = lecturerId, IsReleased = true });
                    context.Feedbacks.Add(new Feedback { SubmissionId = submission.Id, TeacherId = lecturerId, Content = Comment(percent, j + k), CreatedAt = markedAt });
                }
            }

            Announcement Notice(string title, string preview, string label, string tint, DateTime posted) =>
                new Announcement { CourseId = course.Id, LecturerId = lecturerId, Title = title, Preview = preview, Label = label, Color = tint, DatePosted = posted };
            context.Announcements.AddRange(
                Notice($"Welcome to {course.Name}",
                    $"{data.GetProperty("description").GetString()} This term's module is \"{moduleTitle}\". Open Modules to start, and try every activity: they mark themselves, so you can see straight away how you are doing.",
                    "Notice", colour, now.Date.AddDays(-70).AddHours(6)),
                Notice($"Marks are out: {assignments[0].Title}",
                    $"Your marks and comments for {assignments[0].Title} are in. Read the comments before you start {assignments[1].Title}: most of them will help with it.",
                    "Update", "#20c997", assignments[0].DueDate!.Value.AddDays(7)),
                Notice($"Marks are out: {assignments[1].Title}",
                    $"Well done to everyone who handed in {assignments[1].Title}. Your marks and comments are in Grades. If anything is unclear, ask in our next lesson.",
                    "Update", "#20c997", assignments[1].DueDate!.Value.AddDays(7)),
                Notice($"Reminder: {assignments[2].Title} is due {SaDay(assignments[2].DueDate!.Value)}",
                    $"Hand in {assignments[2].Title} by 23:59 on {SaDay(assignments[2].DueDate!.Value)}. The instructions are in Assignments. Upload early so there's time to fix anything that goes wrong.",
                    "Deadline", "#FF8731", now.Date.AddDays(-2).AddHours(7)));

            // One lesson a week, Monday to Friday, three time slots. South African time is UTC+2.
            var saToday = now.AddHours(2).Date;
            var monday = saToday.AddDays(-(((int)saToday.DayOfWeek + 6) % 7));
            var startSa = new[] { 8, 10, 13 }[index / 5 % 3];
            var length = index >= 9 ? 2 : 1;
            var room = index < 3 ? "Classroom 2" : index < 9 ? "Computer lab" : index < 12 ? "IT lab" : "Lecture hall B";
            DateTime Lesson(int week) => DateTime.SpecifyKind(monday.AddDays(7 * week + index % 5).AddHours(startSa - 2), DateTimeKind.Utc);

            for (var week = -2; week < 6; week++)
            {
                var start = Lesson(week);
                context.Events.Add(new Event
                {
                    CourseId = course.Id,
                    Title = $"{code} - {(index >= 9 ? "Practical" : "Lesson")}",
                    Description = $"{course.Name}|{room}",
                    EventType = "class",
                    StartTime = start,
                    EndTime = start.AddHours(length),
                    CreatedBy = $"{people.Lecturer.FirstName} {people.Lecturer.LastName}",
                    BgColor = colour,
                    TextColor = "#ffffff",
                });
            }

            // The last eight lessons' register.
            for (var week = 1; week <= 8; week++)
            {
                var date = Lesson(-week);
                for (var j = 0; j < everyone.Count; j++)
                {
                    var roll = (j * 3 + week * 7 + index) % 20;
                    context.Attendances.Add(new Attendance
                    {
                        CourseId = course.Id,
                        StudentId = everyone[j].Id,
                        Date = date,
                        Status = roll is 3 or 13 ? "Absent" : roll == 7 ? "Late" : "Present",
                        SessionType = week % 3 == 0 ? "Practical" : "Lecture",
                        Time = $"{startSa:00}:00",
                        RecordedById = lecturerId,
                        RecordedAt = date.AddHours(length),
                    });
                }
            }

            // The teacher's to-do list: marking for every third course, and one from the admin.
            string TodoDate(DateTime utc) => utc.AddHours(2).ToString("MMM d 'at' HH:mm", CultureInfo.InvariantCulture);
            if (index % 3 == 0)
                context.TodoItems.Add(new TodoItem { Title = $"Mark {assignments[2].Title}", CourseCode = code, DueDate = TodoDate(assignments[2].DueDate!.Value.AddDays(7)), TeacherId = lecturerId, CreatedAt = now.AddDays(-1) });
            if (index == 9)
                context.TodoItems.Add(new TodoItem { Title = $"Capture {code} term marks before the report deadline", CourseCode = code, DueDate = TodoDate(Deadline(10)), TeacherId = lecturerId, CreatedByAdminId = people.Admin.Id, CreatedAt = now.AddDays(-3) });
        }

        // A spread like a real class: a few struggle, most pass, some do very well.
        private static int Percent(int learner, int assignment, int course)
        {
            var bucket = (learner * 37 + assignment * 13 + course * 7) % 100;
            if (bucket < 8) return 35 + (learner + course) % 14;
            if (bucket < 28) return 50 + (learner * 3 + assignment * 5) % 15;
            if (bucket < 80) return 65 + (learner * 11 + course) % 15;
            return 80 + (learner * 17 + assignment * 3) % 18;
        }

        private static string Comment(int percent, int seed)
        {
            var pool = percent >= 80 ? Excellent : percent >= 65 ? Good : percent >= 50 ? Okay : Struggling;
            return pool[seed % pool.Length];
        }

        private static string Slug(string title) =>
            new string(title.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : '_').ToArray()).Trim('_');

        private static void Remove(AppDbContext context, List<Course> courses)
        {
            foreach (var course in courses)
            {
                var modules = context.CourseModules.Where(m => m.CourseId == course.Id).ToList();
                var moduleIds = modules.Select(m => m.Id).ToList();
                var items = context.CourseModuleItems.Where(i => moduleIds.Contains(i.ModuleId)).ToList();
                var pageIds = items.Select(i => i.Id).Concat(moduleIds).ToList();

                var assignmentIds = context.Assignments.Where(a => a.CourseId == course.Id).Select(a => a.Id).ToList();
                var submissionIds = context.Submissions.Where(s => assignmentIds.Contains(s.AssignmentId)).Select(s => s.Id).ToList();
                var announcementIds = context.Announcements.Where(a => a.CourseId == course.Id).Select(a => a.Id).ToList();

                context.Feedbacks.RemoveRange(context.Feedbacks.Where(f => submissionIds.Contains(f.SubmissionId)));
                context.Grades.RemoveRange(context.Grades.Where(g => submissionIds.Contains(g.SubmissionId)));
                context.Submissions.RemoveRange(context.Submissions.Where(s => submissionIds.Contains(s.Id)));
                context.AssignmentClassOverrides.RemoveRange(context.AssignmentClassOverrides.Where(o => assignmentIds.Contains(o.AssignmentId)));
                context.Assignments.RemoveRange(context.Assignments.Where(a => assignmentIds.Contains(a.Id)));
                context.AnnouncementReadStates.RemoveRange(context.AnnouncementReadStates.Where(r => announcementIds.Contains(r.AnnouncementId)));
                context.Announcements.RemoveRange(context.Announcements.Where(a => announcementIds.Contains(a.Id)));
                context.Attendances.RemoveRange(context.Attendances.Where(a => a.CourseId == course.Id));
                context.Events.RemoveRange(context.Events.Where(e => e.CourseId == course.Id));
                context.TodoItems.RemoveRange(context.TodoItems.Where(t => t.CourseCode == course.Code));

                context.Attempts.RemoveRange(context.Attempts.Where(a => pageIds.Contains(a.PageId)));
                context.CourseModuleItems.RemoveRange(items);
                context.CourseModules.RemoveRange(modules);
                context.Enrollments.RemoveRange(context.Enrollments.Where(e => e.CourseId == course.Id));
                context.Courses.Remove(course);
                if (course.SubjectId != null && !context.Courses.Any(c => c.SubjectId == course.SubjectId && c.Id != course.Id))
                    context.Subjects.RemoveRange(context.Subjects.Where(s => s.Id == course.SubjectId));
            }
            context.SaveChanges();
        }
    }
}
