using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class BlockMarkerTests
{
    private static JsonObject Block(string type, string attrs) =>
        JsonNode.Parse($$"""{"type":"{{type}}","attrs":{{attrs}}}""")!.AsObject();

    private static JsonElement Answer(string json) => JsonDocument.Parse(json).RootElement;

    private static readonly JsonObject Squares = Block(PageBlocks.Squares, """{"blockId":"b","rows":2,"cols":2,"correct":[0,3],"exactly":null}""");

    [Fact]
    public void Squares_all_correct_passes()
    {
        var r = BlockMarker.Mark(Squares, Answer("""{"cells":[3,0]}"""));
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(2);
        r.MaxScore.Should().Be(2);
    }

    [Theory]
    [InlineData("""{"cells":[0]}""", 1)]           // one missing
    [InlineData("""{"cells":[0,3,1]}""", 1)]       // one extra
    [InlineData("""{"cells":[1,2]}""", 0)]         // all wrong
    [InlineData("""{"cells":[]}""", 0)]            // nothing chosen
    public void Squares_wrong_answers_fail(string answer, double score)
    {
        var r = BlockMarker.Mark(Squares, Answer(answer));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(score);
    }

    [Fact]
    public void Squares_exactly_n_accepts_any_n_of_the_correct_ones()
    {
        var block = Block(PageBlocks.Squares, """{"rows":3,"cols":3,"correct":[0,1,2,3],"exactly":2}""");
        BlockMarker.Mark(block, Answer("""{"cells":[1,3]}""")).Passed.Should().BeTrue();
        BlockMarker.Mark(block, Answer("""{"cells":[1]}""")).Passed.Should().BeFalse();
        BlockMarker.Mark(block, Answer("""{"cells":[1,3,2]}""")).Passed.Should().BeFalse();
    }

    [Fact]
    public void Tampered_pass_flags_in_the_answer_are_ignored()
    {
        var r = BlockMarker.Mark(Squares, Answer("""{"cells":[1],"passed":true,"score":999,"maxScore":1}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(0);
    }

    [Fact]
    public void Tampered_duplicates_cannot_inflate_the_score()
    {
        var r = BlockMarker.Mark(Squares, Answer("""{"cells":[0,0,0,0]}"""));
        r.Passed.Should().BeFalse();
        r.Score.Should().Be(1);
    }

    [Fact]
    public void Tampered_cells_outside_the_grid_count_as_wrong()
    {
        var r = BlockMarker.Mark(Squares, Answer("""{"cells":[0,3,99]}"""));
        r.Passed.Should().BeFalse();
    }

    [Theory]
    [InlineData("""{"cells":"everything"}""")]
    [InlineData("""{"cells":[0,"x"]}""")]
    [InlineData("""{"cells":[1.5]}""")]
    [InlineData("""{}""")]
    [InlineData("""[0,3]""")]
    public void Malformed_squares_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Squares, Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    private static readonly JsonObject Move = Block(PageBlocks.Move, """{"rows":3,"cols":3,"start":[0,0],"target":[2,2],"obstacles":[[1,1]]}""");

    [Fact]
    public void Move_reaching_the_target_passes_and_returns_the_path()
    {
        var r = BlockMarker.Mark(Move, Answer("""{"program":"move right 2\nmove down 2"}"""));
        r.Passed.Should().BeTrue();
        JsonSerializer.Serialize(r.Details).Should().Contain("\"status\":\"reached\"");
    }

    [Fact]
    public void Move_stopping_short_fails()
    {
        BlockMarker.Mark(Move, Answer("""{"program":"move right 2"}""")).Passed.Should().BeFalse();
    }

    [Theory]
    [InlineData("""{"program":123}""")]
    [InlineData("""{"passed":true}""")]
    public void Malformed_move_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Move, Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    private static readonly JsonObject Quiz = Block(PageBlocks.Quiz, """
        {"passPercent":50,"questions":[
          {"question":"a","options":["x","y"],"correctAnswer":1},
          {"question":"b","options":["x","y"],"correctAnswer":0}]}
        """);

    [Fact]
    public void Quiz_all_correct_passes()
    {
        var r = BlockMarker.Mark(Quiz, Answer("""{"answers":[1,0]}"""));
        r.Passed.Should().BeTrue();
        r.Score.Should().Be(2);
    }

    [Fact]
    public void Quiz_pass_mark_applies()
    {
        BlockMarker.Mark(Quiz, Answer("""{"answers":[1,1]}""")).Passed.Should().BeTrue();
        BlockMarker.Mark(Quiz, Answer("""{"answers":[0,1]}""")).Passed.Should().BeFalse();
    }

    [Fact]
    public void Quiz_feedback_does_not_reveal_the_answers()
    {
        var r = BlockMarker.Mark(Quiz, Answer("""{"answers":[0,1]}"""));
        JsonSerializer.Serialize(r).Should().NotContain("correctAnswer");
    }

    [Theory]
    [InlineData("""{"answers":[1]}""")]
    [InlineData("""{"answers":"all"}""")]
    [InlineData("""{"answers":[1,0,1]}""")]
    public void Malformed_quiz_answers_are_rejected(string answer)
    {
        var act = () => BlockMarker.Mark(Quiz, Answer(answer));
        act.Should().Throw<MarkingException>();
    }

    [Fact]
    public void Tampered_non_numbers_in_a_quiz_are_just_wrong()
    {
        var r = BlockMarker.Mark(Quiz, Answer("""{"answers":["1",null]}"""));
        r.Score.Should().Be(0);
    }

    [Fact]
    public void Unknown_block_types_cannot_be_marked()
    {
        var act = () => BlockMarker.Mark(Block("paragraph", "{}"), Answer("{}"));
        act.Should().Throw<MarkingException>();
    }
}
