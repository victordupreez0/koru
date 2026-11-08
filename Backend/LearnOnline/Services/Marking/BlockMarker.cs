using System.Text.Json;
using System.Text.Json.Nodes;

namespace LearnOnline.Services.Marking;

/// <summary>The submitted answer has the wrong shape. Sent back to the client as a 400.</summary>
public sealed class MarkingException : Exception
{
    public MarkingException(string message) : base(message) { }
}

public sealed record MarkResult(bool Passed, double Score, double MaxScore, string Message, object? Details = null);

/// <summary>
/// Marks an answer against the block stored on the server. Takes only the stored block and the
/// student's raw answer, so there is no way for a client to supply its own result or answer key.
/// </summary>
public static class BlockMarker
{
    public static MarkResult Mark(JsonObject block, JsonElement answer)
    {
        if (block["attrs"] is not JsonObject attrs) throw new MarkingException("This block has no settings.");
        if (answer.ValueKind != JsonValueKind.Object) throw new MarkingException("That answer isn't valid.");

        return (string?)block["type"] switch
        {
            PageBlocks.Squares => MarkSquares(attrs, answer),
            PageBlocks.Move => MarkMove(attrs, answer),
            PageBlocks.Quiz => MarkQuiz(attrs, answer),
            _ => throw new MarkingException("This block can't be marked."),
        };
    }

    private static MarkResult MarkSquares(JsonObject attrs, JsonElement answer)
    {
        var correct = Ints(attrs["correct"]).ToHashSet();
        if (!answer.TryGetProperty("cells", out var cells) || cells.ValueKind != JsonValueKind.Array)
            throw new MarkingException("That answer isn't valid.");

        var chosen = new HashSet<int>();
        foreach (var cell in cells.EnumerateArray())
        {
            if (cell.ValueKind != JsonValueKind.Number || !cell.TryGetInt32(out var index))
                throw new MarkingException("That answer isn't valid.");
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

    private static MarkResult MarkMove(JsonObject attrs, JsonElement answer)
    {
        if (!answer.TryGetProperty("program", out var program) || program.ValueKind != JsonValueKind.String)
            throw new MarkingException("That answer isn't valid.");

        var grid = new MoveGrid(
            Int(attrs, "rows") ?? 0,
            Int(attrs, "cols") ?? 0,
            Cell(attrs["start"]),
            Cell(attrs["target"]),
            (attrs["obstacles"] as JsonArray ?? new JsonArray()).Select(Cell).ToHashSet());

        var run = MoveInterpreter.Run(grid, program.GetString());
        var passed = run.Status == "reached";
        return new MarkResult(passed, passed ? 1 : 0, 1, run.Message, new
        {
            trace = run.Trace.Select(s => new[] { s.Row, s.Col, s.Line }),
            status = run.Status,
            line = run.Line,
        });
    }

    private static MarkResult MarkQuiz(JsonObject attrs, JsonElement answer)
    {
        var questions = (attrs["questions"] as JsonArray ?? new JsonArray()).OfType<JsonObject>().ToList();
        if (!answer.TryGetProperty("answers", out var answers) || answers.ValueKind != JsonValueKind.Array || answers.GetArrayLength() != questions.Count)
            throw new MarkingException("Please answer every question.");

        var perQuestion = questions.Zip(answers.EnumerateArray(), (q, a) =>
            a.ValueKind == JsonValueKind.Number && a.TryGetInt32(out var chosen) && chosen == Int(q, "correctAnswer")).ToList();

        var score = perQuestion.Count(ok => ok);
        var passPercent = Int(attrs, "passPercent") ?? 50;
        var passed = questions.Count > 0 && score * 100 >= passPercent * questions.Count;

        return new MarkResult(passed, score, questions.Count, passed
            ? $"Well done! {score} out of {questions.Count}."
            : $"{score} out of {questions.Count}. Have another go!", new { perQuestion });
    }

    private static int? Int(JsonObject obj, string key) =>
        obj[key] is JsonValue v && v.TryGetValue<int>(out var i) ? i : null;

    private static IEnumerable<int> Ints(JsonNode? node) =>
        (node as JsonArray ?? new JsonArray()).OfType<JsonValue>().Select(v => v.TryGetValue<int>(out var i) ? i : -1).Where(i => i >= 0);

    private static GridCell Cell(JsonNode? node)
    {
        var values = (node as JsonArray ?? new JsonArray()).OfType<JsonValue>().Select(v => v.TryGetValue<int>(out var i) ? i : -1).ToList();
        return values.Count == 2 ? new GridCell(values[0], values[1]) : new GridCell(-1, -1);
    }
}
