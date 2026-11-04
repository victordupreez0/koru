using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using LearnOnline.Services.Assistant;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssistantController : ControllerBase
    {
        private static readonly JsonSerializerOptions SseJson = new(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        };

        private readonly IAssistantComposer _composer;
        private readonly ILogger<AssistantController> _logger;

        public AssistantController(IAssistantComposer composer, ILogger<AssistantController> logger)
        {
            _composer = composer;
            _logger = logger;
        }

        public class ChatMessage
        {
            [JsonPropertyName("role")]
            public string Role { get; set; } = string.Empty;

            [JsonPropertyName("content")]
            public string Content { get; set; } = string.Empty;
        }

        public class ChatRequest
        {
            [JsonPropertyName("messages")]
            public List<ChatMessage> Messages { get; set; } = new();

            [JsonPropertyName("userId")]
            public string? UserId { get; set; }

            [JsonPropertyName("role")]
            public string? Role { get; set; }

            /// <summary>"standard" (default) or "advanced".</summary>
            [JsonPropertyName("mode")]
            public string? Mode { get; set; }
        }

        private static AssistantRequest ToAssistantRequest(ChatRequest r) => new(
            r.Messages.Where(m => m != null).Select(m => new AssistantTurn(m.Role ?? string.Empty, m.Content ?? string.Empty)).ToList(),
            r.UserId, r.Role, r.Mode);

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (request == null || request.Messages == null || request.Messages.Count == 0)
                return BadRequest(new { message = "Invalid request or empty messages." });

            try
            {
                var result = await _composer.ComposeAsync(ToAssistantRequest(request), null, HttpContext.RequestAborted);
                if (!result.Ok)
                    return StatusCode(503, new { message = result.Error });

                var content = string.IsNullOrWhiteSpace(result.Question)
                    ? result.Message
                    : result.Message + "\n\n" + result.Question;
                return Ok(new { role = "assistant", content });
            }
            catch (OperationCanceledException)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Assistant chat failed");
                return StatusCode(500, new { message = "Something went wrong while preparing a reply." });
            }
        }

        [HttpPost("chat/stream")]
        public async Task ChatStream([FromBody] ChatRequest request)
        {
            var ct = HttpContext.RequestAborted;

            if (request == null || request.Messages == null || request.Messages.Count == 0)
            {
                Response.StatusCode = StatusCodes.Status400BadRequest;
                Response.ContentType = "application/json";
                await Response.WriteAsync("{\"message\":\"Invalid request or empty messages.\"}", ct);
                return;
            }

            Response.StatusCode = StatusCodes.Status200OK;
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no";
            HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

            try
            {
                await WriteAsync(": ok\n\n", ct);

                var result = await _composer.ComposeAsync(
                    ToAssistantRequest(request),
                    (stage, text) => WriteAsync($"event: stage\ndata: {JsonSerializer.Serialize(new { stage, text }, SseJson)}\n\n", ct),
                    ct);

                object payload = result.Ok
                    ? new
                    {
                        ok = true,
                        message = result.Message,
                        question = result.Question,
                        context = new { summary = result.ContextSummary ?? string.Empty },
                        provider = result.Provider,
                        fallback = result.Fallback,
                    }
                    : new { ok = false, error = result.Error };

                await WriteAsync($"event: result\ndata: {JsonSerializer.Serialize(payload, SseJson)}\n\n", ct);
            }
            catch (OperationCanceledException)
            {
                // Client pressed Stop or went away: nothing to report.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Assistant stream failed");
                try
                {
                    var err = new { ok = false, error = "Something went wrong while preparing a reply. Please try again." };
                    await WriteAsync($"event: result\ndata: {JsonSerializer.Serialize(err, SseJson)}\n\n", CancellationToken.None);
                }
                catch { /* connection already gone */ }
            }
        }

        private async Task WriteAsync(string text, CancellationToken ct)
        {
            await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(text), ct);
            await Response.Body.FlushAsync(ct);
        }
    }
}
