using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class SubjectControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsAllSubjects()
    {
        using var db = TestDbContextFactory.Create();
        db.Subjects.Add(TestData.MakeSubject(code: "A"));
        db.Subjects.Add(TestData.MakeSubject(code: "B"));
        await db.SaveChangesAsync();

        var controller = new SubjectController(db);
        var result = await controller.GetAll();

        result.Value.Should().NotBeNull();
        result.Value!.Count().Should().Be(2);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsSubject()
    {
        using var db = TestDbContextFactory.Create();
        var subject = TestData.MakeSubject();
        db.Subjects.Add(subject);
        await db.SaveChangesAsync();

        var controller = new SubjectController(db);
        var result = await controller.GetById(subject.Id);

        result.Value.Should().NotBeNull();
        result.Value!.Id.Should().Be(subject.Id);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new SubjectController(db);

        var result = await controller.GetById("nope");

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_AssignsIdAndPersists()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new SubjectController(db);
        var subject = new Subject { Name = "Math", Code = "MA100" };

        var result = await controller.Create(subject);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        subject.Id.Should().NotBeNullOrWhiteSpace();
        db.Subjects.Should().ContainSingle(s => s.Id == subject.Id);
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        using var db = TestDbContextFactory.Create();
        var subject = TestData.MakeSubject();
        db.Subjects.Add(subject);
        await db.SaveChangesAsync();

        var controller = new SubjectController(db);
        var updated = new Subject { Name = "Renamed", Code = "NEW", Description = "x", CreatedBy = "y" };
        var result = await controller.Update(subject.Id, updated);

        result.Should().BeOfType<NoContentResult>();
        (await db.Subjects.FindAsync(subject.Id))!.Name.Should().Be("Renamed");
    }

    [Fact]
    public async Task Update_Missing_ReturnsNotFound()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new SubjectController(db);
        var result = await controller.Update("missing", new Subject { Name = "x", Code = "y" });
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_RemovesSubject()
    {
        using var db = TestDbContextFactory.Create();
        var subject = TestData.MakeSubject();
        db.Subjects.Add(subject);
        await db.SaveChangesAsync();

        var controller = new SubjectController(db);
        var result = await controller.Delete(subject.Id);

        result.Should().BeOfType<NoContentResult>();
        db.Subjects.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_ReturnsNotFound()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new SubjectController(db);
        var result = await controller.Delete("missing");
        result.Should().BeOfType<NotFoundResult>();
    }
}
