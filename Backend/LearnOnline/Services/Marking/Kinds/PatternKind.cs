using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Complete the pattern: fill each blank in a sequence of shapes, numbers or emoji.</summary>
public sealed class PatternKind : BlockKind
{
    public override string Type => "patternBlock";

    /// <summary>The blank positions, ascending, that exist in the sequence.</summary>
    private static List<int> Blanks(JsonObject attrs, int count) =>
        Ints(attrs["blanks"]).Where(i => i < count).Distinct().Order().ToList();

    public override void Strip(JsonObject attrs)
    {
        var tokens = Strings(attrs["tokens"]);
        var blanks = Blanks(attrs, tokens.Count);
        var options = blanks.Select(i => tokens[i])
            .Concat(Strings(attrs["distractors"]))
            .Where(t => t != "")
            .Distinct()
            .ToList();

        attrs["tokens"] = new JsonArray(tokens.Select((t, i) => blanks.Contains(i) ? null : (JsonNode)JsonValue.Create(t)).ToArray());
        attrs["blanks"] = new JsonArray(blanks.Select(i => (JsonNode)JsonValue.Create(i)).ToArray());
        attrs["options"] = new JsonArray(Shuffle(options, Str(attrs, "blockId")).Select(t => (JsonNode)JsonValue.Create(t)).ToArray());
        attrs.Remove("distractors");
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var tokens = Strings(attrs["tokens"]);
        var blanks = Blanks(attrs, tokens.Count);
        var picks = Array(answer, "picks");
        if (picks.GetArrayLength() != blanks.Count) throw Bad("Please fill every gap.");

        var perBlank = blanks.Zip(picks.EnumerateArray(), (index, pick) =>
        {
            if (pick.ValueKind != JsonValueKind.String) throw Bad();
            return pick.GetString() == tokens[index];
        }).ToList();

        var score = perBlank.Count(ok => ok);
        var max = blanks.Count;
        var passed = max > 0 && score == max;

        return new MarkResult(passed, score, max, passed
            ? "You completed the pattern!"
            : $"{score} out of {max} are right. Look at the pattern again.", new { perBlank });
    }
}
