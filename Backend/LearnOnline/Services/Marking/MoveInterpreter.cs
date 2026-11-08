using System.Text.RegularExpressions;

namespace LearnOnline.Services.Marking;

public sealed record GridCell(int Row, int Col);

public sealed record MoveGrid(int Rows, int Cols, GridCell Start, GridCell Target, IReadOnlySet<GridCell> Obstacles);

public sealed record MoveStep(int Row, int Col, int Line);

/// <param name="Status">reached, stopped, wall, obstacle, syntax, empty or too-long</param>
public sealed record MoveRun(IReadOnlyList<MoveStep> Trace, string Status, string Message, int? Line);

/// <summary>
/// Runs a student's "move right 3" program. It isn't a programming language: each line is
/// matched against one fixed pattern and turned into moves on a grid, so nothing a student
/// types can ever be executed. The caps below stop anyone sending an endless program.
/// </summary>
public static class MoveInterpreter
{
    public const int MaxProgramLength = 4000;
    public const int MaxLines = 100;
    public const int MaxSteps = 500;

    private static readonly Regex Command = new(
        @"^(?:move\s+)?(up|down|left|right)(?:\s+(\d{1,3}))?$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    private static readonly Dictionary<string, (int Row, int Col)> Directions = new()
    {
        ["up"] = (-1, 0),
        ["down"] = (1, 0),
        ["left"] = (0, -1),
        ["right"] = (0, 1),
    };

    public static MoveRun Run(MoveGrid grid, string? program)
    {
        var start = new[] { new MoveStep(grid.Start.Row, grid.Start.Col, 0) };
        if (string.IsNullOrWhiteSpace(program)) return new(start, "empty", "Add some commands first.", null);
        if (program.Length > MaxProgramLength) return new(start, "too-long", "That program is too long.", null);

        var lines = program.Replace("\r", "").Split('\n');
        if (lines.Length > MaxLines) return new(start, "too-long", $"Use {MaxLines} lines or fewer.", null);

        // Read the whole program first, so a typo is reported before the block moves.
        var commands = new List<(int Row, int Col, int Count, int Line)>();
        for (var i = 0; i < lines.Length; i++)
        {
            var text = lines[i].Trim();
            if (text.Length == 0 || text.StartsWith('#') || text.StartsWith("//")) continue;

            var match = Command.Match(Regex.Replace(text, @"\s+", " "));
            if (!match.Success)
                return new(start, "syntax", $"Line {i + 1}: I don't understand \"{text}\". Try \"move right 3\".", i + 1);

            var (row, col) = Directions[match.Groups[1].Value.ToLowerInvariant()];
            var count = match.Groups[2].Success ? int.Parse(match.Groups[2].Value) : 1;
            commands.Add((row, col, count, i + 1));
        }
        if (commands.Count == 0) return new(start, "empty", "Add some commands first.", null);

        var trace = new List<MoveStep>(start);
        var current = grid.Start;

        foreach (var (rowStep, colStep, count, line) in commands)
        {
            for (var n = 0; n < count; n++)
            {
                if (trace.Count > MaxSteps)
                    return new(trace, "too-long", "That's too many moves. Look for a shorter way.", line);

                var next = new GridCell(current.Row + rowStep, current.Col + colStep);
                if (next.Row < 0 || next.Col < 0 || next.Row >= grid.Rows || next.Col >= grid.Cols)
                    return new(trace, "wall", $"Line {line}: the block hit the edge of the grid.", line);
                if (grid.Obstacles.Contains(next))
                    return new(trace, "obstacle", $"Line {line}: the block bumped into an obstacle.", line);

                current = next;
                trace.Add(new MoveStep(current.Row, current.Col, line));
            }
        }

        return current == grid.Target
            ? new(trace, "reached", "You reached the target!", null)
            : new(trace, "stopped", "So close! The block stopped before the target.", null);
    }
}
