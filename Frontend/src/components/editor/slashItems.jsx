import React from "react";
import {
    CheckSquare,
    Bot,
    CircleHelp,
    Code2,
    Grid3x3,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Lightbulb,
    List,
    ListOrdered,
    Minus,
    MonitorPlay,
    Paperclip,
    PenLine,
    Quote,
    Table as TableIcon,
    Type,
} from "lucide-react";
import { createSuggestionItems } from "novel";
import { focusNextBlock } from "./uploads";

// With a range the item came from the slash menu, so the typed "/query" is removed first.
const start = ({ editor, range }) => (range ? editor.chain().focus().deleteRange(range) : editor.chain().focus());

const insertBlock = (type, attrs = {}) => (ctx) => {
    focusNextBlock.current = true;
    start(ctx).insertContent({ type, attrs }).run();
};

const icon = (component) => React.createElement(component, { size: 16, "aria-hidden": true });

export const TEXT_ITEMS = [
    { title: "Text", description: "A plain paragraph", searchTerms: ["paragraph", "p"], icon: icon(Type), command: (c) => start(c).setParagraph().run() },
    { title: "Heading 1", description: "Big section heading", searchTerms: ["title", "h1"], icon: icon(Heading1), command: (c) => start(c).setNode("heading", { level: 1 }).run() },
    { title: "Heading 2", description: "Medium heading", searchTerms: ["subtitle", "h2"], icon: icon(Heading2), command: (c) => start(c).setNode("heading", { level: 2 }).run() },
    { title: "Heading 3", description: "Small heading", searchTerms: ["h3"], icon: icon(Heading3), command: (c) => start(c).setNode("heading", { level: 3 }).run() },
    { title: "Bullet list", description: "A simple list", searchTerms: ["unordered", "ul"], icon: icon(List), command: (c) => start(c).toggleBulletList().run() },
    { title: "Numbered list", description: "A list with numbers", searchTerms: ["ordered", "ol"], icon: icon(ListOrdered), command: (c) => start(c).toggleOrderedList().run() },
    { title: "Checklist", description: "Tick-box items", searchTerms: ["todo", "task", "checkbox"], icon: icon(CheckSquare), command: (c) => start(c).toggleTaskList().run() },
    { title: "Quote", description: "Quote someone", searchTerms: ["blockquote"], icon: icon(Quote), command: (c) => start(c).toggleBlockquote().run() },
    { title: "Divider", description: "A line between sections", searchTerms: ["hr", "rule", "line"], icon: icon(Minus), command: (c) => start(c).setHorizontalRule().run() },
    { title: "Code", description: "Code with highlighting", searchTerms: ["codeblock", "snippet"], icon: icon(Code2), command: (c) => start(c).setCodeBlock().run() },
];

export const PAGE_ITEMS = [
    { title: "Callout", description: "Make something stand out", searchTerms: ["alert", "notice", "info", "warning"], icon: icon(Lightbulb), command: (c) => start(c).insertContent({ type: "callout", attrs: { variant: "info" }, content: [{ type: "paragraph" }] }).run() },
    { title: "Table", description: "Rows and columns", searchTerms: ["grid"], icon: icon(TableIcon), command: (c) => start(c).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: "Image", description: "Upload or link a picture", searchTerms: ["photo", "picture"], icon: icon(ImageIcon), command: insertBlock("image") },
    { title: "Video", description: "YouTube or Vimeo", searchTerms: ["youtube", "vimeo"], icon: icon(MonitorPlay), command: insertBlock("embed") },
    { title: "Embed", description: "Google Slides, Canva, Figma", searchTerms: ["slides", "canva", "figma", "iframe", "docs", "forms"], icon: icon(MonitorPlay), command: insertBlock("embed") },
    { title: "File", description: "Attach something to download", searchTerms: ["attachment", "pdf", "upload"], icon: icon(Paperclip), command: insertBlock("fileAttachment") },
    { title: "Drawing", description: "Sketch a diagram", searchTerms: ["excalidraw", "sketch", "diagram", "shapes"], icon: icon(PenLine), command: insertBlock("drawing") },
];

// Auto-marked activities. They need a module page to save attempts against.
export const ACTIVITY_ITEMS = [
    { title: "Pick the right squares", description: "Auto-marked grid activity", searchTerms: ["activity", "grid", "squares", "assignment"], icon: icon(Grid3x3), command: insertBlock("squaresBlock") },
    { title: "Move the block", description: "Students code a path to the target", searchTerms: ["activity", "code", "robot", "assignment", "programming"], icon: icon(Bot), command: insertBlock("moveBlock") },
    { title: "Quiz", description: "Auto-marked multiple choice", searchTerms: ["activity", "questions", "test", "assignment"], icon: icon(CircleHelp), command: insertBlock("quizBlock") },
];

// Notes are personal rich text, so they only get the text blocks.
export const notesSlashItems = createSuggestionItems(TEXT_ITEMS);
export const homeSlashItems = createSuggestionItems([...TEXT_ITEMS, ...PAGE_ITEMS]);
export const pageSlashItems = createSuggestionItems([...TEXT_ITEMS, ...PAGE_ITEMS, ...ACTIVITY_ITEMS]);
