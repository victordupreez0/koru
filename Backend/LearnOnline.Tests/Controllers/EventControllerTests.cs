using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class EventControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@ev.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Users.Add(teacher);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course);
    }

    [Fact]
    public async Task GetAll_ReturnsEvents()
    {
        var (db, course) = Seed();
        db.Events.Add(TestData.MakeEvent(course.Id));
        await db.SaveChangesAsync();

        var controller = new EventController(db);
        (await controller.GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, course) = Seed();
        var ev = TestData.MakeEvent(course.Id);
        db.Events.Add(ev);
        await db.SaveChangesAsync();
        var controller = new EventController(db);
        (await controller.GetById(ev.Id)).Value!.Id.Should().Be(ev.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _) = Seed();
        var controller = new EventController(db);
        (await controller.GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, course) = Seed();
        var controller = new EventController(db);
        var ev = new Event { Title = "Exam", CourseId = course.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1) };
        (await controller.Create(ev)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Events.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var (db, course) = Seed();
        var ev = TestData.MakeEvent(course.Id);
        db.Events.Add(ev);
        await db.SaveChangesAsync();

        var controller = new EventController(db);
        var result = await controller.Update(ev.Id, new Event { Title = "Renamed", CourseId = course.Id, StartTime = ev.StartTime, EndTime = ev.EndTime });

        result.Should().BeOfType<NoContentResult>();
        (await db.Events.FindAsync(ev.Id))!.Title.Should().Be("Renamed");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, course) = Seed();
        var controller = new EventController(db);
        (await controller.Update("missing", new Event { CourseId = course.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course) = Seed();
        var ev = TestData.MakeEvent(course.Id);
        db.Events.Add(ev);
        await db.SaveChangesAsync();

        var controller = new EventController(db);
        (await controller.Delete(ev.Id)).Should().BeOfType<NoContentResult>();
        db.Events.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _) = Seed();
        var controller = new EventController(db);
        (await controller.Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
