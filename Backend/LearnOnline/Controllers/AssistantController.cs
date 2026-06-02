using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssistantController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<AssistantController> _logger;

        public AssistantController(IConfiguration configuration, HttpClient httpClient, ILogger<AssistantController> logger)
        {
            _configuration = configuration;
            _httpClient = httpClient;
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
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (request == null || request.Messages == null || request.Messages.Count == 0)
            {
                return BadRequest(new { message = "Invalid request or empty messages." });
            }

            // Resolve Groq API Key
            var apiKey = _configuration["Groq:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Groq API key is not configured in appsettings.json or environment variables.");
                return BadRequest(new { 
                    message = "Groq API Key is not configured. Please add it to your appsettings.Development.json ('Groq': { 'ApiKey': '...' }) or set the GROQ_API_KEY environment variable." 
                });
            }

            try
            {
                // Inject the educational system instruction at the beginning of the context
                var messagesToSend = new List<ChatMessage>
                {
                    new ChatMessage
                    {
                        Role = "system",
                        Content = "You are a helpful, professional, and knowledgeable AI Teacher Assistant for the LearnOnline educational platform. " +
                                  "You are conversing with Rikus, a teacher/administrator. You assist with creating structured timetables, " +
                                  "writing detailed and encouraging student feedback, creating detailed module/lesson plans, " +
                                  "explaining academic analytics, and drafting class announcements. " +
                                  "Always respond in clear, professional, and engaging English. Use clean Markdown formatting with bolding, " +
                                  "bullet points, and structured tables where appropriate to present information beautifully."
                    }
                };

                // Add user/assistant history (filter out any empty messages or pre-existing system messages to prevent prompts pollution)
                foreach (var msg in request.Messages)
                {
                    if (msg.Role != "system" && !string.IsNullOrWhiteSpace(msg.Content))
                    {
                        messagesToSend.Add(msg);
                    }
                }

                // Prepare request body for Groq
                var groqRequestBody = new
                {
                    model = "llama-3.3-70b-versatile",
                    messages = messagesToSend,
                    temperature = 0.7,
                    max_completion_tokens = 4096
                };

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
                {
                    Content = new StringContent(JsonSerializer.Serialize(groqRequestBody), System.Text.Encoding.UTF8, "application/json")
                };

                httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var response = await _httpClient.SendAsync(httpRequest);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Groq API error: {Error}", errorContent);
                    return StatusCode((int)response.StatusCode, new { message = "Error calling Groq API.", details = errorContent });
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                
                // Let's parse and return the raw choice or the full JSON response
                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;
                
                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var messageNode))
                    {
                        var content = messageNode.GetProperty("content").GetString();
                        return Ok(new { 
                            role = "assistant", 
                            content = content 
                        });
                    }
                }

                return StatusCode(500, new { message = "Unexpected response structure from Groq API.", raw = responseContent });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to proxy request to Groq API.");
                return StatusCode(500, new { message = "An internal server error occurred while contacting Groq.", error = ex.Message });
            }
        }
    }
}
