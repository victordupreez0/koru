import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockBackground, UniqueBlockIds } from "../../src/components/editor/behaviours";
import { OrderBlock } from "../../src/components/editor/blocks/OrderBlock";
import { PatternBlock } from "../../src/components/editor/blocks/PatternBlock";
import { SortBlock } from "../../src/components/editor/blocks/SortBlock";
import { COLORS, SHAPES, parseToken, tokenLabel } from "../../src/components/editor/blocks/shapes";

const extensions = [StarterKit.configure({ codeBlock: false, dropcursor: false }), BlockBackground, UniqueBlockIds, PatternBlock, OrderBlock, SortBlock];

const roundTrip = (content) => {
  const editor = new Editor({ extensions, content: { type: "doc", content } });
  const out = editor.getJSON();
  editor.destroy();
  return out.content.slice(0, content.length);
};

describe("activity blocks survive a save and reload", () => {
  test.each([
    ["pattern", { type: "patternBlock", attrs: { blockId: "p1", prompt: "Next?", tokens: ["circle:red", "=7", "=🐝"], blanks: [2], distractors: ["star:pink"], options: null } }],
    ["pattern for a student", { type: "patternBlock", attrs: { blockId: "p2", prompt: "", tokens: ["circle:red", null], blanks: [1], distractors: [], options: ["circle:red", "square:blue"] } }],
    ["order", { type: "orderBlock", attrs: { blockId: "o1", prompt: "Order", items: [{ id: "a", text: "print(1)" }, { id: "b", text: "  x = 2" }], code: true } }],
    ["sort", { type: "sortBlock", attrs: { blockId: "s1", prompt: "Sort", groups: [{ id: "g1", label: "Hot" }, { id: "g2", label: "Cold" }], items: [{ id: "i1", text: "Sun", group: "g1" }] } }],
  ])("%s", (_name, node) => expect(roundTrip([node])).toEqual([node]));

  test("a new block starts with a working example", () => {
    const [pattern, order, sort] = roundTrip([
      { type: "patternBlock", attrs: { blockId: "p" } },
      { type: "orderBlock", attrs: { blockId: "o" } },
      { type: "sortBlock", attrs: { blockId: "s" } },
    ]);
    expect(pattern.attrs.tokens).toHaveLength(6);
    expect(pattern.attrs.blanks).toEqual([4, 5]);
    expect(pattern.attrs.tokens.every((t) => parseToken(t))).toBe(true);
    expect(order.attrs.items).toHaveLength(3);
    expect(sort.attrs.groups.map((g) => g.label)).toEqual(["Group A", "Group B"]);
    expect(sort.attrs.items.every((it) => sort.attrs.groups.some((g) => g.id === it.group))).toBe(true);
  });
});

describe("parseToken", () => {
  test("reads shapes and colours", () => {
    expect(parseToken("circle:red")).toEqual({ kind: "shape", shape: "circle", color: "red" });
    expect(parseToken("arrow-up:blue")).toEqual({ kind: "shape", shape: "arrow-up", color: "blue" });
  });

  test("reads text, numbers and emoji", () => {
    expect(parseToken("=7")).toEqual({ kind: "text", text: "7" });
    expect(parseToken("=🐝")).toEqual({ kind: "text", text: "🐝" });
    expect(parseToken("=a:b")).toEqual({ kind: "text", text: "a:b" });
  });

  test.each([null, undefined, "", "=", "blob:red", "circle:gold", "circle", 7])("rejects %p", (value) => {
    expect(parseToken(value)).toBeNull();
  });

  test("every shape and colour is valid", () => {
    for (const s of SHAPES) for (const c of Object.keys(COLORS)) expect(parseToken(`${s}:${c}`)).not.toBeNull();
  });

  test("labels read naturally", () => {
    expect(tokenLabel("arrow-left:green")).toBe("green arrow left");
    expect(tokenLabel("=7")).toBe("7");
    expect(tokenLabel(null)).toBe("empty");
  });
});
