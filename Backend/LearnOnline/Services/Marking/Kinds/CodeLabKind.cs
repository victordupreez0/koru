using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>
/// Runnable code. The student's browser runs their code once per test and sends back what each
/// run printed; the server compares that with the expected output, which a student never
/// receives for hidden tests. The teacher's model solution is never sent either.
/// </summary>
public sealed class CodeLabKind : BlockKind
{
    public const string Name = "codeLab";
    public const int MaxOutputLength = 8000;

    public override string Type => Name;

    public override void Strip(JsonObject attrs)
    {
        attrs.Remove("solution");
        foreach (var test in Objects(attrs["tests"]))
            if (Bool(test, "hidden")) test.Remove("expected");
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var tests = Objects(attrs["tests"]);
        if (tests.Count == 0) throw Bad("This code isn't marked. Run it as often as you like.");

        var outputs = Array(answer, "outputs");
        if (outputs.GetArrayLength() != tests.Count) throw Bad("Run your code before checking it.");

        var perTest = tests.Zip(outputs.EnumerateArray(), (test, output) =>
            output.ValueKind == JsonValueKind.String && Normalise(output.GetString()) == Normalise(Str(test, "expected"))).ToList();

        var score = perTest.Count(ok => ok);
        var passed = score == tests.Count;
        var message = passed
            ? tests.Count == 1 ? "Correct! Your code does exactly what was asked." : $"All {tests.Count} tests passed. Great work!"
            : score == 0 ? "Not yet. Compare what your code printed with what was asked." : $"{score} of {tests.Count} tests passed. You're getting there!";

        return new MarkResult(passed, score, tests.Count, message, new { perTest });
    }

    /// <summary>Line endings and trailing spaces don't count as differences.</summary>
    public static string Normalise(string? text)
    {
        var value = text ?? "";
        if (value.Length > MaxOutputLength) value = value[..MaxOutputLength];
        var lines = value.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n').Select(l => l.TrimEnd());
        return string.Join('\n', lines).Trim('\n');
    }
}
