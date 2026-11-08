import {
    Color,
    Command,
    HorizontalRule,
    Placeholder,
    StarterKit,
    TaskItem,
    TaskList,
    TiptapLink,
    TiptapUnderline,
    renderItems,
} from "novel";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { BlockBackground, PasteAndDrop, TextStyleWithSize, TrailingParagraph, UniqueBlockIds } from "./behaviours";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { DrawingBlock } from "./blocks/DrawingBlock";
import { EmbedBlock } from "./blocks/EmbedBlock";
import { FileBlock } from "./blocks/FileBlock";
import { ImageBlock } from "./blocks/ImageBlock";

// Every block a page can contain. Read-only views use the same list, so a student's
// page is rendered by exactly the same code as the lecturer's.
export const contentExtensions = [
    StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
    }),
    HorizontalRule,
    TiptapUnderline,
    TextStyleWithSize,
    Color,
    TiptapLink.configure({ openOnClick: true, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlock,
    CalloutBlock,
    ImageBlock,
    EmbedBlock,
    FileBlock,
    DrawingBlock,
    BlockBackground,
    UniqueBlockIds,
    TrailingParagraph,
    PasteAndDrop,
];

export const buildExtensions = ({ placeholder, slashItems }) => [
    ...contentExtensions,
    Placeholder.configure({
        placeholder: ({ editor, node }) => {
            if (node.type.name === "heading") return "Heading";
            return editor.isEmpty ? placeholder : "Type / for blocks";
        },
    }),
    Command.configure({
        suggestion: { items: () => slashItems, render: renderItems },
    }),
];
