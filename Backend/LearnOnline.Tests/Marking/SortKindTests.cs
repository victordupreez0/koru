using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class SortKindTests
{
    private const string Attrs = """{"blockId":"s1","prompt":"Sort","groups":[{"id":"g1","label":"Fruit"},{"id":"g2","label":"Vegetables"}],"items":[{"id":"a","text":"Apple","group":"g1"},{"id":"b","text":"Banana","group":"g1"},{"id":"c","text":"Carrot","group":"g2"},{"id":"d","text":"Pea","group":"g2"}]}""";

    private static JsonObject Block() => JsonNode.Parse($$"""{"type":"sortBlock","attrs":{{Attrs}}}""")!.AsObject();
    private static JsonElement Answer(string json) => JsonDocument.Parse(json).RootElement;

    [Fact]
    public void All_right_passes()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"placements":{"a":"g1","b":"g1","c":"g2","d":"g2"}}"""));
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(4);
        r.MaxScore.Should().Be(4);
        r.Message.Should().Be("Everything is in the right group!");
    }

    [Fact]
    public void Partly_right_reports_per_item()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"placements":{"a":"g1","b":"g2","c":"g2"}}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(2);
        r.Message.Should().Be("2 of 4 are in the right group. Have another look.");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perItem":{"a":true,"b":false,"c":true,"d":false}}""");
    }

    [Fact]
    public void All_wrong_and_unknown_ids_score_zero()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"placements":{"a":"g2","b":"g2","c":"g1","d":"nope","zzz":"g1"}}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
        r.MaxScore.Should().Be(4);
    }

    [Theory]
    [InlineData("""{"placements":{"a":1}}""")]
    [InlineData("""{"placements":["g1"]}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Block(), Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Strip_removes_every_group_and_is_stable()
    {
        var page = $$"""{"type":"doc","content":[{"type":"sortBlock","attrs":{{Attrs}}}]}""";
        var stripped = PageBlocks.StripAnswers(page)!;
        var items = MarkingJson.Objects(JsonNode.Parse(stripped)!["content"]![0]!["attrs"]!["items"]);

        items.Should().HaveCount(4);
        items.Select(o => MarkingJson.Str(o, "id")).Should().BeEquivalentTo(new[] { "a", "b", "c", "d" });
        stripped.Should().NotContain("\"group\"");
        PageBlocks.StripAnswers(page).Should().Be(stripped);
    }
}
