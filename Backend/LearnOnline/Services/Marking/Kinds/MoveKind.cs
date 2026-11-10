using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>The robot puzzle: a program of moves and repeats that must reach the target.</summary>
public sealed class MoveKind : BlockKind
{
    public override string Type => PageBlocks.Move;

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        if (!answer.TryGetProperty("program", out var program) || program.ValueKind != JsonValueKind.String) throw Bad();

        var grid = new MoveGrid(
            Int(attrs, "rows") ?? 0,
            Int(attrs, "cols") ?? 0,
            Cell(attrs["start"]),
            Cell(attrs["target"]),
            Cells(attrs["obstacles"]),
            Cells(attrs["stars"]),
            Int(attrs, "maxBlocks"),
            Str(attrs, "facing") switch { "up" => MoveInterpreter.Up, "down" => MoveInterpreter.Down, "left" => MoveInterpreter.Left, _ => MoveInterpreter.Right });

        var run = MoveInterpreter.Run(grid, program.GetString());
        var passed = run.Status == "reached";
        return new MarkResult(passed, passed ? 1 : 0, 1, run.Message, new
        {
            trace = run.Trace.Select(s => new[] { s.Row, s.Col, s.Line, s.Facing }),
            status = run.Status,
            line = run.Line,
            blocks = run.Blocks,
        });
    }

    private static HashSet<GridCell> Cells(JsonNode? node) => (node as JsonArray ?? new JsonArray()).Select(Cell).ToHashSet();

    private static GridCell Cell(JsonNode? node)
    {
        var values = (node as JsonArray ?? new JsonArray()).OfType<JsonValue>().Select(v => v.TryGetValue<int>(out var i) ? i : -1).ToList();
        return values.Count == 2 ? new GridCell(values[0], values[1]) : new GridCell(-1, -1);
    }
}
