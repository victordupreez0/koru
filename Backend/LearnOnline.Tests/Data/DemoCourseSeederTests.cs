using System.Text.Json;
using FluentAssertions;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Data;

public class DemoCourseSeederTests
{
    private static AppDbContext Seeded()
    {
        var db = TestDbContextFactory.Create();
        DemoCourseSeeder.Seed(db);
        return db;
    }

    private static CourseModuleItem Page(AppDbContext db, string label) => db.CourseModuleItems.Single(i => i.Label.Contains(label));

    [Fact]
    public void Creates_the_course_and_a_login_per_role()
    {
        var db = Seeded();
        db.Courses.Should().ContainSingle(c => c.Name == DemoCourseSeeder.CourseName && c.IsVisible);
        db.Users.Single(u => u.Email == DemoCourseSeeder.LecturerEmail).Role.Should().Be(UserRole.teacher);
        db.Users.Single(u => u.Email == DemoCourseSeeder.StudentEmail).Role.Should().Be(UserRole.student);
        db.Users.Single(u => u.Email == DemoCourseSeeder.AdminEmail).Role.Should().Be(UserRole.admin);
        BCrypt.Net.BCrypt.Verify(DemoCourseSeeder.Password, db.Users.First().PasswordHash).Should().BeTrue();
    }

    [Fact]
    public void Running_twice_adds_nothing()
    {
        var db = Seeded();
        var users = db.Users.Count();
        DemoCourseSeeder.Seed(db);
        db.Users.Count().Should().Be(users);
        db.Courses.Should().ContainSingle();
    }

    [Fact]
    public void The_demo_student_starts_with_no_attempts()
    {
        var db = Seeded();
        var student = db.Users.Single(u => u.Email == DemoCourseSeeder.StudentEmail);
        db.Attempts.Should().NotContain(a => a.StudentId == student.Id);
        db.Enrollments.Should().Contain(e => e.StudentId == student.Id);
    }

    [Fact]
    public void Shows_off_every_block()
    {
        var db = Seeded();
        var all = string.Concat(db.CourseModuleItems.Select(i => i.Content));
        foreach (var type in new[] { "heading", "bulletList", "orderedList", "taskList", "callout", "blockquote", "horizontalRule", "table", "image", "embed", "fileAttachment", "codeBlock", "drawing", PageBlocks.Squares, PageBlocks.Move, PageBlocks.Quiz })
            all.Should().Contain($"\"type\": \"{type}\"", because: $"the demo should include {type}");
    }

    [Theory]
    [InlineData("letter T", "demo-squares", """{"cells":[0,1,2,4,7]}""")]
    [InlineData("robot", "demo-move", """{"program":"move right 2\nmove up 4\nmove right 2"}""")]
    [InlineData("Quiz", "demo-quiz", """{"answers":[0,1,2]}""")]
    public void The_intended_answers_pass(string page, string blockId, string answer)
    {
        var db = Seeded();
        var block = PageBlocks.FindBlock(Page(db, page).Content, blockId);
        BlockMarker.Mark(block!, JsonDocument.Parse(answer).RootElement).Passed.Should().BeTrue();
    }
}
