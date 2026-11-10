import React from "react";
import {
    BarChart3,
    Binary,
    Blocks,
    Bot,
    CheckSquare,
    ChevronsDownUp,
    CircleHelp,
    CircuitBoard,
    Code2,
    Columns2,
    Columns3,
    Database,
    Globe,
    Grid3x3,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Layers,
    Lightbulb,
    List,
    ListOrdered,
    ListTree,
    Minus,
    MonitorPlay,
    Paperclip,
    PanelTop,
    PenLine,
    Pencil,
    Quote,
    Shapes,
    Table as TableIcon,
    Table2,
    TextCursorInput,
    Type,
    Ungroup,
    Workflow,
} from "lucide-react";
import { createSuggestionItems } from "novel";
import { forward, repeat, right, say, workspace } from "./runtime/blockJson";
import { focusNextBlock } from "./uploads";

// With a range the item came from the slash menu, so the typed "/query" is removed first.
const start = ({ editor, range }) => (range ? editor.chain().focus().deleteRange(range) : editor.chain().focus());

const insertBlock = (type, attrs = {}) => (ctx) => {
    focusNextBlock.current = true;
    start(ctx).insertContent({ type, attrs }).run();
};
const insert = (node) => (ctx) => start(ctx).insertContent(node).run();

const icon = (component) => React.createElement(component, { size: 16, "aria-hidden": true });
const item = (category, title, description, glyph, command, searchTerms = []) => ({ category, title, description, icon: icon(glyph), command, searchTerms });

const columnsNode = (count) => ({
    type: "columns",
    content: Array.from({ length: count }, () => ({ type: "column", content: [{ type: "paragraph" }] })),
});

const SAMPLE_TABLES = `CREATE TABLE learners (id INTEGER PRIMARY KEY, name TEXT, grade INTEGER, mark INTEGER);
INSERT INTO learners VALUES
  (1, 'Thabo', 11, 78),
  (2, 'Lerato', 11, 91),
  (3, 'Aisha', 12, 64),
  (4, 'Sipho', 12, 85);
`;

export const CATEGORIES = [
    { id: "basics", label: "Basics", hint: "Words, headings and lists" },
    { id: "layout", label: "Layout", hint: "Make a page look designed" },
    { id: "media", label: "Media", hint: "Pictures, video and files" },
    { id: "code", label: "Code", hint: "Code that really runs, and diagrams" },
    { id: "activities", label: "Activities", hint: "Marked for you, with results per student" },
    { id: "explore", label: "Explore", hint: "Things to play with, not marked" },
];

export const CATALOG = [
    item("basics", "Text", "A plain paragraph", Type, (c) => start(c).setParagraph().run(), ["paragraph", "p"]),
    item("basics", "Heading 1", "Big section heading", Heading1, (c) => start(c).setNode("heading", { level: 1 }).run(), ["title", "h1"]),
    item("basics", "Heading 2", "Medium heading", Heading2, (c) => start(c).setNode("heading", { level: 2 }).run(), ["subtitle", "h2"]),
    item("basics", "Heading 3", "Small heading", Heading3, (c) => start(c).setNode("heading", { level: 3 }).run(), ["h3"]),
    item("basics", "Bullet list", "A simple list", List, (c) => start(c).toggleBulletList().run(), ["unordered", "ul"]),
    item("basics", "Numbered list", "A list with numbers", ListOrdered, (c) => start(c).toggleOrderedList().run(), ["ordered", "ol", "steps"]),
    item("basics", "Checklist", "Tick-box items", CheckSquare, (c) => start(c).toggleTaskList().run(), ["todo", "task", "checkbox"]),
    item("basics", "Quote", "Quote someone", Quote, (c) => start(c).toggleBlockquote().run(), ["blockquote"]),
    item("basics", "Divider", "A line between sections", Minus, (c) => start(c).setHorizontalRule().run(), ["hr", "rule", "line"]),
    item("basics", "Table", "Rows and columns", TableIcon, (c) => start(c).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), ["grid"]),

    item("layout", "Banner", "A big colourful title", PanelTop, insertBlock("hero", { title: "", emoji: "🚀" }), ["hero", "header", "cover", "title"]),
    item("layout", "Callout", "Make something stand out", Lightbulb, insert({ type: "callout", attrs: { variant: "info" }, content: [{ type: "paragraph" }] }), ["alert", "notice", "info", "warning", "tip"]),
    item("layout", "2 columns", "Put things side by side", Columns2, insert(columnsNode(2)), ["column", "side", "split", "layout"]),
    item("layout", "3 columns", "Three things side by side", Columns3, insert(columnsNode(3)), ["column", "grid", "layout"]),
    item("layout", "Reveal", "A hint or answer that opens when clicked", ChevronsDownUp, insert({ type: "details", attrs: { title: "" }, content: [{ type: "paragraph" }] }), ["hint", "answer", "toggle", "accordion", "details", "spoiler", "solution"]),

    item("media", "Image", "Upload or link a picture", ImageIcon, insertBlock("image"), ["photo", "picture"]),
    item("media", "Video", "YouTube or Vimeo", MonitorPlay, insertBlock("embed"), ["youtube", "vimeo"]),
    item("media", "Embed", "Scratch, MakeCode, Google Slides, Canva, Figma", MonitorPlay, insertBlock("embed"), ["slides", "canva", "figma", "iframe", "docs", "forms", "scratch", "makecode", "microbit"]),
    item("media", "File", "Attach something to download", Paperclip, insertBlock("fileAttachment"), ["attachment", "pdf", "upload"]),
    item("media", "Drawing", "Sketch freely with shapes and arrows", PenLine, insertBlock("drawing"), ["excalidraw", "sketch", "shapes", "whiteboard"]),

    item("code", "Block coding", "Drag blocks together, like Scratch", Blocks, insertBlock("codeLab", { language: "blocks", starter: workspace([say("Hello!")]), toolbox: ["say", "loops", "logic", "math", "variables"] }), ["scratch", "blockly", "blocks", "program"]),
    item("code", "Draw with blocks", "Blocks that move a pen to draw shapes", Pencil, insertBlock("codeLab", { language: "blocks", starter: workspace([repeat(4, [forward(100), right(90)])]), toolbox: ["draw", "loops", "math", "variables"] }), ["turtle", "shapes", "logo", "square", "art"]),
    item("code", "Python", "Python that runs on the page", Code2, insertBlock("codeLab", { language: "python" }), ["program", "run", "script"]),
    item("code", "Python drawing", "Turtle graphics: code that draws", Shapes, insertBlock("codeLab", { language: "python", starter: "import turtle\n\nfor side in range(4):\n    turtle.forward(120)\n    turtle.right(90)\n" }), ["turtle", "shapes", "graphics", "art"]),
    item("code", "Delphi (Pascal)", "Delphi-style code that runs on the page", Code2, insertBlock("codeLab", { language: "pascal", starter: "var\n  sName: String;\nbegin\n  sName := 'Koru';\n  WriteLn('Hello, ', sName, '!');\nend.\n" }), ["delphi", "pascal", "it", "program"]),
    item("code", "SQL", "Queries on a real practice database", Database, insertBlock("codeLab", { language: "sql", setup: SAMPLE_TABLES, starter: "SELECT name, mark\nFROM learners\nWHERE mark >= 80;\n" }), ["database", "query", "select", "table"]),
    item("code", "JavaScript", "JavaScript that runs on the page", Code2, insertBlock("codeLab", { language: "javascript", starter: 'console.log("Hello, world!");\n' }), ["js", "program"]),
    item("code", "Web page", "HTML and CSS with a live preview", Globe, insertBlock("codeLab", { language: "web", starter: "<h1>Hello, world!</h1>\n<p>Change me.</p>\n\n<style>\n  h1 { color: rebeccapurple; }\n</style>\n" }), ["html", "css", "website"]),
    item("code", "Code to read", "Highlighted code that isn't run", Code2, (c) => start(c).setCodeBlock().run(), ["codeblock", "snippet", "example"]),
    item("code", "Diagram", "Flowcharts, class diagrams and more", Workflow, insertBlock("diagram"), ["flowchart", "mermaid", "erd", "uml", "class", "chart", "mind map"]),

    item("activities", "Quiz", "Multiple-choice questions", CircleHelp, insertBlock("quizBlock"), ["questions", "test", "mcq"]),
    item("activities", "Robot puzzle", "Code a path to the target", Bot, insertBlock("moveBlock"), ["maze", "robot", "bee", "arrows", "path", "grid"]),
    item("activities", "Put in order", "Drag steps or lines of code into order", ListTree, insertBlock("orderBlock"), ["sequence", "steps", "parsons", "sort", "arrange"]),
    item("activities", "Sort into groups", "Drop each item in the right group", Ungroup, insertBlock("sortBlock"), ["categorise", "classify", "match", "groups", "buckets"]),
    item("activities", "Fill in the blanks", "Missing words, or missing code", TextCursorInput, insertBlock("blanksBlock"), ["cloze", "gaps", "missing", "word bank"]),
    item("activities", "Fill in the table", "Trace tables and truth tables", Table2, insertBlock("fillTableBlock"), ["trace", "truth", "table", "ipo"]),
    item("activities", "Complete the pattern", "What comes next? With shapes", Shapes, insertBlock("patternBlock"), ["shapes", "sequence", "next", "pattern"]),
    item("activities", "Pick the right squares", "Tap squares on a grid", Grid3x3, insertBlock("squaresBlock"), ["grid", "pixel", "squares", "microbit"]),
    item("activities", "Binary switches", "Flip bits to make a number", Binary, insertBlock("bitsBlock", { target: 37 }), ["bits", "binary", "number", "base 2"]),

    item("explore", "Flashcards", "Words that flip to show what they mean", Layers, insertBlock("flashcardsBlock"), ["vocabulary", "terms", "cards", "revise"]),
    item("explore", "Algorithm animation", "Watch a sort or search, step by step", BarChart3, insertBlock("algoBlock"), ["bubble", "sort", "search", "binary", "linear", "selection"]),
    item("explore", "Logic gates", "A live circuit with switches", CircuitBoard, insertBlock("logicBlock"), ["and", "or", "not", "gate", "circuit", "boolean", "truth"]),
];

const pick = (...categories) => CATALOG.filter((i) => categories.includes(i.category));

// Notes are personal rich text, so they only get the basics.
// The course home page has no attempts to save against, so it leaves out the marked activities.
export const notesSlashItems = createSuggestionItems(pick("basics"));
export const homeSlashItems = createSuggestionItems(pick("basics", "layout", "media", "code", "explore"));
export const pageSlashItems = createSuggestionItems(CATALOG);
