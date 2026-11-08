using FluentAssertions;
using LearnOnline.Controllers;
using LearnOnline.Data;
using LearnOnline.Models;
using LearnOnline.Services.Assistant;
using LearnOnline.Services.Marking;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace LearnOnline.Tests.Controllers;

public class QuizGenerationControllerTests
{
    private const string GoodReply = """{"questions":[{"question":"What?","options":["a","b","c","d"],"correctAnswer":2}]}""";
    private static readonly string LongText = new('x', 100);

    private sealed class FakeProvider : IChatProvider
    {
        private readonly Queue<ProviderResult> _replies;
        public int Calls { get; private set; }
        public bool IsConfigured { get; init; } = true;
        public string Name => "fake";
        public string? LastPrompt { get; private set; }

        public FakeProvider(params ProviderResult[] replies) => _replies = new(replies);

        public Task<ProviderResult> CompleteAsync(ProviderRequest request, CancellationToken ct)
        {
            Calls++;
            LastPrompt = request.Messages.Last().Content;
            return Task.FromResult(_replies.Count > 0 ? _replies.Dequeue() : ProviderResult.Fail("none"));
        }
    }

    private static (QuizGenerationController Controller, string TeacherId, string StudentId) Make(FakeProvider provider)
    {
        var db = TestDbContextFactory.Create();
        var teacher = TestData.MakeUser(role: UserRole.teacher, email: "t@c.com");
        var student = TestData.MakeUser(role: UserRole.student, email: "s@c.com");
        db.AddRange(teacher, student);
        db.SaveChanges();
        var controller = new QuizGenerationController(db, new ProviderFallback(new[] { provider }, NullLogger<ProviderFallback>.Instance))
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        return (controller, teacher.Id, student.Id);
    }

    private static QuizGenerationController.GenerateRequest Req(string? userId, string? text = null, int count = 5) =>
        new() { UserId = userId, Text = text ?? LongText, Count = count };

    [Fact]
    public async Task Good_reply_returns_questions()
    {
        var (c, teacher, _) = Make(new FakeProvider(ProviderResult.Ok(GoodReply)));
        var r = await c.Generate(Req(teacher));
        r.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Students_cannot_generate()
    {
        var provider = new FakeProvider(ProviderResult.Ok(GoodReply));
        var (c, _, student) = Make(provider);
        var r = await c.Generate(Req(student));
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        provider.Calls.Should().Be(0);
    }

    [Fact]
    public async Task No_ai_configured_fails_gracefully()
    {
        var (c, teacher, _) = Make(new FakeProvider { IsConfigured = false });
        var r = await c.Generate(Req(teacher));
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
    }

    [Fact]
    public async Task Provider_failure_fails_gracefully()
    {
        var (c, teacher, _) = Make(new FakeProvider(ProviderResult.Fail("HTTP 500")));
        var r = await c.Generate(Req(teacher));
        r.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
    }

    [Fact]
    public async Task Unusable_reply_is_retried_once()
    {
        var provider = new FakeProvider(ProviderResult.Ok("not json"), ProviderResult.Ok(GoodReply));
        var (c, teacher, _) = Make(provider);
        (await c.Generate(Req(teacher))).Should().BeOfType<OkObjectResult>();
        provider.Calls.Should().Be(2);
    }

    [Fact]
    public async Task Too_little_text_is_a_400()
    {
        var (c, teacher, _) = Make(new FakeProvider(ProviderResult.Ok(GoodReply)));
        (await c.Generate(Req(teacher, "short"))).Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Very_long_pages_are_trimmed_before_sending()
    {
        var provider = new FakeProvider(ProviderResult.Ok(GoodReply));
        var (c, teacher, _) = Make(provider);
        await c.Generate(Req(teacher, new string('y', 50_000)));
        provider.LastPrompt!.Length.Should().BeLessThan(13_000);
    }

    [Fact]
    public void Parser_reads_fenced_json_and_bare_arrays()
    {
        QuizDraftParser.Parse($"```json\n{GoodReply}\n```", 5).Should().ContainSingle();
        QuizDraftParser.Parse("""[{"question":"q","options":["a","b"],"correctAnswer":1}]""", 5).Should().ContainSingle();
    }

    [Theory]
    [InlineData("""{"questions":[{"question":"","options":["a","b"],"correctAnswer":0}]}""")]
    [InlineData("""{"questions":[{"question":"q","options":["a"],"correctAnswer":0}]}""")]
    [InlineData("""{"questions":[{"question":"q","options":["a","b"],"correctAnswer":5}]}""")]
    [InlineData("""{"questions":[{"question":"q","options":["a","b"],"correctAnswer":"1"}]}""")]
    [InlineData("""{"questions":[{"question":"q","options":["a",""],"correctAnswer":0}]}""")]
    [InlineData("""{"questions":"nope"}""")]
    [InlineData("""{"other":1}""")]
    [InlineData("nothing useful")]
    [InlineData(null)]
    public void Parser_drops_anything_unusable(string? reply)
    {
        QuizDraftParser.Parse(reply, 5).Should().BeEmpty();
    }

    [Fact]
    public void Parser_keeps_good_questions_and_respects_the_limit()
    {
        var q = """{"question":"q","options":["a","b"],"correctAnswer":0}""";
        var bad = """{"question":"","options":[],"correctAnswer":0}""";
        QuizDraftParser.Parse($$"""{"questions":[{{q}},{{bad}},{{q}},{{q}}]}""", 2).Should().HaveCount(2);
    }
}
