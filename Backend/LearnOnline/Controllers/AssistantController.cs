using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using LearnOnline.Data;
using LearnOnline.Models;

namespace LearnOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssistantController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<AssistantController> _logger;
        private readonly AppDbContext _context;

        public AssistantController(IConfiguration configuration, HttpClient httpClient, ILogger<AssistantController> logger, AppDbContext context)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
            _context = context;
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
                // 1. Gather database context dynamically for the user
                string databaseContext = "";
                if (!string.IsNullOrWhiteSpace(request.UserId) && !string.IsNullOrWhiteSpace(request.Role))
                {
                    databaseContext = await GenerateSystemContextPromptAsync(request.UserId, request.Role);
                }

                // 2. Setup the educational system instruction + injected database context
                var systemContent = new StringBuilder();
                systemContent.AppendLine("You are a helpful, professional, and knowledgeable AI Teacher Assistant for the LearnOnline educational platform. ");
                systemContent.AppendLine("You are conversing with Rikus, a teacher/administrator. You assist with creating structured timetables, ");
                systemContent.AppendLine("writing detailed and encouraging student feedback, creating detailed module/lesson plans, ");
                systemContent.AppendLine("explaining academic analytics, and drafting class announcements. ");
                systemContent.AppendLine("Always respond in clear, professional, and engaging English. Use clean Markdown formatting with bolding, ");
                systemContent.AppendLine("bullet points, and structured tables where appropriate to present information beautifully.");
                
                if (!string.IsNullOrWhiteSpace(databaseContext))
                {
                    systemContent.AppendLine();
                    systemContent.AppendLine(databaseContext);
                }

                var messagesToSend = new List<ChatMessage>
                {
                    new ChatMessage
                    {
                        Role = "system",
                        Content = systemContent.ToString()
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
                    Content = new StringContent(JsonSerializer.Serialize(groqRequestBody), Encoding.UTF8, "application/json")
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

        private async Task<string> GenerateSystemContextPromptAsync(string userId, string role)
        {
            var contextText = new StringBuilder();
            contextText.AppendLine("--- REAL-TIME ACADEMIC DATABASE CONTEXT ---");
            contextText.AppendLine($"Current User ID: {userId}");
            contextText.AppendLine($"Current User Role: {role}");
            contextText.AppendLine();

            var normalizedRole = role.Trim().ToLowerInvariant();

            try
            {
                if (normalizedRole == "teacher" || normalizedRole == "admin")
                {
                    // 1. Fetch courses taught by the teacher
                    var courses = await _context.Courses
                        .Include(c => c.Subject)
                        .Where(c => c.TeacherId == userId)
                        .ToListAsync();

                    contextText.AppendLine("### COURSES YOU TEACH:");
                    if (courses.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var course in courses)
                        {
                            contextText.AppendLine($"- [Course ID: {course.Id}] {course.Subject?.Code}: {course.Subject?.Name} ({course.Term} {course.Year})");
                        }
                    }
                    contextText.AppendLine();

                    // 2. Fetch assignments for these courses
                    var courseIds = courses.Select(c => c.Id).ToList();
                    var assignments = await _context.Assignments
                        .Where(a => courseIds.Contains(a.CourseId))
                        .OrderBy(a => a.DueDate)
                        .ToListAsync();

                    contextText.AppendLine("### ASSIGNMENTS IN YOUR COURSES:");
                    if (assignments.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var asm in assignments)
                        {
                            var openStr = asm.OpenDate.HasValue ? asm.OpenDate.Value.ToString("yyyy-MM-dd HH:mm") : "N/A";
                            var dueStr = asm.DueDate.HasValue ? asm.DueDate.Value.ToString("yyyy-MM-dd HH:mm") : "N/A";
                            contextText.AppendLine($"- [Assignment ID: {asm.Id}] Course ID: {asm.CourseId}, Title: \"{asm.Title}\", Type: {asm.Type}, Open Date: {openStr}, Due Date: {dueStr}, Max Points: {asm.MaxPoints}, Closed: {asm.IsClosed}");
                        }
                    }
                    contextText.AppendLine();

                    // 3. Fetch submissions and grades count per assignment
                    var assignmentIds = assignments.Select(a => a.Id).ToList();
                    var submissions = await _context.Submissions
                        .Where(s => assignmentIds.Contains(s.AssignmentId))
                        .ToListAsync();

                    var submissionIds = submissions.Select(s => s.Id).ToList();
                    var grades = await _context.Grades
                        .Where(g => submissionIds.Contains(g.SubmissionId))
                        .ToListAsync();

                    contextText.AppendLine("### SUBMISSION AND GRADING STATS:");
                    if (assignments.Count > 0)
                    {
                        foreach (var asm in assignments)
                        {
                            var subs = submissions.Where(s => s.AssignmentId == asm.Id).ToList();
                            var totalSubs = subs.Count;
                            var gradedSubs = grades.Count(g => subs.Select(s => s.Id).Contains(g.SubmissionId));
                            contextText.AppendLine($"- Assignment: \"{asm.Title}\" ({asm.Id}) has {totalSubs} student submissions ({gradedSubs} are currently graded).");
                        }
                    }
                    else
                    {
                        contextText.AppendLine("None.");
                    }
                    contextText.AppendLine();

                    // 4. Fetch Attendance Sessions and records
                    var attendanceSessions = await _context.AttendanceSessions
                        .Include(s => s.ClassGroup)
                        .Where(s => s.LecturerId == userId)
                        .OrderByDescending(s => s.SessionDate)
                        .ToListAsync();

                    contextText.AppendLine("### ATTENDANCE SESSIONS CONDUCTED:");
                    if (attendanceSessions.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        var sessionIds = attendanceSessions.Select(s => s.Id).ToList();
                        var attendanceRecords = await _context.AttendanceRecords
                            .Include(r => r.Student)
                            .Where(r => sessionIds.Contains(r.AttendanceSessionId))
                            .ToListAsync();

                        foreach (var session in attendanceSessions)
                        {
                            var records = attendanceRecords.Where(r => r.AttendanceSessionId == session.Id).ToList();
                            var present = records.Count(r => r.Status == "Present" || r.Status == "Late" || r.Status == "Excused");
                            var actualPresent = records.Count(r => r.Status == "Present");
                            var late = records.Count(r => r.Status == "Late");
                            var absent = records.Count(r => r.Status == "Absent");
                            var total = records.Count;
                            var rate = total > 0 ? (double)(actualPresent + late) / total * 100 : 100;

                            contextText.AppendLine($"- [Session ID: {session.Id}] Date: {session.SessionDate:yyyy-MM-dd HH:mm}, Cohort: {session.ClassGroup?.Name}, Present: {actualPresent}, Late: {late}, Absent: {absent}, Rate: {rate:F1}%");
                            
                            var absentStudents = records.Where(r => r.Status == "Absent").Select(r => $"{r.Student?.FirstName} {r.Student?.LastName}").ToList();
                            if (absentStudents.Count > 0)
                            {
                                contextText.AppendLine($"  * Absent Students: {string.Join(", ", absentStudents)}");
                            }
                        }
                    }
                    contextText.AppendLine();

                    // 5. Fetch Class Groups / Cohorts
                    var cohorts = await _context.ClassGroups
                        .Include(g => g.Course)
                        .ThenInclude(c => c.Subject)
                        .Where(g => courseIds.Contains(g.CourseId))
                        .ToListAsync();

                    contextText.AppendLine("### COHORTS & CLASS GROUPS:");
                    if (cohorts.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var g in cohorts)
                        {
                            var enrolledCount = await _context.Enrollments.CountAsync(e => e.CourseId == g.CourseId);
                            contextText.AppendLine($"- [Cohort ID: {g.Id}] Name: {g.Name}, Course Code: {g.Course?.Subject?.Code}, Course Name: {g.Course?.Subject?.Name} ({enrolledCount} enrolled students)");
                        }
                    }
                }
                else // student
                {
                    // 1. Fetch courses student is enrolled in
                    var enrollments = await _context.Enrollments
                        .Include(e => e.Course)
                        .ThenInclude(c => c.Subject)
                        .Where(e => e.StudentId == userId)
                        .ToListAsync();

                    var courseIds = enrollments.Select(e => e.CourseId).ToList();

                    contextText.AppendLine("### COURSES YOU ARE ENROLLED IN:");
                    if (enrollments.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var e in enrollments)
                        {
                            contextText.AppendLine($"- [Course ID: {e.CourseId}] {e.Course?.Subject?.Code}: {e.Course?.Subject?.Name}");
                        }
                    }
                    contextText.AppendLine();

                    // 2. Fetch assignments for these courses
                    var assignments = await _context.Assignments
                        .Where(a => courseIds.Contains(a.CourseId))
                        .OrderBy(a => a.DueDate)
                        .ToListAsync();

                    contextText.AppendLine("### UPCOMING/ACTIVE ASSIGNMENTS:");
                    if (assignments.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var asm in assignments)
                        {
                            var openStr = asm.OpenDate.HasValue ? asm.OpenDate.Value.ToString("yyyy-MM-dd HH:mm") : "N/A";
                            var dueStr = asm.DueDate.HasValue ? asm.DueDate.Value.ToString("yyyy-MM-dd HH:mm") : "N/A";
                            contextText.AppendLine($"- [Assignment ID: {asm.Id}] Title: \"{asm.Title}\", Type: {asm.Type}, Open Date: {openStr}, Due Date: {dueStr}, Max Points: {asm.MaxPoints}, Closed: {asm.IsClosed}");
                        }
                    }
                    contextText.AppendLine();

                    // 3. Fetch student's grades and submissions
                    var submissions = await _context.Submissions
                        .Include(s => s.Assignment)
                        .Where(s => s.StudentId == userId)
                        .ToListAsync();

                    var studentSubmissionIds = submissions.Select(s => s.Id).ToList();
                    var grades = await _context.Grades
                        .Where(g => studentSubmissionIds.Contains(g.SubmissionId))
                        .ToListAsync();

                    contextText.AppendLine("### YOUR SUBMISSIONS & GRADES:");
                    if (submissions.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        foreach (var sub in submissions)
                        {
                            var grade = grades.FirstOrDefault(g => g.SubmissionId == sub.Id);
                            var gradeStr = grade != null && grade.PointsEarned.HasValue 
                                ? $"{grade.PointsEarned.Value}/{sub.Assignment?.MaxPoints ?? 100}" 
                                : "Not Graded Yet";
                            contextText.AppendLine($"- Assignment: \"{sub.Assignment?.Title}\" ({sub.AssignmentId}), Status: {sub.Status}, Score: {gradeStr}, Submitted At: {sub.SubmittedAt:yyyy-MM-dd HH:mm}");
                        }
                    }
                    contextText.AppendLine();

                    // 4. Fetch attendance records
                    var attendanceRecords = await _context.AttendanceRecords
                        .Include(r => r.Session)
                        .ThenInclude(s => s.ClassGroup)
                        .Where(r => r.StudentId == userId)
                        .ToListAsync();

                    contextText.AppendLine("### YOUR ATTENDANCE RECORD:");
                    if (attendanceRecords.Count == 0)
                    {
                        contextText.AppendLine("None.");
                    }
                    else
                    {
                        var presentCount = attendanceRecords.Count(r => r.Status == "Present" || r.Status == "Late" || r.Status == "Excused");
                        var totalCount = attendanceRecords.Count;
                        var rate = totalCount > 0 ? (double)presentCount / totalCount * 100 : 100;

                        contextText.AppendLine($"Overall Attendance Rate: {rate:F1}% ({presentCount}/{totalCount} sessions attended)");
                        foreach (var rec in attendanceRecords)
                        {
                            contextText.AppendLine($"- Date: {rec.Session?.SessionDate:yyyy-MM-dd}, Cohort: {rec.Session?.ClassGroup?.Name}, Status: {rec.Status}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assembling system database context for assistant");
                contextText.AppendLine($"Error loading data records: {ex.Message}");
            }

            contextText.AppendLine("-------------------------------------------");
            return contextText.ToString();
        }
    }
}
