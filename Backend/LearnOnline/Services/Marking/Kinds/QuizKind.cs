using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Multiple-choice questions.</summary>
public sealed class QuizKind : BlockKind
{
    public override string Type => PageBlocks.Quiz;

    public override void Strip(JsonObject attrs)
    {
        foreach (var question in Objects(attrs["questions"])) question.Remove("correctAnswer");
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var questions = Objects(attrs["questions"]);
        if (!answer.TryGetProperty("answers", out var answers) || answers.ValueKind != JsonValueKind.Array || answers.GetArrayLength() != questions.Count)
            throw Bad("Please answer every question.");

        var perQuestion = questions.Zip(answers.EnumerateArray(), (q, a) =>
            a.ValueKind == JsonValueKind.Number && a.TryGetInt32(out var chosen) && chosen == Int(q, "correctAnswer")).ToList();

        var score = perQuestion.Count(ok => ok);
        var passPercent = Int(attrs, "passPercent") ?? 50;
        var passed = questions.Count > 0 && score * 100 >= passPercent * questions.Count;

        return new MarkResult(passed, score, questions.Count, passed
            ? $"Well done! {score} out of {questions.Count}."
            : $"{score} out of {questions.Count}. Have another go!", new { perQuestion });
    }
}
