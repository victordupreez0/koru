using FluentAssertions;
using LearnOnline.Services.Marking;

namespace LearnOnline.Tests.Marking;

public class MoveInterpreterTests
{
    // S . .
    // . # .
    // . . T
    private static readonly MoveGrid Grid = new(3, 3, new GridCell(0, 0), new GridCell(2, 2), new HashSet<GridCell> { new(1, 1) });

    [Fact]
    public void Reaches_the_target()
    {
        var run = MoveInterpreter.Run(Grid, "move right 2\nmove down 2");
        run.Status.Should().Be("reached");
        run.Trace.Last().Should().Be(new MoveStep(2, 2, 2));
    }

    [Fact]
    public void Trace_has_one_step_per_square_and_starts_at_the_start()
    {
        var run = MoveInterpreter.Run(Grid, "move right 2");
        run.Trace.Select(s => (s.Row, s.Col)).Should().Equal((0, 0), (0, 1), (0, 2));
        run.Trace.Skip(1).Should().OnlyContain(s => s.Line == 1);
    }

    [Theory]
    [InlineData("MOVE  RIGHT   2\nDown 2")]
    [InlineData("right 2\ndown 2")]
    [InlineData("  move right 2  \r\n\r\n# now go down\n// nearly there\nmove down 2")]
    [InlineData("right\nright\ndown\ndown")]
    public void Accepts_friendly_variations(string program)
    {
        MoveInterpreter.Run(Grid, program).Status.Should().Be("reached");
    }

    [Fact]
    public void Stops_at_an_obstacle_on_the_right_line()
    {
        var run = MoveInterpreter.Run(Grid, "move right 1\nmove down 2");
        run.Status.Should().Be("obstacle");
        run.Line.Should().Be(2);
        run.Trace.Last().Should().Be(new MoveStep(0, 1, 1));
    }

    [Theory]
    [InlineData("move up")]
    [InlineData("move left")]
    [InlineData("move right 3")]
    [InlineData("move down 3")]
    public void Stops_at_the_edge(string program)
    {
        MoveInterpreter.Run(Grid, program).Status.Should().Be("wall");
    }

    [Fact]
    public void Going_past_the_target_does_not_count()
    {
        var open = new MoveGrid(1, 3, new GridCell(0, 0), new GridCell(0, 1), new HashSet<GridCell>());
        MoveInterpreter.Run(open, "move right 2").Status.Should().Be("stopped");
    }

    [Theory]
    [InlineData("jump 3", 1)]
    [InlineData("move right 2\nmove sideways", 2)]
    [InlineData("move right -1", 1)]
    [InlineData("move right 1000", 1)]
    [InlineData("move right two", 1)]
    public void Reports_typos_with_the_line_number_before_moving(string program, int line)
    {
        var run = MoveInterpreter.Run(Grid, program);
        run.Status.Should().Be("syntax");
        run.Line.Should().Be(line);
        run.Trace.Should().ContainSingle();
    }

    [Theory]
    [InlineData("System.IO.File.Delete(\"x\")")]
    [InlineData("eval('alert(1)')")]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("while(true){}")]
    [InlineData("move right 1; rm -rf /")]
    public void Code_is_never_treated_as_anything_but_a_typo(string program)
    {
        MoveInterpreter.Run(Grid, program).Status.Should().Be("syntax");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   \n  ")]
    [InlineData(null)]
    [InlineData("# only a comment")]
    public void Empty_programs_are_handled(string? program)
    {
        MoveInterpreter.Run(Grid, program).Status.Should().Be("empty");
    }

    [Fact]
    public void Too_many_lines_are_refused()
    {
        var program = string.Join("\n", Enumerable.Repeat("right", MoveInterpreter.MaxLines + 1));
        MoveInterpreter.Run(Grid, program).Status.Should().Be("too-long");
    }

    [Fact]
    public void Huge_programs_are_refused()
    {
        MoveInterpreter.Run(Grid, new string('x', MoveInterpreter.MaxProgramLength + 1)).Status.Should().Be("too-long");
    }

    [Fact]
    public void Endless_back_and_forth_is_capped()
    {
        var big = new MoveGrid(1, 200, new GridCell(0, 0), new GridCell(0, 199), new HashSet<GridCell>());
        var program = string.Join("\n", Enumerable.Repeat("right 99\nleft 99", 50));
        var run = MoveInterpreter.Run(big, program);
        run.Status.Should().Be("too-long");
        run.Trace.Count.Should().BeLessThanOrEqualTo(MoveInterpreter.MaxSteps + 1);
    }
}
