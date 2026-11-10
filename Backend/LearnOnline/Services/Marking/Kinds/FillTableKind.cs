using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Fill in the missing cells of a table: trace tables, truth tables.</summary>
public sealed class FillTableKind : BlockKind
{
    public override string Type => "fillTableBlock";

    /// <summary>The answer cells that really are in the table, without repeats.</summary>
    private static List<(int Row, int Col)> AnswerCells(JsonObject attrs)
    {
        var rows = attrs["rows"] as JsonArray ?? new JsonArray();
        return (attrs["answers"] as JsonArray ?? new JsonArray())
            .Select(a => Ints(a).ToList())
            .Where(rc => rc.Count == 2 && rc[0] < rows.Count && rows[rc[0]] is JsonArray row && rc[1] < row.Count)
            .Select(rc => (rc[0], rc[1]))
            .Distinct()
            .ToList();
    }

    private static string CellText(JsonNode? cell) =>
        cell is JsonValue v ? (v.TryGetValue<string>(out var s) ? s : v.ToJsonString()) : "";

    public override void Strip(JsonObject attrs)
    {
        foreach (var (r, c) in AnswerCells(attrs))
            ((JsonArray)attrs["rows"]![r]!)[c] = "";
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var cells = Object(answer, "cells");
        foreach (var cell in cells.EnumerateObject())
            if (cell.Value.ValueKind != JsonValueKind.String) throw Bad();

        var rows = attrs["rows"] as JsonArray ?? new JsonArray();
        var caseSensitive = Bool(attrs, "caseSensitive");
        var perCell = new Dictionary<string, bool>();
        foreach (var (r, c) in AnswerCells(attrs))
        {
            var key = $"{r},{c}";
            var typed = cells.TryGetProperty(key, out var value) ? value.GetString() : "";
            perCell[key] = SameText(typed, CellText(((JsonArray)rows[r]!)[c]), caseSensitive);
        }

        var score = perCell.Values.Count(ok => ok);
        var max = perCell.Count;
        var passed = max > 0 && score == max;
        return new MarkResult(passed, score, max, passed
            ? "Every cell is right!"
            : $"{score} of {max} cells are right.", new { perCell });
    }
}
