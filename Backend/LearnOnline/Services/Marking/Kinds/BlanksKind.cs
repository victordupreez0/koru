using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>
/// Fill in the blanks. The text marks each answer with double braces, and other accepted
/// answers are separated by a bar: "The {{CPU}} is the brain", "{{colour|color}}".
/// </summary>
public sealed partial class BlanksKind : BlockKind
{
    public override string Type => "blanksBlock";

    // Same pattern as splitBlanks in the editor (blanksText.js): a blank never spans lines.
    [GeneratedRegex(@"\{\{(.*?)\}\}")]
    private static partial Regex Marker();

    /// <summary>The accepted answers for each blank, in order.</summary>
    private static List<List<string>> Blanks(string text) =>
        Marker().Matches(text)
            .Select(m => m.Groups[1].Value.Split('|').Select(a => a.Trim()).Where(a => a.Length > 0).ToList())
            .ToList();

    public override void Strip(JsonObject attrs)
    {
        var text = Str(attrs, "text");
        if (Bool(attrs, "bank"))
        {
            var words = Blanks(text).Where(b => b.Count > 0).Select(b => b[0])
                .Concat(Strings(attrs["distractors"]).Select(d => d.Trim()).Where(d => d.Length > 0))
                .Distinct();
            attrs["options"] = new JsonArray(Shuffle(words, Str(attrs, "blockId")).Select(w => (JsonNode?)JsonValue.Create(w)).ToArray());
        }
        else
        {
            attrs.Remove("options");
        }
        attrs["text"] = Marker().Replace(text, "{{}}");
        attrs.Remove("distractors");
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var blanks = Blanks(Str(attrs, "text"));
        var given = Array(answer, "blanks");
        if (given.GetArrayLength() != blanks.Count) throw Bad();

        var caseSensitive = Bool(attrs, "caseSensitive");
        var perBlank = blanks.Zip(given.EnumerateArray(), (accepted, typed) =>
        {
            if (typed.ValueKind != JsonValueKind.String) throw Bad();
            var text = typed.GetString();
            return accepted.Any(a => SameText(text, a, caseSensitive));
        }).ToList();

        var score = perBlank.Count(ok => ok);
        var passed = blanks.Count > 0 && score == blanks.Count;
        return new MarkResult(passed, score, blanks.Count, passed
            ? "All correct!"
            : $"{score} of {blanks.Count} blanks are right. Check the others.", new { perBlank });
    }
}
