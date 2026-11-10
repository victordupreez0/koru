/* global describe, test, expect */
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BitsBlock } from "../../src/components/editor/blocks/BitsBlock";
import { BlanksBlock } from "../../src/components/editor/blocks/BlanksBlock";
import { FillTableBlock } from "../../src/components/editor/blocks/FillTableBlock";
import { blankAnswers, countBlanks, splitBlanks } from "../../src/components/editor/blocks/blanksText";

const extensions = [StarterKit.configure({ codeBlock: false, dropcursor: false }), BlanksBlock, FillTableBlock, BitsBlock];

const roundTrip = (node) => {
  const editor = new Editor({ extensions, content: { type: "doc", content: [node, { type: "paragraph" }] } });
  const out = editor.getJSON();
  editor.destroy();
  return out.content[0];
};

const fromHtml = (node) => {
  const html = new Editor({ extensions, content: { type: "doc", content: [node] } }).getHTML();
  const editor = new Editor({ extensions, content: html });
  const out = editor.getJSON();
  editor.destroy();
  return out.content[0];
};

describe("activity blocks survive a save and reload", () => {
  test.each([
    ["blanks", { type: "blanksBlock", attrs: { blockId: "b1", prompt: "Fill in", text: "x = {{5}}\nprint({{x}})", code: true, bank: true, distractors: ["y"], caseSensitive: true, options: null } }],
    ["blanks as a student sees it", { type: "blanksBlock", attrs: { blockId: "b2", prompt: "", text: "The {{}} is the brain.", code: false, bank: true, distractors: [], caseSensitive: false, options: ["RAM", "CPU"] } }],
    ["fill table", { type: "fillTableBlock", attrs: { blockId: "t1", prompt: "Trace it", headers: ["line", "x"], rows: [["1", "3"], ["2", "6"]], answers: [[1, 1]], caseSensitive: false } }],
    ["bits", { type: "bitsBlock", attrs: { blockId: "x1", prompt: "Make it", bits: 4, target: 9 } }],
    ["bits free play", { type: "bitsBlock", attrs: { blockId: "x2", prompt: "", bits: 8, target: null } }],
  ])("%s", (_name, node) => {
    expect(roundTrip(node)).toEqual(node);
    expect(fromHtml(node)).toEqual(node);
  });

  test("new blocks start with a working example", () => {
    expect(roundTrip({ type: "blanksBlock" }).attrs.text).toMatch(/\{\{CPU\}\}/);
    expect(roundTrip({ type: "fillTableBlock" }).attrs.answers).toEqual([[0, 2], [1, 2], [2, 2], [3, 2]]);
    expect(roundTrip({ type: "bitsBlock" }).attrs).toMatchObject({ bits: 8, target: null });
  });
});

describe("blanksText", () => {
  test("splits text into runs and blanks", () => {
    expect(splitBlanks("The {{CPU}} is the {{brain|core}}.")).toEqual([{ text: "The " }, { blank: 0 }, { text: " is the " }, { blank: 1 }, { text: "." }]);
  });

  test("handles blanks at the edges, next to each other and emptied by the server", () => {
    expect(splitBlanks("{{}}{{}} end")).toEqual([{ blank: 0 }, { blank: 1 }, { text: " end" }]);
    expect(splitBlanks("no blanks")).toEqual([{ text: "no blanks" }]);
    expect(splitBlanks("")).toEqual([]);
  });

  test("a blank never spans lines, so code keeps its braces", () => {
    expect(countBlanks("if (x) {{\n}}")).toBe(0);
    expect(splitBlanks("for i in {{range}}(3):\n    print(i)")).toEqual([{ text: "for i in " }, { blank: 0 }, { text: "(3):\n    print(i)" }]);
  });

  test("counts blanks", () => {
    expect(countBlanks("a {{b}} c {{d|e}} {{}}")).toBe(3);
    expect(countBlanks()).toBe(0);
  });

  test("reads the accepted answers", () => {
    expect(blankAnswers("{{ colour | color }} and {{CPU}} and {{}}")).toEqual([["colour", "color"], ["CPU"], []]);
  });
});
