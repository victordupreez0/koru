namespace LearnOnline.Services.Assistant;

public sealed record AssistantTurn(string Role, string Content);

public sealed record AssistantRequest(
    IReadOnlyList<AssistantTurn> Messages, string? UserId, string? Role, string? Mode)
{
    public bool Advanced => string.Equals(Mode?.Trim(), "advanced", StringComparison.OrdinalIgnoreCase);
}

public sealed record AssistantResult
{
    public bool Ok { get; init; }
    public string? Message { get; init; }
    public string? Question { get; init; }
    public string? ContextSummary { get; init; }
    public string Provider { get; init; } = "none";
    public bool Fallback { get; init; }
    public string? Error { get; init; }

    public static AssistantResult Failure(string error) => new() { Ok = false, Error = error };
}

public interface IAssistantComposer
{
    Task<AssistantResult> ComposeAsync(AssistantRequest request, Func<string, string, Task>? onStage, CancellationToken ct);
}

/// <summary>Runs the pipeline: load context, ask a provider, validate, retry once, then fixed fallback.</summary>
public sealed class AssistantComposer : IAssistantComposer
{
    public const string ReadingStage = "reading";
    public const string PlanningStage = "planning";
    public const string CheckingStage = "checking";
    public const string RetryingStage = "retrying";

    public const string RetryingText = "The first reply did not fit, so I am asking again with what was wrong.";
    public const string BackupText = "The first service did not answer, so I am asking a backup";
    public const string NotConfiguredError = "The assistant is not set up yet. Please ask an administrator to add an API key.";
    public const string UnavailableError = "The assistant is not answering right now. Please try again in a moment.";
    public const string NoMessageError = "There was no message to answer.";

    private const int MaxTurns = 20;
    private const int MaxTurnLength = 4000;

    private readonly IAssistantContextBuilder _contextBuilder;
    private readonly ProviderFallback _providers;
    private readonly ILogger<AssistantComposer> _logger;

    public AssistantComposer(IAssistantContextBuilder contextBuilder, ProviderFallback providers, ILogger<AssistantComposer> logger)
    {
        _contextBuilder = contextBuilder;
        _providers = providers;
        _logger = logger;
    }

    public async Task<AssistantResult> ComposeAsync(AssistantRequest request, Func<string, string, Task>? onStage, CancellationToken ct)
    {
        async Task Stage(string stage, string text)
        {
            if (onStage != null) await onStage(stage, text);
        }

        var turns = request.Messages
            .Where(m => (m.Role == "user" || m.Role == "assistant") && !string.IsNullOrWhiteSpace(m.Content))
            .Select(m => new AssistantTurn(m.Role, m.Content.Length > MaxTurnLength ? m.Content[..MaxTurnLength] : m.Content))
            .ToList();
        if (turns.Count > MaxTurns) turns = turns.Skip(turns.Count - MaxTurns).ToList();
        if (turns.Count == 0) return AssistantResult.Failure(NoMessageError);

        if (!_providers.AnyConfigured) return AssistantResult.Failure(NotConfiguredError);

        // 1. Context, then "reading" built from what was actually loaded.
        var context = await _contextBuilder.LoadAsync(request.UserId, request.Role, ct);
        var earlier = turns.Count - 1;
        await Stage(ReadingStage, context.BuildReadingText(earlier));
        var summary = context.BuildSummary(earlier);

        var messages = new List<ProviderMessage>
        {
            new("system", AssistantPrompt.BuildSystemPrompt(request.Role, context.Text))
        };
        foreach (var t in turns)
            messages.Add(new(t.Role, t.Role == "user" ? AssistantPrompt.WrapUserText(t.Content) : t.Content));

        // 2. First provider call (with provider fallback).
        await Stage(PlanningStage, request.Advanced ? "Thinking it through carefully" : "Working out a reply");
        Func<Task> onSwitch = () => Stage(PlanningStage, BackupText);

        var outcome = await _providers.CompleteAsync(new ProviderRequest(messages, request.Advanced), null, onSwitch, ct);
        if (outcome == null) return AssistantResult.Failure(UnavailableError);

        // 3. Validate; retry once with the reasons; then fixed fallback.
        await Stage(CheckingStage, "Checking the reply");
        var validation = ReplyValidator.Validate(outcome.Content);
        if (validation.IsValid) return Success(validation.Reply!, summary, outcome.Provider);

        _logger.LogInformation("Assistant reply rejected ({Count} problem(s)); retrying once", validation.Errors.Count);
        await Stage(RetryingStage, RetryingText);

        var retryMessages = new List<ProviderMessage>(messages)
        {
            new("assistant", outcome.Content.Length > 2000 ? outcome.Content[..2000] : outcome.Content),
            new("user", AssistantPrompt.BuildRetryMessage(validation.Errors)),
        };
        var retry = await _providers.CompleteAsync(new ProviderRequest(retryMessages, request.Advanced), outcome.Provider, null, ct);
        if (retry != null)
        {
            await Stage(CheckingStage, "Checking the reply");
            var second = ReplyValidator.Validate(retry.Content);
            if (second.IsValid) return Success(second.Reply!, summary, retry.Provider);
            outcome = retry;
        }

        return new AssistantResult
        {
            Ok = true,
            Message = ReplyValidator.FallbackMessage,
            Question = null,
            ContextSummary = summary,
            Provider = outcome.Provider,
            Fallback = true,
        };
    }

    private static AssistantResult Success(AssistantReply reply, string summary, string provider) => new()
    {
        Ok = true,
        Message = reply.Message,
        Question = reply.Question,
        ContextSummary = summary,
        Provider = provider,
        Fallback = false,
    };
}
