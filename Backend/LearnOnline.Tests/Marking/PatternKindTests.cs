using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class PatternKindTests
{
    private const string Attrs = """{"blockId":"p1","prompt":"What comes next?","tokens":["circle:red","square:blue","circle:red","square:blue","circle:red","square:blue"],"blanks":[5,4],"distractors":["triangle:green"]}""";

    private static JsonObject Block() => JsonNode.Parse($$"""{"type":"patternBlock","attrs":{{Attrs}}}""")!.AsObject();
    private static JsonElement Answer(string json) => JsonDocument.Parse(json).RootElement;

    [Fact]
    public void All_right_passes()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"picks":["circle:red","square:blue"]}"""));
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(2);
        r.MaxScore.Should().Be(2);
        r.Message.Should().Be("You completed the pattern!");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perBlank":[true,true]}""");
    }

    [Fact]
    public void Partly_right_fails_with_per_blank_details()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"picks":["circle:red","triangle:green"]}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(1);
        r.Message.Should().Be("1 out of 2 are right. Look at the pattern again.");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perBlank":[true,false]}""");
    }

    [Fact]
    public void All_wrong_or_unknown_tokens_score_zero()
    {
        var r = BlockMarker.Mark(Block(), Answer("""{"picks":["square:blue","hacker:gold"]}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
    }

    [Theory]
    [InlineData("""{"picks":["circle:red"]}""")]
    [InlineData("""{"picks":["circle:red","square:blue","x"]}""")]
    [InlineData("""{"picks":["circle:red",7]}""")]
    [InlineData("""{"picks":"circle:red"}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Block(), Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Strip_hides_the_blanks_and_is_stable()
    {
        var page = $$"""{"type":"doc","content":[{"type":"patternBlock","attrs":{{Attrs}}}]}""";
        var stripped = PageBlocks.StripAnswers(page)!;
        var attrs = JsonNode.Parse(stripped)!["content"]![0]!["attrs"]!.AsObject();
        var tokens = attrs["tokens"]!.AsArray();

        tokens[4].Should().BeNull();
        tokens[5].Should().BeNull();
        tokens[0]!.GetValue<string>().Should().Be("circle:red");
        attrs.ContainsKey("distractors").Should().BeFalse();
        attrs["blanks"]!.ToJsonString().Should().Be("[4,5]");
        MarkingJson.Strings(attrs["options"]).Should().BeEquivalentTo("circle:red", "square:blue", "triangle:green");
        PageBlocks.StripAnswers(page).Should().Be(stripped, "the same blockId always gives the same order");
    }
}
