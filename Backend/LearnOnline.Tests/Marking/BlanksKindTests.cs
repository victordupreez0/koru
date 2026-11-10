using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class BlanksKindTests
{
    private const string Text = "The {{CPU}} is the brain. We say {{colour|color}}.";

    private static JsonObject Block(string attrs = "") =>
        JsonNode.Parse($$$"""{"type":"blanksBlock","attrs":{"blockId":"b1","prompt":"","text":"{{{Text}}}","code":false,"distractors":["RAM","GPU"]{{{attrs}}}}}""")!.AsObject();

    private static MarkResult Mark(string answer, string attrs = "") =>
        BlockMarker.Mark(Block(attrs), JsonDocument.Parse(answer).RootElement);

    [Fact]
    public void All_right_passes()
    {
        var r = Mark("""{"blanks":["CPU","colour"]}""");
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(2);
        r.MaxScore.Should().Be(2);
        r.Message.Should().Be("All correct!");
    }

    [Fact]
    public void Partly_right_reports_each_blank()
    {
        var r = Mark("""{"blanks":["CPU","red"]}""");
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(1);
        r.Message.Should().Be("1 of 2 blanks are right. Check the others.");
        JsonSerializer.Serialize(r.Details).Should().Be("""{"perBlank":[true,false]}""");
    }

    [Fact]
    public void All_wrong_scores_nothing()
    {
        var r = Mark("""{"blanks":["",""]}""");
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
    }

    [Fact]
    public void Alternatives_case_and_spaces_are_accepted()
    {
        Mark("""{"blanks":["  cpu ","COLOR"]}""").Passed.Should().BeTrue();
    }

    [Fact]
    public void Case_sensitive_blanks_need_the_exact_capitals()
    {
        Mark("""{"blanks":["cpu","colour"]}""", ""","caseSensitive":true""").Score.Should().Be(1);
        Mark("""{"blanks":["CPU","colour"]}""", ""","caseSensitive":true""").Passed.Should().BeTrue();
    }

    [Theory]
    [InlineData("""{"blanks":["CPU"]}""")]
    [InlineData("""{"blanks":["CPU","colour","extra"]}""")]
    [InlineData("""{"blanks":["CPU",3]}""")]
    [InlineData("""{"blanks":"CPU colour"}""")]
    [InlineData("""{}""")]
    public void Malformed_answers_are_rejected(string answer)
    {
        var act = () => Mark(answer);
        act.Should().Throw<MarkingException>();
    }

    private static JsonObject StrippedAttrs(bool bank)
    {
        var block = Block(bank ? ""","bank":true""" : "");
        var page = new JsonObject { ["type"] = "doc", ["content"] = new JsonArray(block) }.ToJsonString();
        return JsonNode.Parse(PageBlocks.StripAnswers(page)!)!["content"]![0]!["attrs"]!.AsObject();
    }

    [Fact]
    public void Strip_leaves_no_answers_in_the_page()
    {
        var attrs = StrippedAttrs(bank: false);
        attrs["text"]!.GetValue<string>().Should().Be("The {{}} is the brain. We say {{}}.");
        attrs.ToJsonString().Should().NotContain("CPU").And.NotContain("colour").And.NotContain("RAM");
        attrs.ContainsKey("options").Should().BeFalse();
    }

    [Fact]
    public void Strip_with_a_bank_mixes_answers_and_distractors_without_saying_which_is_which()
    {
        var attrs = StrippedAttrs(bank: true);
        attrs["text"]!.GetValue<string>().Should().Be("The {{}} is the brain. We say {{}}.");
        attrs.ContainsKey("distractors").Should().BeFalse();
        MarkingJson.Strings(attrs["options"]).Should().BeEquivalentTo("CPU", "colour", "RAM", "GPU");
        attrs.ToJsonString().Should().NotContain("color\"").And.NotContain("|");
        StrippedAttrs(bank: true).ToJsonString().Should().Be(attrs.ToJsonString()); // same order every load
    }
}
