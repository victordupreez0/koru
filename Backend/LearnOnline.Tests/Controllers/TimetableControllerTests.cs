using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class TimetableControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, User user) Seed()
    {
        var db = TestDbContextFactory.Create();
        var user = TestData.MakeUser(email: "tt@x.com");
        db.Users.Add(user);
        db.SaveChanges();
        return (db, user);
    }

    [Fact]
    public async Task GetAll_ReturnsTimetables()
    {
        var (db, user) = Seed();
        db.Timetables.Add(TestData.MakeTimetable(user.Id));
        await db.SaveChangesAsync();
        (await new TimetableController(db).GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, user) = Seed();
        var t = TestData.MakeTimetable(user.Id);
        db.Timetables.Add(t);
        await db.SaveChangesAsync();
        (await new TimetableController(db).GetById(t.Id)).Value!.Id.Should().Be(t.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _) = Seed();
        (await new TimetableController(db).GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, user) = Seed();
        var t = new Timetable { UserId = user.Id, Term = "T1", Year = 2026 };
        (await new TimetableController(db).Create(t)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Timetables.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesTerm()
    {
        var (db, user) = Seed();
        var t = TestData.MakeTimetable(user.Id);
        db.Timetables.Add(t);
        await db.SaveChangesAsync();

        var result = await new TimetableController(db).Update(t.Id, new Timetable { UserId = user.Id, Term = "T3", Year = 2027 });

        result.Should().BeOfType<NoContentResult>();
        (await db.Timetables.FindAsync(t.Id))!.Term.Should().Be("T3");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, user) = Seed();
        (await new TimetableController(db).Update("missing", new Timetable { UserId = user.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, user) = Seed();
        var t = TestData.MakeTimetable(user.Id);
        db.Timetables.Add(t);
        await db.SaveChangesAsync();

        (await new TimetableController(db).Delete(t.Id)).Should().BeOfType<NoContentResult>();
        db.Timetables.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _) = Seed();
        (await new TimetableController(db).Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
