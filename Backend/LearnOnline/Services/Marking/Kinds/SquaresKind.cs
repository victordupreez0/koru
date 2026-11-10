using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Pick the right squares on a grid.</summary>
public sealed class SquaresKind : BlockKind
{
    public override string Type => PageBlocks.Squares;

    public override void Strip(JsonObject attrs) => attrs.Remove("correct");

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var correct = Ints(attrs["correct"]).ToHashSet();
        var chosen = new HashSet<int>();
        foreach (var cell in Array(answer, "cells").EnumerateArray())
        {
            if (cell.ValueKind != JsonValueKind.Number || !cell.TryGetInt32(out var index)) throw Bad();
            chosen.Add(index);
        }

        // With "select exactly N" the student picks N of the correct squares; otherwise all of them.
        var needed = Math.Min(Int(attrs, "exactly") ?? correct.Count, correct.Count);
        var hits = chosen.Count(correct.Contains);
        var wrong = chosen.Count - hits;
        var score = Math.Max(0, Math.Min(hits, needed) - wrong);
        var passed = needed > 0 && wrong == 0 && hits == needed;

        return new MarkResult(passed, score, needed, passed
            ? "Perfect! You found them all."
            : $"{score} out of {needed}. Have another go!");
    }
}
