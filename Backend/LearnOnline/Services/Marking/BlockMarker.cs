using System.Text.Json;
using System.Text.Json.Nodes;

namespace LearnOnline.Services.Marking;

/// <summary>The submitted answer has the wrong shape. Sent back to the client as a 400.</summary>
public sealed class MarkingException : Exception
{
    public MarkingException(string message) : base(message) { }
}

public sealed record MarkResult(bool Passed, double Score, double MaxScore, string Message, object? Details = null);

/// <summary>
/// Marks an answer against the block stored on the server. Takes only the stored block and the
/// student's raw answer, so there is no way for a client to supply its own result or answer key.
/// The marking itself lives in one <see cref="BlockKind"/> per block type.
/// </summary>
public static class BlockMarker
{
    public static MarkResult Mark(JsonObject block, JsonElement answer)
    {
        if (block["attrs"] is not JsonObject attrs) throw new MarkingException("This block has no settings.");
        if (answer.ValueKind != JsonValueKind.Object) throw new MarkingException(MarkingJson.Invalid);
        if (!BlockKind.All.TryGetValue((string?)block["type"] ?? "", out var kind)) throw new MarkingException("This block can't be marked.");

        return kind.Mark(attrs, answer);
    }
}
