using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class CourseControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, User teacher, Subject subject) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@x.com");
        var subject = TestData.MakeSubject();
        db.Users.Add(teacher);
        db.Subjects.Add(subject);
        db.SaveChanges();
        return (db, teacher, subject);
    }

    [Fact]
    public async Task GetAll_ReturnsCoursesWithIncludes()
    {
        var (db, teacher, subject) = Seed();
        db.Courses.Add(TestData.MakeCourse(subject.Id, teacher.Id));
        await db.SaveChangesAsync();

        var controller = new CourseController(db);
        var result = await controller.GetAll();

        result.Value!.Single().Subject.Should().NotBeNull();
        result.Value!.Single().Teacher.Should().NotBeNull();
    }

    [Fact]
    public async Task GetById_Existing_ReturnsCourse()
    {
        var (db, teacher, subject) = Seed();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Courses.Add(course);
        await db.SaveChangesAsync();

        var controller = new CourseController(db);
        var result = await controller.GetById(course.Id);

        result.Value!.Id.Should().Be(course.Id);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new CourseController(db);
        var result = await controller.GetById("nope");
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetByTeacher_FiltersByTeacherId()
    {
        var (db, teacher, subject) = Seed();
        db.Courses.Add(TestData.MakeCourse(subject.Id, teacher.Id));
        db.Courses.Add(TestData.MakeCourse(subject.Id, "other-teacher"));
        await db.SaveChangesAsync();

        var controller = new CourseController(db);
        var result = await controller.GetByTeacher(teacher.Id);

        result.Value!.Should().ContainSingle(c => c.TeacherId == teacher.Id);
    }

    [Fact]
    public async Task Create_AssignsIdAndPersists()
    {
        var (db, teacher, subject) = Seed();
        var controller = new CourseController(db);
        var course = new Course { Term = "T1", Year = 2026, SubjectId = subject.Id, TeacherId = teacher.Id };

        var result = await controller.Create(course);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        db.Courses.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var (db, teacher, subject) = Seed();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Courses.Add(course);
        await db.SaveChangesAsync();

        var controller = new CourseController(db);
        var updated = new Course { Term = "T2", Year = 2027, Capacity = 50, SubjectId = subject.Id, TeacherId = teacher.Id };
        var result = await controller.Update(course.Id, updated);

        result.Should().BeOfType<NoContentResult>();
        (await db.Courses.FindAsync(course.Id))!.Term.Should().Be("T2");
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        var (db, teacher, subject) = Seed();
        var controller = new CourseController(db);
        var result = await controller.Update("missing", new Course { Term = "T", Year = 1, SubjectId = subject.Id, TeacherId = teacher.Id });
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_RemovesCourse()
    {
        var (db, teacher, subject) = Seed();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Courses.Add(course);
        await db.SaveChangesAsync();

        var controller = new CourseController(db);
        var result = await controller.Delete(course.Id);

        result.Should().BeOfType<NoContentResult>();
        db.Courses.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        var (db, _, _) = Seed();
        var controller = new CourseController(db);
        var result = await controller.Delete("missing");
        result.Should().BeOfType<NotFoundResult>();
    }
}
