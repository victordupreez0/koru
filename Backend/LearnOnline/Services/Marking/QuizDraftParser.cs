using System.Text.Json;

namespace LearnOnline.Services.Marking;

public sealed record QuizQuestion(string question, IReadOnlyList<string> options, int correctAnswer);

/// <summary>
/// Reads an AI reply into quiz questions, in the same shape as Assignments.QuizQuestionsJson.
/// A reply can't be trusted to be well formed, so anything that isn't a usable question is dropped.
/// </summary>
public static class QuizDraftParser
{
    private const int MaxOptions = 6;

    public static IReadOnlyList<QuizQuestion> Parse(string? reply, int max)
    {
        var json = ExtractJson(reply);
        if (json == null) return Array.Empty<QuizQuestion>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var list = doc.RootElement.ValueKind == JsonValueKind.Array
                ? doc.RootElement
                : doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out var q) ? q : default;
            if (list.ValueKind != JsonValueKind.Array) return Array.Empty<QuizQuestion>();

            return list.EnumerateArray().Select(ReadQuestion).OfType<QuizQuestion>().Take(max).ToList();
        }
        catch (JsonException)
        {
            return Array.Empty<QuizQuestion>();
        }
    }

    // Some models wrap their JSON in a ```json fence despite being asked not to.
    private static string? ExtractJson(string? reply)
    {
        if (string.IsNullOrWhiteSpace(reply)) return null;
        var start = reply.IndexOfAny(new[] { '{', '[' });
        var end = reply.LastIndexOfAny(new[] { '}', ']' });
        return start >= 0 && end > start ? reply[start..(end + 1)] : null;
    }

    private static QuizQuestion? ReadQuestion(JsonElement item)
    {
        if (item.ValueKind != JsonValueKind.Object) return null;
        if (!item.TryGetProperty("question", out var q) || q.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(q.GetString())) return null;
        if (!item.TryGetProperty("options", out var o) || o.ValueKind != JsonValueKind.Array) return null;
        if (!item.TryGetProperty("correctAnswer", out var c) || c.ValueKind != JsonValueKind.Number || !c.TryGetInt32(out var correct)) return null;

        var options = o.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!.Trim()).ToList();
        if (options.Count < 2 || options.Count > MaxOptions || options.Any(string.IsNullOrEmpty)) return null;
        if (correct < 0 || correct >= options.Count) return null;

        return new QuizQuestion(q.GetString()!.Trim(), options, correct);
    }
}
