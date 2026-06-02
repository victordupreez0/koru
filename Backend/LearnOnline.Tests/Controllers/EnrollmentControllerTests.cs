using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class EnrollmentControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course, User student) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@e.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        var student = TestData.MakeUser(role: UserRole.student, email: "s@e.com");
        db.Users.AddRange(teacher, student);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course, student);
    }

    [Fact]
    public async Task GetAll_ReturnsAll()
    {
        var (db, course, student) = Seed();
        db.Enrollments.Add(TestData.MakeEnrollment(student.Id, course.Id));
        await db.SaveChangesAsync();

        var controller = new EnrollmentController(db);
        var result = await controller.GetAll();

        result.Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing_ReturnsEnrollment()
    {
        var (db, course, student) = Seed();
        var enrollment = TestData.MakeEnrollment(student.Id, course.Id);
        db.Enrollments.Add(enrollment);
        await db.SaveChangesAsync();

        var controller = new EnrollmentController(db);
        var result = await controller.GetById(enrollment.Id);

        result.Value!.Id.Should().Be(enrollment.Id);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new EnrollmentController(db);
        (await controller.GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByStudentId_ActiveOnly_ReturnsResults()
    {
        var (db, course, student) = Seed();
        db.Enrollments.Add(TestData.MakeEnrollment(student.Id, course.Id, "Active"));
        await db.SaveChangesAsync();

        var controller = new EnrollmentController(db);
        var result = await controller.GetByStudentId(student.Id);

        result.Value!.Should().ContainSingle();
    }

    [Fact]
    public async Task GetByStudentId_NoneActive_ReturnsNotFound()
    {
        var (db, _, student) = Seed();
        var controller = new EnrollmentController(db);
        (await controller.GetByStudentId(student.Id)).Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, course, student) = Seed();
        var controller = new EnrollmentController(db);
        var enrollment = new Enrollment { CourseId = course.Id, StudentId = student.Id, Status = "Active" };

        var result = await controller.Create(enrollment);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        db.Enrollments.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesStatus()
    {
        var (db, course, student) = Seed();
        var enrollment = TestData.MakeEnrollment(student.Id, course.Id);
        db.Enrollments.Add(enrollment);
        await db.SaveChangesAsync();

        var controller = new EnrollmentController(db);
        var result = await controller.Update(enrollment.Id, new Enrollment { Status = "Dropped", CourseId = course.Id, StudentId = student.Id });

        result.Should().BeOfType<NoContentResult>();
        (await db.Enrollments.FindAsync(enrollment.Id))!.Status.Should().Be("Dropped");
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        var (db, course, student) = Seed();
        var controller = new EnrollmentController(db);
        var result = await controller.Update("missing", new Enrollment { CourseId = course.Id, StudentId = student.Id });
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course, student) = Seed();
        var enrollment = TestData.MakeEnrollment(student.Id, course.Id);
        db.Enrollments.Add(enrollment);
        await db.SaveChangesAsync();

        var controller = new EnrollmentController(db);
        var result = await controller.Delete(enrollment.Id);

        result.Should().BeOfType<NoContentResult>();
        db.Enrollments.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new EnrollmentController(db);
        (await controller.Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
