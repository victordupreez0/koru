using FluentAssertions;
using LearnOnline.Services.Assistant;
using Microsoft.Extensions.Logging.Abstractions;

namespace LearnOnline.Tests.Assistant;

public class AssistantComposerTests
{
    private class FakeContext : IAssistantContextBuilder
    {
        public Task<AssistantContext> LoadAsync(string? userId, string? role, CancellationToken ct) =>
            Task.FromResult(new AssistantContext { Courses = 3, Assignments = 8, Text = "COURSES:\n- X\n" });
    }

    private class FakeProvider : IChatProvider
    {
        private readonly Queue<Func<ProviderResult>> _script;
        public List<ProviderRequest> Requests { get; } = new();
        public FakeProvider(string name, bool configured, params Func<ProviderResult>[] script)
        {
            Name = name; IsConfigured = configured; _script = new(script);
        }
        public string Name { get; }
        public bool IsConfigured { get; }
        public Task<ProviderResult> CompleteAsync(ProviderRequest request, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(_script.Count > 0 ? _script.Dequeue()() : ProviderResult.Fail("script empty"));
        }
    }

    private static Func<ProviderResult> Reply(string message, string? question = null) =>
        () => ProviderResult.Ok(System.Text.Json.JsonSerializer.Serialize(new { message, question }));
    private static Func<ProviderResult> Raw(string raw) => () => ProviderResult.Ok(raw);
    private static Func<ProviderResult> Fail() => () => ProviderResult.Fail("HTTP 503");
    private static Func<ProviderResult> Throw() => () => throw new HttpRequestException("boom secret");

    private static AssistantComposer Make(params IChatProvider[] providers) =>
        new(new FakeContext(), new ProviderFallback(providers, NullLogger<ProviderFallback>.Instance), NullLogger<AssistantComposer>.Instance);

    private static AssistantRequest Req() => new(
        new[] { new AssistantTurn("user", "hi"), new AssistantTurn("assistant", "hello"), new AssistantTurn("user", "<b>help</b> me") },
        "u1", "student");

    private static (List<(string stage, string text)> stages, Func<string, string, Task> cb) Collect()
    {
        var list = new List<(string, string)>();
        return (list, (s, t) => { list.Add((s, t)); return Task.CompletedTask; });
    }

    [Fact]
    public async Task Valid_first_time()
    {
        var deepseek = new FakeProvider("deepseek", true, Reply("Do the lab.", "Which course?"));
        var (stages, cb) = Collect();

        var r = await Make(deepseek, new FakeProvider("groq", true)).ComposeAsync(Req(), cb, default);

        r.Ok.Should().BeTrue();
        r.Message.Should().Be("Do the lab.");
        r.Question.Should().Be("Which course?");
        r.Provider.Should().Be("deepseek");
        r.Fallback.Should().BeFalse();
        r.ContextSummary.Should().Be("your 3 courses, 8 assignments and 2 earlier messages");
        stages.Select(s => s.stage).Should().Equal("reading", "planning", "checking");
        stages[0].text.Should().Be("Reading your message alongside your 3 courses, 8 assignments and 2 earlier messages");
        stages[1].text.Should().Be("Working out a reply");

        var sent = deepseek.Requests.Single();
        sent.Messages[0].Role.Should().Be("system");
        sent.Messages[1].Content.Should().Be("<user_message>hi</user_message>");
        sent.Messages[2].Content.Should().Be("{\"message\":\"hello\",\"question\":null}");
        sent.Messages[3].Content.Should().Be("<user_message>bhelp/b me</user_message>");
    }

    [Fact]
    public async Task Long_history_drops_oldest_turns_but_keeps_latest()
    {
        var p = new FakeProvider("deepseek", true, Reply("ok"));
        var big = new string('x', 3900);
        var turns = Enumerable.Range(0, 20)
            .Select(i => new AssistantTurn(i % 2 == 0 ? "user" : "assistant", i == 19 ? "latest" : big))
            .ToList();
        turns[19] = new AssistantTurn("user", "latest");
        await Make(p).ComposeAsync(new AssistantRequest(turns, "u1", "student"), null, default);
        var sent = p.Requests.Single().Messages.Skip(1).ToList();
        sent.Sum(m => m.Content.Length).Should().BeLessThan(26000);
        sent[^1].Content.Should().Be("<user_message>latest</user_message>");
    }

    [Fact]
    public async Task Invalid_then_valid_emits_retrying_and_sends_reasons()
    {
        var p = new FakeProvider("deepseek", true, Raw("not json"), Reply("Fixed."));
        var (stages, cb) = Collect();

        var r = await Make(p).ComposeAsync(Req(), cb, default);

        r.Ok.Should().BeTrue();
        r.Message.Should().Be("Fixed.");
        r.Fallback.Should().BeFalse();
        stages.Select(s => s.stage).Should().Equal("reading", "planning", "checking", "retrying", "checking");
        stages.Single(s => s.stage == "retrying").text.Should().Be("The first reply did not fit, so I am asking again with what was wrong.");
        p.Requests.Should().HaveCount(2);
        var last = p.Requests[1].Messages.Last();
        last.Role.Should().Be("user");
        last.Content.Should().Contain("rejected for these reasons").And.Contain("not valid json");
    }

    [Fact]
    public async Task Invalid_twice_returns_fixed_fallback()
    {
        var p = new FakeProvider("deepseek", true, Raw("nope"), Reply("has id " + Guid.NewGuid()));
        var r = await Make(p).ComposeAsync(Req(), null, default);

        r.Ok.Should().BeTrue();
        r.Fallback.Should().BeTrue();
        r.Question.Should().BeNull();
        r.Message.Should().Be(ReplyValidator.FallbackMessage);
        r.Provider.Should().Be("deepseek");
        p.Requests.Should().HaveCount(2);
    }

    [Fact]
    public async Task Primary_failure_uses_second_provider_and_announces_backup()
    {
        var ds = new FakeProvider("deepseek", true, Fail());
        var groq = new FakeProvider("groq", true, Reply("From groq."));
        var (stages, cb) = Collect();

        var r = await Make(ds, groq).ComposeAsync(Req(), cb, default);

        r.Ok.Should().BeTrue();
        r.Provider.Should().Be("groq");
        stages.Where(s => s.stage == "planning").Select(s => s.text).Should()
            .Equal("Working out a reply", "The first service did not answer, so I am asking a backup");
    }

    [Fact]
    public async Task Primary_throws_uses_second_provider()
    {
        var r = await Make(new FakeProvider("deepseek", true, Throw()), new FakeProvider("groq", true, Reply("ok")))
            .ComposeAsync(Req(), null, default);
        r.Ok.Should().BeTrue();
        r.Provider.Should().Be("groq");
    }

    [Fact]
    public async Task Primary_without_key_uses_second_provider()
    {
        var ds = new FakeProvider("deepseek", false, Reply("never"));
        var r = await Make(ds, new FakeProvider("groq", true, Reply("ok"))).ComposeAsync(Req(), null, default);
        r.Provider.Should().Be("groq");
        ds.Requests.Should().BeEmpty();
    }

    [Fact]
    public async Task Retry_goes_to_the_provider_that_answered()
    {
        var ds = new FakeProvider("deepseek", true, Fail());
        var groq = new FakeProvider("groq", true, Raw("bad"), Reply("Good."));
        var r = await Make(ds, groq).ComposeAsync(Req(), null, default);
        r.Message.Should().Be("Good.");
        r.Provider.Should().Be("groq");
        ds.Requests.Should().HaveCount(1); // retry goes straight to groq
    }

    [Fact]
    public async Task Both_fail_returns_error()
    {
        var r = await Make(new FakeProvider("deepseek", true, Throw()), new FakeProvider("groq", true, Fail()))
            .ComposeAsync(Req(), null, default);
        r.Ok.Should().BeFalse();
        r.Error.Should().Be(AssistantComposer.UnavailableError);
        r.Error.Should().NotContain("boom");
    }

    [Fact]
    public async Task No_keys_returns_not_configured_error()
    {
        var r = await Make(new FakeProvider("deepseek", false), new FakeProvider("groq", false)).ComposeAsync(Req(), null, default);
        r.Ok.Should().BeFalse();
        r.Error.Should().Be(AssistantComposer.NotConfiguredError);
    }

    [Fact]
    public async Task Cancellation_propagates()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var act = () => Make(new FakeProvider("deepseek", true, Reply("x"))).ComposeAsync(Req(), null, cts.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
