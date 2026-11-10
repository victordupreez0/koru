using System.Text.Json;
using FluentAssertions;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Data;

public class ShowcaseSeederTests
{
    private static AppDbContext Seeded()
    {
        var db = TestDbContextFactory.Create();
        ShowcaseSeeder.Seed(db);
        return db;
    }

    private static List<JsonElement> Courses(JsonDocument file) => file.RootElement.GetProperty("courses").EnumerateArray().ToList();

    [Fact]
    public void Creates_every_course_and_a_login_per_role()
    {
        using var file = ShowcaseSeeder.LoadCourses();
        var db = Seeded();

        db.Courses.Count().Should().Be(Courses(file).Count);
        db.Courses.Should().OnlyContain(c => c.IsVisible);
        db.Users.Single(u => u.Email == ShowcaseSeeder.LecturerEmail).Role.Should().Be(UserRole.teacher);
        db.Users.Single(u => u.Email == ShowcaseSeeder.StudentEmail).Role.Should().Be(UserRole.student);
        db.Users.Single(u => u.Email == ShowcaseSeeder.AdminEmail).Role.Should().Be(UserRole.admin);
        BCrypt.Net.BCrypt.Verify(ShowcaseSeeder.Password, db.Users.First().PasswordHash).Should().BeTrue();
    }

    [Fact]
    public void There_is_one_course_per_grade_with_one_short_module()
    {
        using var file = ShowcaseSeeder.LoadCourses();
        var courses = Courses(file);

        courses.Should().HaveCount(13);
        courses.Select(c => c.GetProperty("code").GetString()).Should().OnlyHaveUniqueItems();
        courses.Should().OnlyContain(c => c.GetProperty("items").GetArrayLength() >= 3 && c.GetProperty("items").GetArrayLength() <= 5);
    }

    [Fact]
    public void Running_twice_adds_nothing()
    {
        var db = Seeded();
        var (users, courses, pages) = (db.Users.Count(), db.Courses.Count(), db.CourseModuleItems.Count());

        ShowcaseSeeder.Seed(db);

        db.Users.Count().Should().Be(users);
        db.Courses.Count().Should().Be(courses);
        db.CourseModuleItems.Count().Should().Be(pages);
    }

    [Fact]
    public void Refresh_rebuilds_the_pages_without_duplicating_anything()
    {
        var db = Seeded();
        var (users, courses, pages, enrolments) = (db.Users.Count(), db.Courses.Count(), db.CourseModuleItems.Count(), db.Enrollments.Count());
        var (assignments, submissions, grades, events) = (db.Assignments.Count(), db.Submissions.Count(), db.Grades.Count(), db.Events.Count());
        var edited = db.CourseModuleItems.First();
        edited.Content = "{}";
        db.SaveChanges();

        ShowcaseSeeder.Seed(db, refresh: true);

        db.Users.Count().Should().Be(users);
        db.Courses.Count().Should().Be(courses);
        db.CourseModuleItems.Count().Should().Be(pages);
        db.Enrollments.Count().Should().Be(enrolments);
        db.CourseModuleItems.Should().NotContain(i => i.Content == "{}");
        db.Assignments.Count().Should().Be(assignments);
        db.Submissions.Count().Should().Be(submissions);
        db.Grades.Count().Should().Be(grades);
        db.Events.Count().Should().Be(events);
    }

    [Fact]
    public void The_demo_student_is_in_every_course_and_starts_with_no_attempts()
    {
        var db = Seeded();
        var student = db.Users.Single(u => u.Email == ShowcaseSeeder.StudentEmail);

        db.Enrollments.Count(e => e.StudentId == student.Id).Should().Be(db.Courses.Count());
        db.Attempts.Should().NotContain(a => a.StudentId == student.Id);
        db.Attempts.Should().NotBeEmpty().And.OnlyContain(a => a.Passed);
    }

    // The build records one answer per activity that it believes is correct. Marking each of them
    // with the real marker proves that nothing in the showcase is impossible to pass.
    [Fact]
    public void Every_marked_activity_can_be_passed()
    {
        using var file = ShowcaseSeeder.LoadCourses();
        var failures = new List<string>();
        var total = 0;

        foreach (var course in Courses(file))
        {
            var pages = course.GetProperty("items").EnumerateArray().ToList();
            foreach (var check in course.GetProperty("checks").EnumerateArray())
            {
                total++;
                var blockId = check.GetProperty("blockId").GetString()!;
                var block = PageBlocks.FindBlock(pages[check.GetProperty("page").GetInt32()].GetProperty("content").GetRawText(), blockId);
                if (block == null)
                {
                    failures.Add($"{blockId}: not found");
                    continue;
                }
                var result = BlockMarker.Mark(block, check.GetProperty("answer"));
                if (!result.Passed) failures.Add($"{blockId}: {result.Message}");
            }
        }

        total.Should().BeGreaterThan(60);
        failures.Should().BeEmpty();
    }

    [Fact]
    public void Students_never_receive_an_answer_key()
    {
        using var file = ShowcaseSeeder.LoadCourses();
        foreach (var page in Courses(file).SelectMany(c => c.GetProperty("items").EnumerateArray()))
        {
            var sent = PageBlocks.StripAnswers(page.GetProperty("content").GetRawText())!;
            sent.Should().NotContain("\"correctAnswer\"").And.NotContain("\"solution\"").And.NotContain("\"correct\"").And.NotContain("\"distractors\"");
            sent.Should().NotMatchRegex("\"group\":\"g\\d");
        }
    }

    [Fact]
    public void Every_course_has_a_term_of_coursework()
    {
        var db = Seeded();
        var student = db.Users.Single(u => u.Email == ShowcaseSeeder.StudentEmail);
        var teacher = db.Users.Single(u => u.Email == ShowcaseSeeder.LecturerEmail);
        var now = DateTime.UtcNow;

        foreach (var course in db.Courses.ToList())
        {
            var assignments = db.Assignments.Where(a => a.CourseId == course.Id).OrderBy(a => a.DueDate).ToList();
            assignments.Should().HaveCount(4);
            assignments.Take(2).Should().OnlyContain(a => a.IsClosed && a.DueDate < now);
            assignments.Skip(2).Should().OnlyContain(a => !a.IsClosed && a.DueDate > now);
            db.Submissions.Should().NotContain(s => s.AssignmentId == assignments[3].Id);
            db.Announcements.Count(a => a.CourseId == course.Id).Should().Be(4);
            db.Events.Count(e => e.CourseId == course.Id).Should().BeGreaterThan(0);
            db.Attendances.Count(a => a.CourseId == course.Id).Should().BeGreaterThan(0);
        }

        // Work that was due is marked, released and commented on; work due later is not marked yet.
        var dueWork = db.Submissions.Where(s => s.Status != "Submitted").Select(s => s.Id).ToList();
        db.Grades.Select(g => g.SubmissionId).Should().BeEquivalentTo(dueWork);
        db.Grades.Should().OnlyContain(g => g.IsReleased && g.GradedBy == teacher.Id);
        db.Feedbacks.Count().Should().Be(dueWork.Count);

        db.Submissions.Count(s => s.StudentId == student.Id && s.Status == "Graded").Should().Be(2 * db.Courses.Count());
        db.TodoItems.Should().Contain(t => t.TeacherId == teacher.Id);
    }
}
