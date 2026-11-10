using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Put in order: steps or lines of code, stored in the right order.</summary>
public sealed class OrderKind : BlockKind
{
    public override string Type => "orderBlock";

    public override void Strip(JsonObject attrs)
    {
        var items = Objects(attrs["items"]);
        var shuffled = Shuffle(items, Str(attrs, "blockId"));
        // A shuffle that lands on the answer would give it away: rotate by one instead.
        if (items.Count > 1 && shuffled.SequenceEqual(items))
            shuffled = shuffled.Skip(1).Append(shuffled[0]).ToList();
        attrs["items"] = new JsonArray(shuffled.Select(o => o.DeepClone()).ToArray());
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var items = Objects(attrs["items"]);
        var order = Array(answer, "order");
        if (order.GetArrayLength() != items.Count) throw Bad("Please use every step.");

        var textById = new Dictionary<string, string>();
        foreach (var item in items) textById.TryAdd(Str(item, "id"), Str(item, "text"));

        // Compare the text in each position, so two identical lines can swap places.
        // An id that is unknown or used twice counts as wrong.
        var seen = new HashSet<string>();
        var perItem = order.EnumerateArray().Select((id, i) =>
        {
            if (id.ValueKind != JsonValueKind.String) throw Bad();
            var key = id.GetString()!;
            return seen.Add(key) && textById.TryGetValue(key, out var text) && text == Str(items[i], "text");
        }).ToList();

        var score = perItem.Count(ok => ok);
        var max = items.Count;
        var passed = max > 0 && score == max;

        return new MarkResult(passed, score, max, passed
            ? "Spot on! That's the right order."
            : $"{score} of {max} are in the right place. Keep going!", new { perItem });
    }
}
