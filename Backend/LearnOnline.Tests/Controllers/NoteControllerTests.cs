using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class NoteControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course, User student, User author) Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@n.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@n.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        db.Users.AddRange(teacher, student);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course, student, teacher);
    }

    [Fact]
    public async Task GetAll_ReturnsNotes()
    {
        var (db, course, student, author) = Seed();
        db.Notes.Add(TestData.MakeNote(course.Id, student.Id, author.Id));
        await db.SaveChangesAsync();
        (await new NoteController(db).GetAll()).Value!.Count().Should().Be(1);
    }

    [Fact]
    public async Task GetById_Existing()
    {
        var (db, course, student, author) = Seed();
        var n = TestData.MakeNote(course.Id, student.Id, author.Id);
        db.Notes.Add(n);
        await db.SaveChangesAsync();
        (await new NoteController(db).GetById(n.Id)).Value!.Id.Should().Be(n.Id);
    }

    [Fact]
    public async Task GetById_Missing_NotFound()
    {
        var (db, _, _, _) = Seed();
        (await new NoteController(db).GetById("missing")).Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, course, student, author) = Seed();
        var n = new Note { Title = "n", Content = "c", CourseId = course.Id, StudentId = student.Id, AuthorId = author.Id };
        (await new NoteController(db).Create(n)).Result.Should().BeOfType<CreatedAtActionResult>();
        db.Notes.Should().ContainSingle();
    }

    [Fact]
    public async Task Update_ChangesContent()
    {
        var (db, course, student, author) = Seed();
        var n = TestData.MakeNote(course.Id, student.Id, author.Id);
        db.Notes.Add(n);
        await db.SaveChangesAsync();

        var result = await new NoteController(db).Update(n.Id, new Note { Title = "T", Content = "Updated", CourseId = course.Id, StudentId = student.Id, AuthorId = author.Id });

        result.Should().BeOfType<NoContentResult>();
        (await db.Notes.FindAsync(n.Id))!.Content.Should().Be("Updated");
    }

    [Fact]
    public async Task Update_Missing_NotFound()
    {
        var (db, course, student, author) = Seed();
        (await new NoteController(db).Update("missing", new Note { CourseId = course.Id, StudentId = student.Id, AuthorId = author.Id })).Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course, student, author) = Seed();
        var n = TestData.MakeNote(course.Id, student.Id, author.Id);
        db.Notes.Add(n);
        await db.SaveChangesAsync();

        (await new NoteController(db).Delete(n.Id)).Should().BeOfType<NoContentResult>();
        db.Notes.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _, _, _) = Seed();
        (await new NoteController(db).Delete("missing")).Should().BeOfType<NotFoundResult>();
    }
}
