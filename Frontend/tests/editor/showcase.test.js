/* global describe, test, expect */
import fs from "node:fs";
import path from "node:path";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Link from "@tiptap/extension-link";
import { BlockBackground, UniqueBlockIds } from "../../src/components/editor/behaviours";
import { koruBlocks } from "../../src/components/editor/blocks/registry";
import { draftToNodes, inline, readMap } from "../../src/components/editor/draft";

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Link, Table, TableRow, TableHeader, TableCell, TaskList, TaskItem,
  BlockBackground, UniqueBlockIds, ...koruBlocks,
];

const load = (doc) => {
  const editor = new Editor({ extensions, content: doc });
  editor.state.doc.check();
  const out = editor.getJSON();
  editor.destroy();
  return out;
};

const typesIn = (node, found = new Set()) => {
  if (node?.type) found.add(node.type);
  (node?.content ?? []).forEach((child) => typesIn(child, found));
  return found;
};

describe("draft format", () => {
  test("inline marks", () => {
    expect(inline("a **b** *c* `d` [e](https://x.test)")).toEqual([
      { type: "text", text: "a " },
      { type: "text", text: "b", marks: [{ type: "bold" }] },
      { type: "text", text: " " },
      { type: "text", text: "c", marks: [{ type: "italic" }] },
      { type: "text", text: " " },
      { type: "text", text: "d", marks: [{ type: "code" }] },
      { type: "text", text: " " },
      { type: "text", text: "e", marks: [{ type: "link", attrs: { href: "https://x.test" } }] },
    ]);
  });

  test("robot maps", () => {
    expect(readMap(["S.#", "*.T"])).toEqual({ rows: 2, cols: 3, start: [0, 0], target: [1, 2], obstacles: [[0, 2]], stars: [[1, 0]] });
  });

  test("table cells starting with ? become answer cells", () => {
    const [node] = draftToNodes([{ t: "fillTable", headers: ["i", "x"], rows: [["1", "?2"], ["?3", "4"]] }]);
    expect(node.attrs.rows).toEqual([["1", "2"], ["3", "4"]]);
    expect(node.attrs.answers).toEqual([[0, 1], [1, 0]]);
  });

  test("activities get ids that are unique on the page", () => {
    const nodes = draftToNodes([{ t: "bits", target: 3 }, "text", { t: "bits", target: 5 }], "p1");
    expect(nodes.filter((n) => n.attrs?.blockId).map((n) => n.attrs.blockId)).toEqual(["p1-1", "p1-2"]);
  });

  test("unknown blocks are an error, not silently dropped", () => {
    expect(() => draftToNodes([{ t: "nonsense" }])).toThrow(/Unknown block/);
  });
});

const file = path.resolve(__dirname, "../../../Backend/LearnOnline/Data/showcase-courses.json");
const { courses } = JSON.parse(fs.readFileSync(file, "utf8"));
const pages = courses.flatMap((c) => [
  [`${c.code} home`, c.home.sections[0].content],
  ...c.items.map((item) => [`${c.code} ${item.label}`, item.content.sections[0].content]),
]);

describe("showcase courses", () => {
  test.each(pages)("%s loads into the editor unchanged", (_name, doc) => {
    const out = load(doc);
    expect(out.content.length).toBe(doc.content.length);
    // Every block type survives: nothing is dropped because the schema doesn't know it.
    expect([...typesIn(out)].sort()).toEqual([...typesIn(doc)].sort());
    // Activity settings survive as written.
    const activities = (d) => d.content.filter((n) => n.attrs?.blockId).map((n) => n.attrs);
    activities(doc).forEach((attrs, i) => expect(activities(out)[i]).toMatchObject(attrs));
  });
});
