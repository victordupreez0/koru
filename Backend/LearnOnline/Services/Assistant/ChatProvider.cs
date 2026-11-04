using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace LearnOnline.Services.Assistant;

public sealed record ProviderMessage(string Role, string Content);

public sealed record ProviderRequest(IReadOnlyList<ProviderMessage> Messages, bool Advanced);

/// <summary>Outcome of one provider call. Never carries secrets or raw error bodies.</summary>
public sealed record ProviderResult(bool Success, string? Content, string? Failure)
{
    public static ProviderResult Ok(string content) => new(true, content, null);
    public static ProviderResult Fail(string reason) => new(false, null, reason);
}

public interface IChatProvider
{
    /// <summary>"deepseek" or "groq".</summary>
    string Name { get; }
    bool IsConfigured { get; }

    /// <summary>
    /// Returns a failed result for no key, timeout, 429, 5xx, other 4xx and network errors.
    /// Throws OperationCanceledException only when <paramref name="ct"/> itself was cancelled.
    /// </summary>
    Task<ProviderResult> CompleteAsync(ProviderRequest request, CancellationToken ct);
}

public sealed record ProviderSettings(
    string Name,
    string Endpoint,
    string KeyConfig,
    string KeyEnv,
    string ModelConfig,
    string DefaultModel,
    string? AdvancedModelConfig,
    string? DefaultAdvancedModel,
    string MaxTokensField,
    bool ThinkingAdvanced)
{
    public static readonly ProviderSettings DeepSeek = new(
        "deepseek", "https://api.deepseek.com/chat/completions",
        "DeepSeek:ApiKey", "DEEPSEEK_API_KEY",
        "DeepSeek:Model", "deepseek-chat",
        "DeepSeek:AdvancedModel", "deepseek-reasoner",
        "max_tokens", ThinkingAdvanced: true);

    public static readonly ProviderSettings Groq = new(
        "groq", "https://api.groq.com/openai/v1/chat/completions",
        "Groq:ApiKey", "GROQ_API_KEY",
        "Groq:Model", "llama-3.3-70b-versatile",
        null, null,
        "max_completion_tokens", ThinkingAdvanced: false);
}

/// <summary>OpenAI-compatible chat client (DeepSeek and Groq).</summary>
public sealed class ChatProvider : IChatProvider
{
    private static readonly TimeSpan StandardTimeout = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan AdvancedTimeout = TimeSpan.FromSeconds(90);

    private readonly ProviderSettings _settings;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ChatProvider> _logger;

    public ChatProvider(ProviderSettings settings, IConfiguration configuration,
        IHttpClientFactory httpClientFactory, ILogger<ChatProvider> logger)
    {
        _settings = settings;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Name => _settings.Name;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ResolveKey());

    private string? ResolveKey()
    {
        var key = _configuration[_settings.KeyConfig];
        if (string.IsNullOrWhiteSpace(key)) key = Environment.GetEnvironmentVariable(_settings.KeyEnv);
        return string.IsNullOrWhiteSpace(key) ? null : key.Trim();
    }

    private string ResolveModel(bool advanced)
    {
        if (advanced && _settings.AdvancedModelConfig != null)
        {
            var m = _configuration[_settings.AdvancedModelConfig];
            return string.IsNullOrWhiteSpace(m) ? _settings.DefaultAdvancedModel! : m.Trim();
        }
        var model = _configuration[_settings.ModelConfig];
        return string.IsNullOrWhiteSpace(model) ? _settings.DefaultModel : model.Trim();
    }

    public async Task<ProviderResult> CompleteAsync(ProviderRequest request, CancellationToken ct)
    {
        var key = ResolveKey();
        if (key == null) return ProviderResult.Fail("no key configured");

        // Thinking model: no temperature, no json response_format (relies on prompt + validator).
        var thinking = request.Advanced && _settings.ThinkingAdvanced;
        var body = new Dictionary<string, object?>
        {
            ["model"] = ResolveModel(request.Advanced),
            ["messages"] = request.Messages.Select(m => new { role = m.Role, content = m.Content }).ToList(),
            [_settings.MaxTokensField] = request.Advanced ? 4096 : 2048,
        };
        if (!thinking)
        {
            body["temperature"] = 0.4;
            body["response_format"] = new { type = "json_object" };
        }

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(request.Advanced ? AdvancedTimeout : StandardTimeout);

        try
        {
            using var http = new HttpRequestMessage(HttpMethod.Post, _settings.Endpoint)
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };
            http.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);

            var client = _httpClientFactory.CreateClient();
            using var response = await client.SendAsync(http, timeoutCts.Token);
            if (!response.IsSuccessStatusCode)
            {
                var status = (int)response.StatusCode;
                _logger.LogWarning("{Provider} returned HTTP {Status}", _settings.Name, status);
                return ProviderResult.Fail($"HTTP {status}");
            }

            var text = await response.Content.ReadAsStringAsync(timeoutCts.Token);
            using var doc = JsonDocument.Parse(text);
            var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(content)) return ProviderResult.Fail("empty reply");
            return ProviderResult.Ok(content);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("{Provider} timed out", _settings.Name);
            return ProviderResult.Fail("timeout");
        }
        catch (Exception ex)
        {
            // Type only: messages from HttpClient can contain request details.
            _logger.LogWarning("{Provider} call failed ({ExceptionType})", _settings.Name, ex.GetType().Name);
            return ProviderResult.Fail("network or parse error");
        }
    }
}
