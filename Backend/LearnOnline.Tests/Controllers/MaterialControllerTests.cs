using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class MaterialControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@m.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Users.Add(teacher);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course);
    }

    [Fact]
    public async Task GetAll_ReturnsMaterials()
    {
        var (db, course) = Seed();
        db.Materials.Add(TestData.MakeMaterial(course.Id));
        await db.SaveChangesAsync();

        var controller = new MaterialController(db);
        (await controller.GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, course) = Seed();
        var m = TestData.MakeMaterial(course.Id);
        db.Materials.Add(m);
        await db.SaveChangesAsync();
        var controller = new MaterialController(db);
        (await controller.GetById(m.Id)).Value!.Id.Should().Be(m.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _) = Seed();
        var controller = new MaterialController(db);
        (await controller.GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, course) = Seed();
        var controller = new MaterialController(db);
        var m = new Material { Title = "M1", CourseId = course.Id, FileUrl = "u", FileType = "pdf" };
        (await controller.Create(m)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Materials.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var (db, course) = Seed();
        var m = TestData.MakeMaterial(course.Id);
        db.Materials.Add(m);
        await db.SaveChangesAsync();

        var controller = new MaterialController(db);
        var result = await controller.Update(m.Id, new Material { Title = "New", FileUrl = "new", FileType = "mp4", UploadedBy = "x", CourseId = course.Id });

        result.Should().BeOfType<NoContentResult>();
        (await db.Materials.FindAsync(m.Id))!.Title.Should().Be("New");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, course) = Seed();
        var controller = new MaterialController(db);
        (await controller.Update("missing", new Material { CourseId = course.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course) = Seed();
        var m = TestData.MakeMaterial(course.Id);
        db.Materials.Add(m);
        await db.SaveChangesAsync();

        var controller = new MaterialController(db);
        (await controller.Delete(m.Id)).Should().BeOfType<NoContentResult>();
        db.Materials.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _) = Seed();
        var controller = new MaterialController(db);
        (await controller.Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
