using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>
/// Binary switches: turn bits on and off to make a number. The target is part of the question,
/// so there is nothing to hide. With no target it is free play and nothing is marked.
/// </summary>
public sealed class BitsKind : BlockKind
{
    public override string Type => "bitsBlock";

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var target = Int(attrs, "target") ?? throw Bad("Nothing to check here: just explore.");
        var count = Int(attrs, "bits") == 4 ? 4 : 8;

        var bits = Array(answer, "bits");
        if (bits.GetArrayLength() != count) throw Bad();
        var digits = bits.EnumerateArray().Select(b => b.ValueKind switch
        {
            JsonValueKind.True => 1,
            JsonValueKind.False => 0,
            JsonValueKind.Number when b.TryGetInt32(out var n) && n is 0 or 1 => n,
            _ => throw Bad(),
        }).ToList();

        var value = digits.Aggregate(0, (sum, d) => sum * 2 + d);
        var binary = string.Concat(digits);
        var passed = value == target;
        return new MarkResult(passed, passed ? 1 : 0, 1, passed
            ? $"Yes! {binary} is {target}."
            : $"That makes {value}. You need {target}.", new { value });
    }
}
