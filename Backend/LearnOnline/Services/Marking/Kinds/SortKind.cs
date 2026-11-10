using System.Text.Json;
using System.Text.Json.Nodes;
using static LearnOnline.Services.Marking.MarkingJson;

namespace LearnOnline.Services.Marking.Kinds;

/// <summary>Sort into groups: every item belongs to one of two to four groups.</summary>
public sealed class SortKind : BlockKind
{
    public override string Type => "sortBlock";

    public override void Strip(JsonObject attrs)
    {
        var items = Objects(attrs["items"]).Select(o => o.DeepClone().AsObject()).ToList();
        foreach (var item in items) item.Remove("group");
        attrs["items"] = new JsonArray(Shuffle(items, Str(attrs, "blockId")).ToArray<JsonNode>());
    }

    public override MarkResult Mark(JsonObject attrs, JsonElement answer)
    {
        var placements = new Dictionary<string, string>();
        foreach (var p in Object(answer, "placements").EnumerateObject())
        {
            if (p.Value.ValueKind != JsonValueKind.String) throw Bad();
            placements[p.Name] = p.Value.GetString()!;
        }

        var perItem = new Dictionary<string, bool>();
        foreach (var item in Objects(attrs["items"]))
        {
            var id = Str(item, "id");
            perItem[id] = placements.TryGetValue(id, out var group) && group == Str(item, "group");
        }

        var score = perItem.Values.Count(ok => ok);
        var max = perItem.Count;
        var passed = max > 0 && score == max;

        return new MarkResult(passed, score, max, passed
            ? "Everything is in the right group!"
            : $"{score} of {max} are in the right group. Have another look.", new { perItem });
    }
}
