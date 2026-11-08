using System.Text.Json;
using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Services.Marking;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Tests.Controllers;

public class AttemptControllerTests
{
    private const string BlockId = "block-1";

    private static readonly string PageJson = JsonSerializer.Serialize(new
    {
        title = "Page",
        sections = new[]
        {
            new
            {
                id = "main",
                type = "text",
                content = new
                {
                    type = "doc",
                    content = new object[]
                    {
                        new { type = "paragraph" },
                        new { type = PageBlocks.Squares, attrs = new { blockId = BlockId, rows = 2, cols = 2, correct = new[] { 0, 3 } } },
                        new { type = PageBlocks.Quiz, attrs = new { blockId = "quiz-1", questions = new[] { new { question = "q", options = new[] { "a", "b" }, correctAnswer = 1 } } } },
                    },
                },
            },
        },
    });

    private sealed record World(AppDbContext Db, User Student, User Teacher, User Outsider, CourseModuleItem Item, AttemptController Controller);

    private static World Seed()
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@c.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@c.com");
        var outsider = TestData.MakeUser(role: UserRole.student, email: "o@c.com");
        var subject = TestData.MakeSubject();
        var course = TestData.MakeCourse(subject.Id, teacher.Id);
        var module = new CourseModule { CourseId = course.Id, Title = "M", IsPublished = true };
        var item = new CourseModuleItem { ModuleId = module.Id, Label = "L", Content = PageJson, IsPublished = true };
        db.AddRange(teacher, student, outsider, subject, course, module, item);
        db.Enrollments.Add(new Enrollment { CourseId = course.Id, StudentId = student.Id });
        db.SaveChanges();
        return new World(db, student, teacher, outsider, item, new AttemptController(db));
    }

    private static AttemptController.SubmitRequest Req(string userId, string answer) =>
        new() { UserId = userId, Answer = JsonDocument.Parse(answer).RootElement };

    private static JsonElement Body(IActionResult r) =>
        JsonDocument.Parse(JsonSerializer.Serialize(((OkObjectResult)r).Value)).RootElement;

    [Fact]
    public async Task Correct_answer_passes_and_is_saved()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[0,3]}"""));

        Body(r).GetProperty("Passed").GetBoolean().Should().BeTrue();
        var saved = w.Db.Attempts.Single();
        saved.Passed.Should().BeTrue();
        saved.Score.Should().Be(2);
        saved.StudentId.Should().Be(w.Student.Id);
        saved.BlockId.Should().Be(BlockId);
        saved.AnswerJson.Should().Contain("cells");
    }

    [Fact]
    public async Task Wrong_answer_fails_and_is_saved()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[1]}"""));

        Body(r).GetProperty("Passed").GetBoolean().Should().BeFalse();
        w.Db.Attempts.Single().Passed.Should().BeFalse();
    }

    [Fact]
    public async Task Tampered_answer_claiming_a_pass_is_marked_on_its_merits()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[1],"passed":true,"score":100}"""));

        Body(r).GetProperty("Passed").GetBoolean().Should().BeFalse();
        w.Db.Attempts.Single().Score.Should().Be(0);
    }

    [Fact]
    public async Task Marking_uses_the_block_stored_on_the_server_after_an_edit()
    {
        var w = Seed();
        w.Item.Content = PageJson.Replace("[0,3]", "[1]");
        await w.Db.SaveChangesAsync();

        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[0,3]}"""));
        Body(r).GetProperty("Passed").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Malformed_answer_is_a_400_and_saves_nothing()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":"all"}"""));
        r.Should().BeOfType<BadRequestObjectResult>();
        w.Db.Attempts.Should().BeEmpty();
    }

    [Fact]
    public async Task Oversized_answer_is_refused()
    {
        var w = Seed();
        var cells = string.Join(",", Enumerable.Repeat("0", 20_000));
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, $$"""{"cells":[{{cells}}]}"""));
        r.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Unknown_user_is_refused()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req("nobody", """{"cells":[0,3]}"""));
        r.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Unknown_block_or_page_is_404()
    {
        var w = Seed();
        (await w.Controller.Submit(w.Item.Id, "made-up", Req(w.Student.Id, "{}"))).Should().BeOfType<NotFoundObjectResult>();
        (await w.Controller.Submit("made-up", BlockId, Req(w.Student.Id, "{}"))).Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Student_not_on_the_course_is_refused()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Outsider.Id, """{"cells":[0,3]}"""));
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        w.Db.Attempts.Should().BeEmpty();
    }

    [Fact]
    public async Task Unpublished_page_is_refused_for_students()
    {
        var w = Seed();
        w.Item.IsPublished = false;
        await w.Db.SaveChangesAsync();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[0,3]}"""));
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Lecturer_previews_are_marked_but_not_recorded()
    {
        var w = Seed();
        var r = await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Teacher.Id, """{"cells":[0,3]}"""));
        var body = Body(r);
        body.GetProperty("Passed").GetBoolean().Should().BeTrue();
        body.GetProperty("recorded").GetBoolean().Should().BeFalse();
        w.Db.Attempts.Should().BeEmpty();
    }

    [Fact]
    public async Task Mine_returns_progress_for_each_block()
    {
        var w = Seed();
        await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[1]}"""));
        await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[0,3]}"""));

        var mine = Body(await w.Controller.Mine(w.Item.Id, w.Student.Id));
        var entry = mine.EnumerateArray().Single();
        entry.GetProperty("attempts").GetInt32().Should().Be(2);
        entry.GetProperty("passed").GetBoolean().Should().BeTrue();
        entry.GetProperty("lastAnswer").GetProperty("cells").GetArrayLength().Should().Be(2);
    }

    [Fact]
    public async Task Results_summarise_each_student_for_lecturers()
    {
        var w = Seed();
        await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[1]}"""));
        await w.Controller.Submit(w.Item.Id, BlockId, Req(w.Student.Id, """{"cells":[0,3]}"""));

        var results = Body(await w.Controller.Results(w.Item.Id, BlockId, w.Teacher.Id));
        results.GetProperty("enrolled").GetInt32().Should().Be(1);
        results.GetProperty("attempted").GetInt32().Should().Be(1);
        results.GetProperty("passed").GetInt32().Should().Be(1);
        var student = results.GetProperty("students").EnumerateArray().Single();
        student.GetProperty("attempts").GetInt32().Should().Be(2);
        student.GetProperty("bestScore").GetDouble().Should().Be(2);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Results_are_hidden_from_students_and_strangers(bool useStudent)
    {
        var w = Seed();
        var r = await w.Controller.Results(w.Item.Id, BlockId, useStudent ? w.Student.Id : null);
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Answer_keys_are_removed_from_what_students_load()
    {
        var w = Seed();
        var controller = new CourseModuleItemController(w.Db);

        var forStudent = (await controller.GetById(w.Item.Id)).Value!;
        forStudent.Content.Should().NotContain("correct");

        var studentAskingForEdit = (await controller.GetById(w.Item.Id, forEdit: true, userId: w.Student.Id)).Value!;
        studentAskingForEdit.Content.Should().NotContain("correct");

        var forLecturer = (await controller.GetById(w.Item.Id, forEdit: true, userId: w.Teacher.Id)).Value!;
        forLecturer.Content.Should().Contain("correctAnswer");
    }

    [Fact]
    public async Task Loading_a_page_for_students_never_changes_what_is_stored()
    {
        var w = Seed();
        await new CourseModuleItemController(w.Db).GetById(w.Item.Id);
        await w.Db.SaveChangesAsync();
        w.Db.CourseModuleItems.Single().Content.Should().Contain("correctAnswer");
    }

    [Fact]
    public async Task Module_lists_hide_answer_keys_too()
    {
        var w = Seed();
        var modules = (await new CourseModuleController(w.Db).GetByCourse(w.Db.CourseModules.Single().CourseId)).Value!;
        modules.Single().Items.Single().Content.Should().NotContain("correct");
    }
}
