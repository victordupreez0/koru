using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class AssignmentControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course, User student) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@a.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        var student = TestData.MakeUser(role: UserRole.student, email: "s@a.com");
        db.Users.AddRange(teacher, student);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course, student);
    }

    [Fact]
    public async Task GetAll_ReturnsAllAssignments()
    {
        var (db, course, _) = Seed();
        db.Assignments.Add(TestData.MakeAssignment(course.Id));
        db.Assignments.Add(TestData.MakeAssignment(course.Id));
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var result = await controller.GetAll();

        result.Value!.Count().Should().Be(2);
    }

    [Fact]
    public async Task GetById_Existing_ReturnsAssignment()
    {
        var (db, course, _) = Seed();
        var assignment = TestData.MakeAssignment(course.Id);
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var result = await controller.GetById(assignment.Id);

        result.Value!.Id.Should().Be(assignment.Id);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new AssignmentController(db);
        (await controller.GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByCourseId_FiltersByCourse()
    {
        var (db, course, _) = Seed();
        db.Assignments.Add(TestData.MakeAssignment(course.Id));
        db.Assignments.Add(TestData.MakeAssignment("other"));
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var result = await controller.GetByCourseId(course.Id);

        result.Value!.Should().ContainSingle(a => a.CourseId == course.Id);
    }

    [Fact]
    public async Task GetByStudentId_ReturnsOnlyActiveEnrolledCourses()
    {
        var (db, course, student) = Seed();
        db.Enrollments.Add(TestData.MakeEnrollment(student.Id, course.Id, "Active"));
        db.Enrollments.Add(TestData.MakeEnrollment(student.Id, "dropped-course", "Dropped"));
        db.Assignments.Add(TestData.MakeAssignment(course.Id));
        db.Assignments.Add(TestData.MakeAssignment("dropped-course"));
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var result = await controller.GetByStudentId(student.Id);

        result.Value!.Should().ContainSingle(a => a.CourseId == course.Id);
    }

    [Fact]
    public async Task Create_PersistsAssignment()
    {
        var (db, course, _) = Seed();
        var controller = new AssignmentController(db);
        var assignment = new Assignment { Title = "A1", CourseId = course.Id };

        var result = await controller.Create(assignment);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        db.Assignments.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var (db, course, _) = Seed();
        var assignment = TestData.MakeAssignment(course.Id);
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var updated = new Assignment { Title = "Updated", CourseId = course.Id, MaxPoints = 50 };
        var result = await controller.Update(assignment.Id, updated);

        result.Should().BeOfType<NoContentResult>();
        (await db.Assignments.FindAsync(assignment.Id))!.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        var (db, course, _) = Seed();
        var controller = new AssignmentController(db);
        var result = await controller.Update("missing", new Assignment { Title = "x", CourseId = course.Id });
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course, _) = Seed();
        var assignment = TestData.MakeAssignment(course.Id);
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var controller = new AssignmentController(db);
        var result = await controller.Delete(assignment.Id);

        result.Should().BeOfType<NoContentResult>();
        db.Assignments.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new AssignmentController(db);
        var result = await controller.Delete("missing");
        result.Should().BeOfType<NotFoundResult>();
    }
}
