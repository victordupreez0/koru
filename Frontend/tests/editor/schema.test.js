import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockBackground, PasteAndDrop, TextStyleWithSize, TrailingParagraph, UniqueBlockIds, cleanPastedHtml } from "../../src/components/editor/behaviours";
import { CalloutBlock } from "../../src/components/editor/blocks/CalloutBlock";
import { CodeBlock } from "../../src/components/editor/blocks/CodeBlock";
import { EmbedBlock } from "../../src/components/editor/blocks/EmbedBlock";
import { FileBlock } from "../../src/components/editor/blocks/FileBlock";
import { ImageBlock } from "../../src/components/editor/blocks/ImageBlock";

const extensions = [
  StarterKit.configure({ codeBlock: false, dropcursor: false }),
  TextStyleWithSize, BlockBackground, UniqueBlockIds, TrailingParagraph, PasteAndDrop,
  CodeBlock, CalloutBlock, ImageBlock, EmbedBlock, FileBlock,
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

describe("TrailingParagraph", () => {
  test("adds a line after a block at the end once edited", () => {
    const editor = new Editor({ extensions, content: { type: "doc", content: [{ type: "paragraph" }] } });
    editor.commands.setContent({ type: "doc", content: [{ type: "embed", attrs: { url: "" } }] }, true);
    expect(editor.getJSON().content.at(-1).type).toBe("paragraph");
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
