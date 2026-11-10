using System.Text.Json;
using System.Text.Json.Nodes;

namespace LearnOnline.Services.Marking;

/// <summary>
/// Reads interactive blocks out of a page's stored JSON. Answer keys live inside the page,
/// so everything that sends a page to a browser removes them first with <see cref="StripAnswers"/>.
/// </summary>
public static class PageBlocks
{
    public const string Squares = "squaresBlock";
    public const string Move = "moveBlock";
    public const string Quiz = "quizBlock";

    public static JsonObject? FindBlock(string? content, string blockId)
    {
        var root = Parse(content);
        return root == null ? null : InteractiveBlocks(root).FirstOrDefault(b => (string?)b["attrs"]?["blockId"] == blockId);
    }

    /// <summary>The page with every answer key removed. Pages that aren't JSON come back unchanged.</summary>
    public static string? StripAnswers(string? content)
    {
        var root = Parse(content);
        if (root == null) return content;

        foreach (var block in InteractiveBlocks(root).ToList())
            StripBlock(block);
        return root.ToJsonString();
    }

    /// <summary>Removes the answer key from one block, in place.</summary>
    public static void StripBlock(JsonObject block)
    {
        if (block["attrs"] is JsonObject attrs && block["type"] is JsonValue v && v.TryGetValue<string>(out var type) && BlockKind.All.TryGetValue(type, out var kind))
            kind.Strip(attrs);
    }

    private static JsonNode? Parse(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        try
        {
            return JsonNode.Parse(content);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static IEnumerable<JsonObject> InteractiveBlocks(JsonNode root) =>
        Descendants(root).Where(o => o["type"] is JsonValue v && v.TryGetValue<string>(out var t) && BlockKind.All.ContainsKey(t));

    private static IEnumerable<JsonObject> Descendants(JsonNode? node)
    {
        if (node is JsonObject obj)
        {
            yield return obj;
            foreach (var (_, child) in obj)
                foreach (var found in Descendants(child))
                    yield return found;
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array)
                foreach (var found in Descendants(child))
                    yield return found;
        }
    }
}
