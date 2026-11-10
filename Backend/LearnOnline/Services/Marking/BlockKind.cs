using System.Text.Json;
using System.Text.Json.Nodes;

namespace LearnOnline.Services.Marking;

/// <summary>
/// One kind of auto-marked block. Each kind knows how to mark an answer against the stored
/// block and how to hide its answer key before the page is sent to a browser.
/// Adding a kind is one new subclass: they are discovered automatically.
/// </summary>
public abstract class BlockKind
{
    /// <summary>The Tiptap node name, e.g. "quizBlock".</summary>
    public abstract string Type { get; }

    public abstract MarkResult Mark(JsonObject attrs, JsonElement answer);

    /// <summary>Removes or disguises the answer key. Called on every page a student receives.</summary>
    public virtual void Strip(JsonObject attrs) { }

    public static readonly IReadOnlyDictionary<string, BlockKind> All = typeof(BlockKind).Assembly.GetTypes()
        .Where(t => !t.IsAbstract && t.IsSubclassOf(typeof(BlockKind)))
        .Select(t => (BlockKind)Activator.CreateInstance(t)!)
        .ToDictionary(k => k.Type);
}

/// <summary>Small helpers for reading block settings and answers.</summary>
public static class MarkingJson
{
    public const string Invalid = "That answer isn't valid.";

    public static MarkingException Bad(string message = Invalid) => new(message);

    public static int? Int(JsonObject obj, string key) =>
        obj[key] is JsonValue v && v.TryGetValue<int>(out var i) ? i : null;

    public static bool Bool(JsonObject obj, string key) =>
        obj[key] is JsonValue v && v.TryGetValue<bool>(out var b) && b;

    public static string Str(JsonObject obj, string key) =>
        obj[key] is JsonValue v && v.TryGetValue<string>(out var s) ? s : "";

    public static IEnumerable<int> Ints(JsonNode? node) =>
        (node as JsonArray ?? new JsonArray()).OfType<JsonValue>().Select(v => v.TryGetValue<int>(out var i) ? i : -1).Where(i => i >= 0);

    public static List<string> Strings(JsonNode? node) =>
        (node as JsonArray ?? new JsonArray()).Select(v => v is JsonValue j && j.TryGetValue<string>(out var s) ? s : "").ToList();

    public static List<JsonObject> Objects(JsonNode? node) =>
        (node as JsonArray ?? new JsonArray()).OfType<JsonObject>().ToList();

    /// <summary>The answer's property as an array, or a 400 when it is missing.</summary>
    public static JsonElement Array(JsonElement answer, string key)
    {
        if (!answer.TryGetProperty(key, out var value) || value.ValueKind != JsonValueKind.Array) throw Bad();
        return value;
    }

    /// <summary>The answer's property as an object, or a 400 when it is missing.</summary>
    public static JsonElement Object(JsonElement answer, string key)
    {
        if (!answer.TryGetProperty(key, out var value) || value.ValueKind != JsonValueKind.Object) throw Bad();
        return value;
    }

    public static string Text(JsonElement value) =>
        value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : value.ValueKind == JsonValueKind.Number ? value.GetRawText() : "";

    /// <summary>Compares what a student typed with the expected text: surrounding spaces and case don't matter.</summary>
    public static bool SameText(string? given, string? expected, bool caseSensitive = false) =>
        string.Equals(Squash(given), Squash(expected), caseSensitive ? StringComparison.Ordinal : StringComparison.OrdinalIgnoreCase);

    private static string Squash(string? value) => string.Join(' ', (value ?? "").Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    /// <summary>
    /// Shuffles in a way that is the same every time for the same seed, so a student who
    /// reloads the page sees the same order. (string.GetHashCode changes between runs.)
    /// </summary>
    public static List<T> Shuffle<T>(IEnumerable<T> items, string seed)
    {
        var list = items.ToList();
        uint state = 2166136261;
        foreach (var c in seed) state = (state ^ c) * 16777619;
        if (state == 0) state = 1;
        for (var i = list.Count - 1; i > 0; i--)
        {
            state ^= state << 13;
            state ^= state >> 17;
            state ^= state << 5;
            var j = (int)(state % (uint)(i + 1));
            (list[i], list[j]) = (list[j], list[i]);
        }
        return list;
    }
}
