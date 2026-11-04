using System.Text.Json;
using System.Text.RegularExpressions;

namespace LearnOnline.Services.Assistant;

public sealed record AssistantReply(string Message, string? Question);

public sealed record ValidationOutcome(AssistantReply? Reply, IReadOnlyList<string> Errors)
{
    public bool IsValid => Reply != null;
}

/// <summary>Parses the model's json reply and enforces the schema and business rules.</summary>
public static class ReplyValidator
{
    public const int MaxMessageLength = 6000;
    public const int MaxQuestionLength = 240;

    public const string FallbackMessage =
        "I would rather ask than guess. Could you tell me a little more about what you need, for example which course or assignment this is about?";

    private static readonly Regex GuidPattern = new(
        "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", RegexOptions.Compiled);

    public static ValidationOutcome Validate(string? raw)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(raw))
            return new(null, new[] { "the reply was empty; it must be a json object" });

        var json = StripCodeFence(raw.Trim());
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(json);
        }
        catch (JsonException)
        {
            return new(null, new[] { "the reply was not valid json; reply with a single json object only" });
        }

        using (doc)
        {
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return new(null, new[] { "the json must be an object with \"message\" and \"question\" keys" });

            string? message = null;
            if (!root.TryGetProperty("message", out var msgEl))
                errors.Add("\"message\" is missing");
            else if (msgEl.ValueKind != JsonValueKind.String)
                errors.Add("\"message\" must be a string");
            else
                message = msgEl.GetString();

            string? question = null;
            if (root.TryGetProperty("question", out var qEl) && qEl.ValueKind != JsonValueKind.Null)
            {
                if (qEl.ValueKind != JsonValueKind.String)
                    errors.Add("\"question\" must be a string or null");
                else
                {
                    question = qEl.GetString() ?? string.Empty;
                    ValidateQuestion(question, errors);
                }
            }

            if (message != null)
            {
                var trimmed = message.Trim();
                if (trimmed.Length == 0) errors.Add("\"message\" must not be empty");
                if (trimmed.Length > MaxMessageLength) errors.Add($"\"message\" must be at most {MaxMessageLength} characters");
                if (GuidPattern.IsMatch(message)) errors.Add("\"message\" must not contain internal IDs (GUIDs)");
            }

            if (errors.Count > 0) return new(null, errors);

            var cleaned = WithoutRepeatedQuestion(message!.Trim(), question?.Trim());
            return new(new AssistantReply(cleaned, question?.Trim()), errors);
        }
    }

    private static void ValidateQuestion(string question, List<string> errors)
    {
        var q = question.Trim();
        if (q.Length == 0) { errors.Add("\"question\" must be null or a non-empty question"); return; }
        if (q.Length > MaxQuestionLength) errors.Add($"\"question\" must be at most {MaxQuestionLength} characters");
        if (!q.EndsWith('?')) errors.Add("\"question\" must end with a question mark");
        if (q.Contains('\n') || q.Contains('\r')) errors.Add("\"question\" must not contain a newline");
    }

    /// <summary>If the message ends with the question text, strip it from the end of the message.</summary>
    public static string WithoutRepeatedQuestion(string message, string? question)
    {
        if (string.IsNullOrWhiteSpace(question)) return message;

        var normQuestion = Normalize(question);
        if (normQuestion.Length == 0) return message;

        // Walk back over message suffixes (starting at line/sentence-ish positions or any position) until the
        // normalised suffix equals the normalised question.
        for (var start = message.Length - 1; start >= 0; start--)
        {
            var suffixNorm = Normalize(message.Substring(start));
            if (suffixNorm.Length > normQuestion.Length) break;
            if (suffixNorm == normQuestion && (start == 0 || !char.IsLetterOrDigit(message[start - 1])))
            {
                // Prefer the earliest start that still matches (include leading whitespace/markup around it).
                var s = start;
                while (s > 0 && (char.IsWhiteSpace(message[s - 1]) || message[s - 1] is '*' or '_' or '>' or '#' or '"')) s--;
                return message.Substring(0, s).TrimEnd();
            }
        }
        return message;
    }

    // Lower-cased letters and digits only, so case, whitespace and punctuation do not matter.
    private static string Normalize(string s) =>
        new(s.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

    private static string StripCodeFence(string s)
    {
        if (!s.StartsWith("```")) return s;
        var firstNewline = s.IndexOf('\n');
        if (firstNewline < 0) return s;
        var inner = s.Substring(firstNewline + 1);
        var end = inner.LastIndexOf("```", StringComparison.Ordinal);
        return (end >= 0 ? inner.Substring(0, end) : inner).Trim();
    }
}
