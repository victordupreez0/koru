using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class BitsKindTests
{
    private static JsonObject Block(int bits, string target) =>
        JsonNode.Parse($$$"""{"type":"bitsBlock","attrs":{"blockId":"x1","prompt":"","bits":{{{bits}}},"target":{{{target}}}}}""")!.AsObject();

    private static MarkResult Mark(JsonObject block, string answer) =>
        BlockMarker.Mark(block, JsonDocument.Parse(answer).RootElement);

    [Fact]
    public void The_right_number_passes()
    {
        var r = Mark(Block(8, "37"), """{"bits":[0,0,1,0,0,1,0,1]}""");
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(1);
        r.MaxScore.Should().Be(1);
        r.Message.Should().Be("Yes! 00100101 is 37.");
    }

    [Fact]
    public void A_wrong_number_says_what_it_makes()
    {
        var r = Mark(Block(4, "5"), """{"bits":[0,1,1,0]}""");
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
        r.Message.Should().Be("That makes 6. You need 5.");
    }

    [Fact]
    public void All_off_is_zero()
    {
        Mark(Block(4, "0"), """{"bits":[0,0,0,0]}""").Passed.Should().BeTrue();
        Mark(Block(4, "15"), """{"bits":[false,false,false,false]}""").Message.Should().Be("That makes 0. You need 15.");
    }

    [Fact]
    public void True_and_false_work_as_well_as_one_and_zero()
    {
        Mark(Block(4, "15"), """{"bits":[true,true,1,1]}""").Passed.Should().BeTrue();
    }

    [Fact]
    public void Free_play_has_nothing_to_mark()
    {
        var act = () => Mark(Block(8, "null"), """{"bits":[0,0,0,0,0,0,0,1]}""");
        act.Should().Throw<MarkingException>().WithMessage("Nothing to check here: just explore.");
    }

    [Theory]
    [InlineData("""{"bits":[0,1,1]}""")]           // too few
    [InlineData("""{"bits":[0,1,1,0,1]}""")]       // too many
    [InlineData("""{"bits":[0,1,2,0]}""")]
    [InlineData("""{"bits":[0,1,"1",0]}""")]
    [InlineData("""{"bits":5}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => Mark(Block(4, "5"), answer);
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Strip_keeps_the_target_because_it_is_the_question()
    {
        var page = new JsonObject { ["type"] = "doc", ["content"] = new JsonArray(Block(8, "37")) }.ToJsonString();
        var attrs = JsonNode.Parse(PageBlocks.StripAnswers(page)!)!["content"]![0]!["attrs"]!;
        attrs["target"]!.GetValue<int>().Should().Be(37);
        attrs["bits"]!.GetValue<int>().Should().Be(8);
    }
}
