using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class FillTableKindTests
{
    // A truth table for AND: the last column is for students to fill in.
    private static JsonObject Block(string attrs = "") =>
        JsonNode.Parse($$$"""
        {"type":"fillTableBlock","attrs":{"blockId":"t1","prompt":"","headers":["A","B","A AND B"],
         "rows":[["0","0","False"],["0","1","False"],["1","0","False"],["1","1","True"]],
         "answers":[[0,2],[1,2],[2,2],[3,2]]{{{attrs}}}}}
        """)!.AsObject();

    private static MarkResult Mark(string answer, string attrs = "") =>
        BlockMarker.Mark(Block(attrs), JsonDocument.Parse(answer).RootElement);

    [Fact]
    public void All_right_passes()
    {
        var r = Mark("""{"cells":{"0,2":"false","1,2":"False","2,2":" false ","3,2":"TRUE"}}""");
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(4);
        r.MaxScore.Should().Be(4);
        r.Message.Should().Be("Every cell is right!");
    }

    [Fact]
    public void Partly_right_reports_each_cell()
    {
        var r = Mark("""{"cells":{"0,2":"False","1,2":"True","2,2":"False"}}""");
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(2);
        r.Message.Should().Be("2 of 4 cells are right.");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perCell":{"0,2":true,"1,2":false,"2,2":true,"3,2":false}}""");
    }

    [Fact]
    public void All_wrong_scores_nothing()
    {
        var r = Mark("""{"cells":{"0,2":"True","1,2":"True","2,2":"True","3,2":"False"}}""");
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
    }

    [Fact]
    public void Case_sensitive_tables_need_the_exact_capitals()
    {
        Mark("""{"cells":{"0,2":"false","1,2":"False","2,2":"False","3,2":"True"}}""", ""","caseSensitive":true""").Score.Should().Be(3);
    }

    [Fact]
    public void Fixed_cells_cannot_be_overwritten_by_the_answer()
    {
        var r = Mark("""{"cells":{"0,0":"x","0,2":"False","1,2":"False","2,2":"False","3,2":"True"}}""");
        r.Passed.Should().BeTrue();
        r.MaxScore.Should().Be(4);
    }

    [Theory]
    [InlineData("""{"cells":{"0,2":false}}""")]
    [InlineData("""{"cells":["False"]}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => Mark(answer);
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Strip_leaves_no_answers_in_the_page()
    {
        var page = new JsonObject { ["type"] = "doc", ["content"] = new JsonArray(Block()) }.ToJsonString();
        var attrs = JsonNode.Parse(PageBlocks.StripAnswers(page)!)!["content"]![0]!["attrs"]!;
        attrs["rows"]!.ToJsonString().Should().Be("""[["0","0",""],["0","1",""],["1","0",""],["1","1",""]]""");
        attrs.ToJsonString().Should().NotContain("True").And.NotContain("False");
        attrs["answers"]!.AsArray().Count.Should().Be(4); // positions only, so the table knows where the inputs go
    }
}
