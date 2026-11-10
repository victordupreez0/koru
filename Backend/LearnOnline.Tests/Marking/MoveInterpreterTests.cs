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
        run.Trace.Last().Should().Be(new MoveStep(2, 2, 2, MoveInterpreter.Down));
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

    // ----- repeats, turning, stars and the command limit -----

    private static readonly MoveGrid Open = new(4, 4, new GridCell(3, 0), new GridCell(0, 3), new HashSet<GridCell>());

    [Fact]
    public void Repeat_runs_its_body_the_given_number_of_times()
    {
        var run = MoveInterpreter.Run(Open, "repeat 3\n  move right 1\n  move up 1\nend");
        run.Status.Should().Be("reached");
        run.Blocks.Should().Be(3);
        run.Trace.Count.Should().Be(7);
    }

    [Fact]
    public void Repeats_can_be_nested()
    {
        var grid = new MoveGrid(1, 7, new GridCell(0, 0), new GridCell(0, 6), new HashSet<GridCell>());
        MoveInterpreter.Run(grid, "repeat 2 times:\nrepeat 3\nright\nend\nend").Status.Should().Be("reached");
    }

    [Theory]
    [InlineData("end", 1)]                              // nothing to close
    [InlineData("repeat 2\nmove up 1", 1)]              // never closed
    [InlineData("repeat 2\nrepeat 2\nrepeat 2\nrepeat 2\nup\nend\nend\nend\nend", 4)] // too deep
    public void Broken_repeats_are_syntax_errors_on_the_right_line(string program, int line)
    {
        var run = MoveInterpreter.Run(Open, program);
        run.Status.Should().Be("syntax");
        run.Line.Should().Be(line);
    }

    [Fact]
    public void A_repeat_cannot_be_used_to_run_forever()
    {
        var big = new MoveGrid(1, 600, new GridCell(0, 0), new GridCell(0, 599), new HashSet<GridCell>());
        MoveInterpreter.Run(big, "repeat 99\nrepeat 99\nright\nend\nend").Status.Should().Be("too-long");
    }

    [Fact]
    public void Forward_and_turn_follow_the_way_the_player_is_facing()
    {
        // Starts bottom-left facing up; the target is top-right.
        var grid = new MoveGrid(4, 4, new GridCell(3, 0), new GridCell(0, 3), new HashSet<GridCell>(), Facing: MoveInterpreter.Up);
        var run = MoveInterpreter.Run(grid, "forward 3\nturn right\nfwd 3");
        run.Status.Should().Be("reached");
        run.Trace.Last().Should().Be(new MoveStep(0, 3, 3, MoveInterpreter.Right));
    }

    [Theory]
    [InlineData("TL", MoveInterpreter.Left)]
    [InlineData("TR", MoveInterpreter.Right)]
    [InlineData("turn around", MoveInterpreter.Down)]
    public void Turning_changes_direction_without_moving(string command, int facing)
    {
        var grid = new MoveGrid(3, 3, new GridCell(1, 1), new GridCell(0, 0), new HashSet<GridCell>(), Facing: MoveInterpreter.Up);
        var run = MoveInterpreter.Run(grid, command);
        run.Trace.Last().Should().Be(new MoveStep(1, 1, 1, facing));
    }

    [Fact]
    public void Every_star_must_be_collected()
    {
        var grid = new MoveGrid(2, 3, new GridCell(0, 0), new GridCell(0, 2), new HashSet<GridCell>(), new HashSet<GridCell> { new(1, 1) });
        MoveInterpreter.Run(grid, "right 2").Status.Should().Be("stars");
        MoveInterpreter.Run(grid, "down\nright\nup\nright").Status.Should().Be("reached");
    }

    [Fact]
    public void A_solution_over_the_command_limit_is_not_accepted()
    {
        var grid = new MoveGrid(1, 5, new GridCell(0, 0), new GridCell(0, 4), new HashSet<GridCell>(), MaxBlocks: 2);
        var slow = MoveInterpreter.Run(grid, "right\nright\nright\nright");
        slow.Status.Should().Be("too-many");
        slow.Blocks.Should().Be(4);
        MoveInterpreter.Run(grid, "repeat 4\nright\nend").Status.Should().Be("reached");
    }
}
