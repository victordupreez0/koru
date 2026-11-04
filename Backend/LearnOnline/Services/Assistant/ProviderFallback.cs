namespace LearnOnline.Services.Assistant;

public sealed record FallbackOutcome(string Provider, string Content);

/// <summary>Tries providers in order (primary first) and moves on when one does not answer.</summary>
public sealed class ProviderFallback
{
    private readonly IReadOnlyList<IChatProvider> _providers;
    private readonly ILogger<ProviderFallback> _logger;

    public ProviderFallback(IEnumerable<IChatProvider> providers, ILogger<ProviderFallback> logger)
    {
        _providers = providers.ToList();
        _logger = logger;
    }

    public bool AnyConfigured => _providers.Any(p => p.IsConfigured);

    /// <summary>
    /// Returns null when no provider answered. <paramref name="preferred"/> is tried first (used for the
    /// validation retry so it goes to whichever provider answered). <paramref name="onSwitch"/> is called
    /// when a configured provider failed and another is about to be asked.
    /// </summary>
    public async Task<FallbackOutcome?> CompleteAsync(
        ProviderRequest request, string? preferred, Func<Task>? onSwitch, CancellationToken ct)
    {
        var ordered = _providers
            .OrderBy(p => string.Equals(p.Name, preferred, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ToList();

        for (var i = 0; i < ordered.Count; i++)
        {
            var provider = ordered[i];
            ct.ThrowIfCancellationRequested();
            if (!provider.IsConfigured) continue;

            ProviderResult result;
            try
            {
                result = await provider.CompleteAsync(request, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Provider {Provider} threw ({ExceptionType})", provider.Name, ex.GetType().Name);
                result = ProviderResult.Fail("exception");
            }

            if (result.Success && !string.IsNullOrWhiteSpace(result.Content))
                return new FallbackOutcome(provider.Name, result.Content!);

            _logger.LogWarning("Provider {Provider} did not answer: {Reason}", provider.Name, result.Failure);

            if (ordered.Skip(i + 1).Any(p => p.IsConfigured) && onSwitch != null)
                await onSwitch();
        }
        return null;
    }
}
