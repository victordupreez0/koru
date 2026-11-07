import React, { useEffect } from "react";
import {
    EditorRoot,
    EditorContent,
    EditorCommand,
    EditorCommandItem,
    EditorCommandList,
    EditorCommandEmpty,
    EditorBubble,
    EditorBubbleItem,
    StarterKit,
    Placeholder,
    TiptapUnderline,
    Color,
    TextStyle,
    createSuggestionItems,
    useEditor,
} from "novel";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
} from "lucide-react";
import NovelBlockMenu from "./NovelBlockMenu";

// Syncs the editable prop to the live Tiptap editor instance.
// Novel only sets editability on creation, so we must do it imperatively on change.
function EditableSync({ editable }) {
    const { editor } = useEditor();
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);
    return null;
}

const DEFAULT_EXTENSIONS = [
    StarterKit,
    TiptapUnderline,
    TextStyle,
    Color,
];

const DEFAULT_SUGGESTION_ITEMS = createSuggestionItems([
    {
        title: "Heading 1",
        searchTerms: ["title", "heading", "h1"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
    },
    {
        title: "Heading 2",
        searchTerms: ["subtitle", "heading", "h2"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
    },
    {
        title: "Heading 3",
        searchTerms: ["heading", "h3"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
        },
    },
    {
        title: "Bullet List",
        searchTerms: ["unordered", "list", "bullet"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        searchTerms: ["ordered", "list", "number"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "Quote",
        searchTerms: ["blockquote", "quote"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
    },
    {
        title: "Code Block",
        searchTerms: ["code", "codeblock"],
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
    },
]);

/**
 * Shared Novel rich-text editor component.
 *
 * Props:
 *   initialContent    – Tiptap JSON document to pre-populate the editor
 *   onUpdate          – ({ editor }) => void  called on every content change
 *   onCreate          – ({ editor }) => void  called once when editor mounts
 *   editable          – boolean (default true)
 *   placeholder       – string shown when editor is empty
 *   className         – extra classes applied to EditorContent
 *   showBubbleMenu    – render the floating text-format bubble (default true)
 *   showSlashCommands – render the "/" slash-command palette (default true)
 */
export default function NovelEditor({
    initialContent,
    onUpdate,
    onCreate,
    editable = true,
    placeholder = "Start writing...",
    className = "",
    showBubbleMenu = true,
    showSlashCommands = true,
}) {
    const extensions = [
        ...DEFAULT_EXTENSIONS,
        Placeholder.configure({ placeholder }),
    ];

    return (
        <EditorRoot>
            <EditorContent
                initialContent={initialContent}
                editable={editable}
                extensions={extensions}
                onCreate={onCreate}
                onUpdate={onUpdate}
                className={`w-full max-w-none focus:outline-none ${className}`}
            >
                <EditableSync editable={editable} />

                {showBubbleMenu && (
                    <EditorBubble className="flex items-center gap-0.5 rounded-koru-md bg-koru-surface-container-lowest px-1.5 py-1 text-koru-on-surface shadow-koru-md ring-1 ring-inset ring-koru-outline-faint">
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBold().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Bold"><Bold size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleItalic().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Italic"><Italic size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Underline"><Underline size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleStrike().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Strikethrough"><Strikethrough size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleCode().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Inline Code"><Code size={16} /></button>
                        </EditorBubbleItem>

                        <div className="mx-1 h-5 w-px bg-koru-outline-variant" />

                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Heading 1"><Heading1 size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Heading 2"><Heading2 size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Heading 3"><Heading3 size={16} /></button>
                        </EditorBubbleItem>

                        <div className="mx-1 h-5 w-px bg-koru-outline-variant" />

                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBulletList().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Bullet List"><List size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleOrderedList().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Numbered List"><ListOrdered size={16} /></button>
                        </EditorBubbleItem>
                        <EditorBubbleItem onSelect={(editor) => editor.chain().focus().toggleBlockquote().run()}>
                            <button className="rounded-koru-sm p-1.5 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" title="Quote"><Quote size={16} /></button>
                        </EditorBubbleItem>
                    </EditorBubble>
                )}

                {editable && <NovelBlockMenu />}

                {showSlashCommands && (
                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-koru-md bg-koru-surface-container-lowest px-1 py-2 text-koru-on-surface shadow-koru-md ring-1 ring-inset ring-koru-outline-faint transition-all">
                        <EditorCommandEmpty className="px-2 text-koru-on-surface-variant">No results</EditorCommandEmpty>
                        <EditorCommandList>
                            {DEFAULT_SUGGESTION_ITEMS.map((item) => (
                                <EditorCommandItem
                                    value={item.title}
                                    onCommand={(val) => item.command(val)}
                                    className="flex w-full items-center gap-2 cursor-pointer rounded-koru-sm px-2 py-1 text-left text-sm hover:bg-koru-surface-container-high aria-selected:bg-koru-surface-container-high"
                                    key={item.title}
                                >
                                    <span>{item.title}</span>
                                </EditorCommandItem>
                            ))}
                        </EditorCommandList>
                    </EditorCommand>
                )}
            </EditorContent>
        </EditorRoot>
    );
}
