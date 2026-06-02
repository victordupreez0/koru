using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class GradeControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Submission submission, User teacher, User student, Course course) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@g.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@g.com");
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
        return (db, submission, teacher, student, course);
    }

    [Fact]
    public async Task GetAll_ReturnsGrades()
    {
        var (db, submission, teacher, _, _) = Seed();
        db.Grades.Add(TestData.MakeGrade(submission.Id, teacher.Id));
        await db.SaveChangesAsync();
        (await new GradeController(db).GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, submission, teacher, _, _) = Seed();
        var g = TestData.MakeGrade(submission.Id, teacher.Id);
        db.Grades.Add(g);
        await db.SaveChangesAsync();
        (await new GradeController(db).GetById(g.Id)).Value!.Id.Should().Be(g.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _, _, _, _) = Seed();
        (await new GradeController(db).GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByStudentId_FiltersToStudent()
    {
        var (db, submission, teacher, student, _) = Seed();
        db.Grades.Add(TestData.MakeGrade(submission.Id, teacher.Id));
        await db.SaveChangesAsync();

        var result = await new GradeController(db).GetByStudentId(student.Id);
        result.Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetByCourseId_FiltersToCourse()
    {
        var (db, submission, teacher, _, course) = Seed();
        db.Grades.Add(TestData.MakeGrade(submission.Id, teacher.Id));
        await db.SaveChangesAsync();

        var result = await new GradeController(db).GetByCourseId(course.Id);
        result.Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, submission, teacher, _, _) = Seed();
        var g = new Grade { SubmissionId = submission.Id, GradedBy = teacher.Id, PointsEarned = 80m };
        (await new GradeController(db).Create(g)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Grades.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesPoints()
    {
        var (db, submission, teacher, _, _) = Seed();
        var g = TestData.MakeGrade(submission.Id, teacher.Id, points: 60m);
        db.Grades.Add(g);
        await db.SaveChangesAsync();

        var result = await new GradeController(db).Update(g.Id, new Grade { SubmissionId = submission.Id, GradedBy = teacher.Id, PointsEarned = 95m });

        result.Should().BeOfType<NoContentResult>();
        (await db.Grades.FindAsync(g.Id))!.PointsEarned.Should().Be(95m);
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, submission, teacher, _, _) = Seed();
        (await new GradeController(db).Update("missing", new Grade { SubmissionId = submission.Id, GradedBy = teacher.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, submission, teacher, _, _) = Seed();
        var g = TestData.MakeGrade(submission.Id, teacher.Id);
        db.Grades.Add(g);
        await db.SaveChangesAsync();

        (await new GradeController(db).Delete(g.Id)).Should().BeOfType<NoContentResult>();
        db.Grades.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _, _, _, _) = Seed();
        (await new GradeController(db).Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
