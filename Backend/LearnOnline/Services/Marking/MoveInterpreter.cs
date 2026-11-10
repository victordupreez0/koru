using System.Text.RegularExpressions;

namespace LearnOnline.Services.Marking;

public sealed record GridCell(int Row, int Col);

/// <param name="Stars">Squares the player must visit before the target counts.</param>
/// <param name="MaxBlocks">The most commands a solution may use; null means no limit.</param>
/// <param name="Facing">The way the player points at the start (used by "forward" and "turn").</param>
public sealed record MoveGrid(
    int Rows,
    int Cols,
    GridCell Start,
    GridCell Target,
    IReadOnlySet<GridCell> Obstacles,
    IReadOnlySet<GridCell>? Stars = null,
    int? MaxBlocks = null,
    int Facing = MoveInterpreter.Right);

/// <param name="Facing">0 up, 1 right, 2 down, 3 left: the way the player points after this step.</param>
public sealed record MoveStep(int Row, int Col, int Line, int Facing = MoveInterpreter.Right);

/// <param name="Status">reached, stopped, stars, too-many, wall, obstacle, syntax, empty or too-long</param>
/// <param name="Blocks">How many commands the program used (a repeat counts as one).</param>
public sealed record MoveRun(IReadOnlyList<MoveStep> Trace, string Status, string Message, int? Line, int Blocks = 0);

/// <summary>
/// Runs a student's program for the robot puzzle. It isn't a general programming language:
/// each line is matched against a fixed pattern ("move right 3", "forward 2", "turn left",
/// "repeat 4", "end") and turned into moves on a grid, so nothing a student types can ever be
/// executed. The caps below stop anyone sending an endless program.
/// </summary>
public static class MoveInterpreter
{
    public const int MaxProgramLength = 4000;
    public const int MaxLines = 100;
    public const int MaxSteps = 500;
    public const int MaxDepth = 3;
    public const int Up = 0, Right = 1, Down = 2, Left = 3;

    private static readonly RegexOptions Options = RegexOptions.IgnoreCase | RegexOptions.CultureInvariant;
    private static readonly TimeSpan Timeout = TimeSpan.FromMilliseconds(100);

    private static readonly Regex Command = new(@"^(?:move\s+)?(up|down|left|right)(?:\s+(\d{1,3}))?$", Options, Timeout);
    private static readonly Regex Forward = new(@"^(?:forward|fwd)(?:\s+(\d{1,3}))?$", Options, Timeout);
    private static readonly Regex Turn = new(@"^(?:turn\s+(left|right|around)|(tl|tr))$", Options, Timeout);
    private static readonly Regex Repeat = new(@"^repeat\s+(\d{1,2})(?:\s+times)?\s*:?$", Options, Timeout);
    private static readonly Regex End = new(@"^end(?:\s+repeat)?$", Options, Timeout);

    private static readonly Dictionary<string, int> Directions = new() { ["up"] = Up, ["right"] = Right, ["down"] = Down, ["left"] = Left };
    private static readonly (int Row, int Col)[] Steps = { (-1, 0), (0, 1), (1, 0), (0, -1) };

    private abstract record Node(int Line);

    /// <summary>Facing is the direction to move in, or null to move the way the player is pointing.</summary>
    private sealed record Move(int? Facing, int Count, int Line) : Node(Line);

    private sealed record Spin(int Quarters, int Line) : Node(Line);

    private sealed record Loop(int Times, List<Node> Body, int Line) : Node(Line);

    private sealed class Stop : Exception
    {
        public string Status { get; }
        public int Line { get; }
        public Stop(string status, string message, int line) : base(message) { Status = status; Line = line; }
    }

    public static MoveRun Run(MoveGrid grid, string? program)
    {
        var start = new[] { new MoveStep(grid.Start.Row, grid.Start.Col, 0, grid.Facing) };
        if (string.IsNullOrWhiteSpace(program)) return new(start, "empty", "Add some commands first.", null);
        if (program.Length > MaxProgramLength) return new(start, "too-long", "That program is too long.", null);

        var lines = program.Replace("\r", "").Split('\n');
        if (lines.Length > MaxLines) return new(start, "too-long", $"Use {MaxLines} lines or fewer.", null);

        // Read the whole program first, so a typo is reported before the robot moves.
        var root = new List<Node>();
        var open = new Stack<Loop>();
        var blocks = 0;
        for (var i = 0; i < lines.Length; i++)
        {
            var text = lines[i].Trim();
            if (text.Length == 0 || text.StartsWith('#') || text.StartsWith("//")) continue;
            var line = i + 1;
            var squashed = Regex.Replace(text, @"\s+", " ");
            var body = open.Count > 0 ? open.Peek().Body : root;

            if (End.IsMatch(squashed))
            {
                if (open.Count == 0) return new(start, "syntax", $"Line {line}: this \"end\" doesn't close a repeat.", line);
                open.Pop();
                continue;
            }

            blocks++;
            var repeat = Repeat.Match(squashed);
            if (repeat.Success)
            {
                if (open.Count >= MaxDepth) return new(start, "syntax", $"Line {line}: repeats can only go {MaxDepth} deep.", line);
                var loop = new Loop(Math.Max(1, int.Parse(repeat.Groups[1].Value)), new List<Node>(), line);
                body.Add(loop);
                open.Push(loop);
                continue;
            }

            var turn = Turn.Match(squashed);
            if (turn.Success)
            {
                var way = (turn.Groups[1].Success ? turn.Groups[1].Value : turn.Groups[2].Value).ToLowerInvariant();
                body.Add(new Spin(way is "left" or "tl" ? 3 : way is "right" or "tr" ? 1 : 2, line));
                continue;
            }

            var forward = Forward.Match(squashed);
            if (forward.Success)
            {
                body.Add(new Move(null, forward.Groups[1].Success ? int.Parse(forward.Groups[1].Value) : 1, line));
                continue;
            }

            var match = Command.Match(squashed);
            if (!match.Success)
                return new(start, "syntax", $"Line {line}: I don't understand \"{text}\". Try \"move right 3\".", line);

            body.Add(new Move(Directions[match.Groups[1].Value.ToLowerInvariant()], match.Groups[2].Success ? int.Parse(match.Groups[2].Value) : 1, line));
        }
        if (open.Count > 0) return new(start, "syntax", $"Line {open.Peek().Line}: this repeat needs an \"end\".", open.Peek().Line);
        if (blocks == 0) return new(start, "empty", "Add some commands first.", null);

        var trace = new List<MoveStep>(start);
        var current = grid.Start;
        var facing = grid.Facing;
        var stars = grid.Stars ?? new HashSet<GridCell>();
        var collected = new HashSet<GridCell>();

        void Execute(List<Node> nodes)
        {
            foreach (var node in nodes)
            {
                if (node is Loop loop)
                {
                    for (var n = 0; n < loop.Times; n++) Execute(loop.Body);
                    continue;
                }

                if (trace.Count > MaxSteps) throw new Stop("too-long", "That's too many moves. Look for a shorter way.", node.Line);
                if (node is Spin spin)
                {
                    facing = (facing + spin.Quarters) % 4;
                    trace.Add(new MoveStep(current.Row, current.Col, spin.Line, facing));
                    continue;
                }

                var move = (Move)node;
                facing = move.Facing ?? facing;
                var (rowStep, colStep) = Steps[facing];
                for (var n = 0; n < move.Count; n++)
                {
                    if (trace.Count > MaxSteps) throw new Stop("too-long", "That's too many moves. Look for a shorter way.", move.Line);

                    var next = new GridCell(current.Row + rowStep, current.Col + colStep);
                    if (next.Row < 0 || next.Col < 0 || next.Row >= grid.Rows || next.Col >= grid.Cols)
                        throw new Stop("wall", $"Line {move.Line}: the block hit the edge of the grid.", move.Line);
                    if (grid.Obstacles.Contains(next))
                        throw new Stop("obstacle", $"Line {move.Line}: the block bumped into an obstacle.", move.Line);

                    current = next;
                    if (stars.Contains(current)) collected.Add(current);
                    trace.Add(new MoveStep(current.Row, current.Col, move.Line, facing));
                }
            }
        }

        try
        {
            Execute(root);
        }
        catch (Stop stop)
        {
            return new(trace, stop.Status, stop.Message, stop.Line, blocks);
        }

        if (current != grid.Target) return new(trace, "stopped", "So close! The block stopped before the target.", null, blocks);

        var missed = stars.Count - collected.Count;
        if (missed > 0)
            return new(trace, "stars", missed == 1 ? "You got there, but missed a star. Collect them all!" : $"You got there, but missed {missed} stars. Collect them all!", null, blocks);

        if (grid.MaxBlocks is int max && blocks > max)
            return new(trace, "too-many", $"You got there with {blocks} commands. Can you do it with {max} or fewer? Try a repeat.", null, blocks);

        return new(trace, "reached", "You reached the target!", null, blocks);
    }
}
