using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Models;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class AnnouncementControllerTests
{
    private static (LearnOnline.Data.AppDbContext db, Course course, User lecturer) Seed()
    {
        var db = TestDbContextFactory.Create();
        var lecturer = TestData.MakeUser(role: UserRole.teacher, email: "t@an.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, lecturer.Id);
        db.Users.Add(lecturer);
        db.Subjects.Add(subject);
        db.Courses.Add(course);
        db.SaveChanges();
        return (db, course, lecturer);
    }

    [Fact]
    public async Task GetByCourse_ReturnsCourseAnnouncements()
    {
        var (db, course, lecturer) = Seed();
        db.Announcements.Add(TestData.MakeAnnouncement(course.Id, lecturer.Id));
        await db.SaveChangesAsync();

        var result = await new AnnouncementController(db).GetAnnouncementsByCourse(course.Id);
        var ok = result.Result as OkObjectResult;
        ok.Should().NotBeNull();
        ((IEnumerable<object>)ok!.Value!).Count().Should().Be(1);
    }

    [Fact]
    public async Task Create_Persists()
    {
        var (db, course, lecturer) = Seed();
        var controller = new AnnouncementController(db);
        var dto = new CreateAnnouncementDto
        {
            CourseId = course.Id,
            LecturerId = lecturer.Id,
            Title = "Hi",
            Preview = "Read me",
            Label = "Info",
            Color = "#fff"
        };

        var result = await controller.CreateAnnouncement(dto);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        db.Announcements.Should().ContainSingle();
    }

    [Fact]
    public async Task Delete_Removes()
    {
        var (db, course, lecturer) = Seed();
        var ann = TestData.MakeAnnouncement(course.Id, lecturer.Id);
        db.Announcements.Add(ann);
        await db.SaveChangesAsync();

        var result = await new AnnouncementController(db).DeleteAnnouncement(ann.Id);
        result.Should().BeOfType<NoContentResult>();
        db.Announcements.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_Missing_NotFound()
    {
        var (db, _, _) = Seed();
        (await new AnnouncementController(db).DeleteAnnouncement("missing")).Should().BeOfType<NotFoundResult>();
    }
}
