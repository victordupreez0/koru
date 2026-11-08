import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockBackground, PasteAndDrop, TextStyleWithSize, TrailingParagraph, UniqueBlockIds, cleanPastedHtml } from "../../src/components/editor/behaviours";
import { CalloutBlock } from "../../src/components/editor/blocks/CalloutBlock";
import { CodeBlock } from "../../src/components/editor/blocks/CodeBlock";
import { DrawingBlock } from "../../src/components/editor/blocks/DrawingBlock";
import { EmbedBlock } from "../../src/components/editor/blocks/EmbedBlock";
import { FileBlock } from "../../src/components/editor/blocks/FileBlock";
import { ImageBlock } from "../../src/components/editor/blocks/ImageBlock";
import { MoveBlock } from "../../src/components/editor/blocks/MoveBlock";
import { QuizBlock } from "../../src/components/editor/blocks/QuizBlock";
import { SquaresBlock } from "../../src/components/editor/blocks/SquaresBlock";
import { PAGE_TEMPLATES } from "../../src/components/editor/templates";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";

const extensions = [
  StarterKit.configure({ codeBlock: false, dropcursor: false }),
  TextStyleWithSize, BlockBackground, UniqueBlockIds, TrailingParagraph, PasteAndDrop,
  CodeBlock, CalloutBlock, ImageBlock, EmbedBlock, FileBlock, DrawingBlock, SquaresBlock, MoveBlock, QuizBlock,
];

const roundTrip = (content) => {
  const doc = { type: "doc", content: [...content, { type: "paragraph", attrs: { background: null } }] };
  const editor = new Editor({ extensions, content: doc });
  const out = editor.getJSON();
  editor.destroy();
  return out.content.slice(0, content.length);
};

describe("blocks survive a save and reload", () => {
  test.each([
    ["callout", { type: "callout", attrs: { variant: "warning" }, content: [{ type: "paragraph", attrs: { background: null }, content: [{ type: "text", text: "x" }] }] }],
    ["image", { type: "image", attrs: { src: "https://a.test/a.png", alt: "A cat", title: null, caption: "Fig 1", size: "medium", uploadId: null } }],
    ["embed", { type: "embed", attrs: { url: "https://vimeo.com/1" } }],
    ["file", { type: "fileAttachment", attrs: { url: "https://a.test/f.pdf", name: "f.pdf", size: 1234, uploadId: null } }],
    ["code", { type: "codeBlock", attrs: { language: "python" }, content: [{ type: "text", text: "a < b" }] }],
    ["drawing", { type: "drawing", attrs: { elements: [{ id: "a", type: "rectangle" }], svg: "<svg></svg>", alt: "A box" } }],
    ["squares", { type: "squaresBlock", attrs: { blockId: "s1", prompt: "Pick", rows: 2, cols: 2, correct: [0, 3], exactly: 2 } }],
    ["move", { type: "moveBlock", attrs: { blockId: "m1", prompt: "Go", rows: 3, cols: 3, start: [0, 0], target: [2, 2], obstacles: [[1, 1]] } }],
    ["quiz", { type: "quizBlock", attrs: { blockId: "q1", passPercent: 50, questions: [{ question: "a", options: ["x", "y"], correctAnswer: 1 }] } }],
  ])("%s", (_name, node) => expect(roundTrip([node])).toEqual([node]));

  test("background colour is part of the document", () => {
    const node = { type: "paragraph", attrs: { background: "red" }, content: [{ type: "text", text: "x" }] };
    expect(roundTrip([node])).toEqual([node]);
  });

  test("font size is part of the document", () => {
    const node = { type: "paragraph", attrs: { background: null }, content: [{ type: "text", text: "x", marks: [{ type: "textStyle", attrs: { fontSize: "1.25rem" } }] }] };
    expect(roundTrip([node])).toEqual([node]);
  });
});

describe("page templates", () => {
  const full = [...extensions, Table, TableRow, TableHeader, TableCell, TaskList, TaskItem];
  test.each(PAGE_TEMPLATES.map((t) => [t.title, t]))("%s is a valid document", (_title, template) => {
    const editor = new Editor({ extensions: full, content: { type: "doc", content: template.blocks } });
    editor.state.doc.check();
    expect(editor.getJSON().content.length).toBeGreaterThanOrEqual(template.blocks.length);
    editor.destroy();
  });
});

describe("TrailingParagraph", () => {
  test("adds a line after a block at the end once edited", () => {
    const editor = new Editor({ extensions, content: { type: "doc", content: [{ type: "paragraph" }] } });
    editor.commands.setContent({ type: "doc", content: [{ type: "embed", attrs: { url: "" } }] }, true);
    expect(editor.getJSON().content.at(-1).type).toBe("paragraph");
    editor.destroy();
  });
});

describe("UniqueBlockIds", () => {
  const blockIds = (editor) => editor.getJSON().content.filter((n) => n.attrs?.blockId !== undefined).map((n) => n.attrs.blockId);

  test("a new activity gets an id", () => {
    const editor = new Editor({ extensions, content: { type: "doc", content: [{ type: "paragraph" }] } });
    editor.commands.insertContent({ type: "squaresBlock" });
    expect(blockIds(editor)[0]).toBeTruthy();
    editor.destroy();
  });

  test("a duplicated activity gets its own id", () => {
    const block = { type: "squaresBlock", attrs: { blockId: "same" } };
    const editor = new Editor({ extensions, content: { type: "doc", content: [block, { type: "paragraph" }] } });
    editor.commands.insertContentAt(0, block);
    const ids = blockIds(editor);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    editor.destroy();
  });
});

describe("cleanPastedHtml", () => {
  test("drops fonts and colours but keeps bold", () => {
    const out = cleanPastedHtml(`<span style="font-family:Calibri;color:red;font-weight:700">x</span>`);
    expect(out).toContain("font-weight:700");
    expect(out).not.toMatch(/Calibri|color/);
  });
  test("leaves editor-to-editor copies alone", () => {
    const html = `<p data-pm-slice="1 1 []" style="color:red">x</p>`;
    expect(cleanPastedHtml(html)).toBe(html);
  });
});
