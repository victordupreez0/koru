using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class SubmissionControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Assignment assignment, User student, Course course) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@su.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@su.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        var assignment = TestData.MakeAssignment(course.Id);
        db.Users.AddRange(teacher, student);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.Assignments.Add(assignment);
        db.SaveChanges();
        return (db, assignment, student, course);
    }

    [Fact]
    public async Task GetAll_ReturnsSubmissions()
    {
        var (db, assignment, student, _) = Seed();
        db.Submissions.Add(TestData.MakeSubmission(assignment.Id, student.Id));
        await db.SaveChangesAsync();
        (await new SubmissionController(db).GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, assignment, student, _) = Seed();
        var s = TestData.MakeSubmission(assignment.Id, student.Id);
        db.Submissions.Add(s);
        await db.SaveChangesAsync();
        (await new SubmissionController(db).GetById(s.Id)).Value!.Id.Should().Be(s.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _, _, _) = Seed();
        (await new SubmissionController(db).GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByStudentId_Filters()
    {
        var (db, assignment, student, _) = Seed();
        db.Submissions.Add(TestData.MakeSubmission(assignment.Id, student.Id));
        db.Submissions.Add(TestData.MakeSubmission(assignment.Id, "other"));
        await db.SaveChangesAsync();

        var result = await new SubmissionController(db).GetByStudentId(student.Id);
        result.Value!.Should().ContainSingle(s => s.StudentId == student.Id);
    }

    [Fact]
    public async Task GetByAssignmentId_Filters()
    {
        var (db, assignment, student, _) = Seed();
        db.Submissions.Add(TestData.MakeSubmission(assignment.Id, student.Id));
        await db.SaveChangesAsync();

        var result = await new SubmissionController(db).GetByAssignmentId(assignment.Id);
        result.Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetByCourseId_Filters()
    {
        var (db, assignment, student, course) = Seed();
        db.Submissions.Add(TestData.MakeSubmission(assignment.Id, student.Id));
        await db.SaveChangesAsync();

        var result = await new SubmissionController(db).GetByCourseId(course.Id);
        result.Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, assignment, student, _) = Seed();
        var s = new Submission { AssignmentId = assignment.Id, StudentId = student.Id, FileUrl = "u", Status = "Pending" };
        (await new SubmissionController(db).Create(s)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Submissions.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesStatus()
    {
        var (db, assignment, student, _) = Seed();
        var s = TestData.MakeSubmission(assignment.Id, student.Id);
        db.Submissions.Add(s);
        await db.SaveChangesAsync();

        var result = await new SubmissionController(db).Update(s.Id, new Submission { AssignmentId = assignment.Id, StudentId = student.Id, Status = "Graded", FileUrl = "x" });

        result.Should().BeOfType<NoContentResult>();
        (await db.Submissions.FindAsync(s.Id))!.Status.Should().Be("Graded");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, assignment, student, _) = Seed();
        (await new SubmissionController(db).Update("missing", new Submission { AssignmentId = assignment.Id, StudentId = student.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, assignment, student, _) = Seed();
        var s = TestData.MakeSubmission(assignment.Id, student.Id);
        db.Submissions.Add(s);
        await db.SaveChangesAsync();

        (await new SubmissionController(db).Delete(s.Id)).Should().BeOfType<NoContentResult>();
        db.Submissions.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _, _, _) = Seed();
        (await new SubmissionController(db).Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
