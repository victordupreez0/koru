using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class FeedbackControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Submission submission, User teacher) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@f.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@f.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        var assignment = TestData.MakeAssignment(course.Id);
        var submission = TestData.MakeSubmission(assignment.Id, student.Id);
        db.Users.AddRange(teacher, student);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.Assignments.Add(assignment);
        db.Submissions.Add(submission);
        db.SaveChanges();
        return (db, submission, teacher);
    }

    [Fact]
    public async Task GetAll_ReturnsFeedback()
    {
        var (db, submission, teacher) = Seed();
        db.Feedbacks.Add(TestData.MakeFeedback(submission.Id, teacher.Id));
        await db.SaveChangesAsync();
        (await new FeedbackController(db).GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, submission, teacher) = Seed();
        var f = TestData.MakeFeedback(submission.Id, teacher.Id);
        db.Feedbacks.Add(f);
        await db.SaveChangesAsync();
        (await new FeedbackController(db).GetById(f.Id)).Value!.Id.Should().Be(f.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _, _) = Seed();
        (await new FeedbackController(db).GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, submission, teacher) = Seed();
        var f = new Feedback { Content = "ok", SubmissionId = submission.Id, TeacherId = teacher.Id };
        (await new FeedbackController(db).Create(f)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Feedbacks.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesContent()
    {
        var (db, submission, teacher) = Seed();
        var f = TestData.MakeFeedback(submission.Id, teacher.Id);
        db.Feedbacks.Add(f);
        await db.SaveChangesAsync();

        var result = await new FeedbackController(db).Update(f.Id, new Feedback { Content = "Updated", SubmissionId = submission.Id, TeacherId = teacher.Id });

        result.Should().BeOfType<NoContentResult>();
        (await db.Feedbacks.FindAsync(f.Id))!.Content.Should().Be("Updated");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, submission, teacher) = Seed();
        (await new FeedbackController(db).Update("missing", new Feedback { SubmissionId = submission.Id, TeacherId = teacher.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, submission, teacher) = Seed();
        var f = TestData.MakeFeedback(submission.Id, teacher.Id);
        db.Feedbacks.Add(f);
        await db.SaveChangesAsync();

        (await new FeedbackController(db).Delete(f.Id)).Should().BeOfType<NoContentResult>();
        db.Feedbacks.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _, _) = Seed();
        (await new FeedbackController(db).Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
