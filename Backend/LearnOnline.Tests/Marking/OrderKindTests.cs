using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class OrderKindTests
{
    private const string Attrs = """{"blockId":"o1","prompt":"Order","code":false,"items":[{"id":"a","text":"Wake up"},{"id":"b","text":"Brush teeth"},{"id":"c","text":"Go to school"},{"id":"d","text":"Brush teeth"}]}""";

    private static JsonObject Block() => JsonNode.Parse($$"""{"type":"orderBlock","attrs":{{Attrs}}}""")!.AsObject();
    private static JsonElement Answer(string json) => JsonDocument.Parse(json).RootElement;

    [Fact]
    public void All_right_passes()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"order":["a","b","c","d"]}"""));
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(4);
        r.Message.Should().Be("Spot on! That's the right order.");
    }

    [Fact]
    public void Identical_lines_are_interchangeable()
    {
        BlockMarker.Mark(Block(), Answer("""{"order":["a","d","c","b"]}""")).Passed.Should().BeTrue();
    }

    [Fact]
    public void Partly_right_reports_per_position()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"order":["a","c","b","d"]}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(2);
        r.Message.Should().Be("2 of 4 are in the right place. Keep going!");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perItem":[true,false,false,true]}""");
    }

    [Fact]
    public void All_wrong_scores_zero()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"order":["b","c","d","a"]}"""));
        r.Score.Should().Be(0);
        r.Passed.Should().BeFalse();
    }

    [Fact]
    public void Unknown_or_repeated_ids_count_as_wrong()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"order":["a","b","c","b"]}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(3);
        BlockMarker.Mark(Block(), Answer("""{"order":["a","b","c","zzz"]}""")).Score.Should().Be(3);
    }

    [Theory]
    [InlineData("""{"order":["a","b","c"]}""")]
    [InlineData("""{"order":["a","b","c",4]}""")]
    [InlineData("""{"order":"abcd"}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Block(), Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Strip_shuffles_away_from_the_answer_and_is_stable()
    {
        var page = $$"""{"type":"doc","content":[{"type":"orderBlock","attrs":{{Attrs}}}]}""";
        var stripped = PageBlocks.StripAnswers(page)!;
        var ids = MarkingJson.Objects(JsonNode.Parse(stripped)!["content"]![0]!["attrs"]!["items"]).Select(o => MarkingJson.Str(o, "id")).ToList();

        ids.Should().BeEquivalentTo(new[] { "a", "b", "c", "d" });
        ids.Should().NotEqual(new[] { "a", "b", "c", "d" });
        PageBlocks.StripAnswers(page).Should().Be(stripped);
    }

    [Theory]
    [InlineData("s1")]
    [InlineData("s2")]
    [InlineData("s3")]
    [InlineData("s4")]
    [InlineData("s5")]
    public void Strip_never_hands_out_the_right_order(string blockId)
    {
        var attrs = JsonNode.Parse($$"""{"blockId":"{{blockId}}","items":[{"id":"a","text":"1"},{"id":"b","text":"2"}]}""")!.AsObject();
        BlockKind.All["orderBlock"].Strip(attrs);
        MarkingJson.Objects(attrs["items"]).Select(o => MarkingJson.Str(o, "id")).Should().Equal("b", "a");
    }
}
