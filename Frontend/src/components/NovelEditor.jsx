import React, { useEffect, useMemo } from "react";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    EditorRoot,
    handleCommandNavigation,
    useEditor,
} from "novel";
import NovelBlockMenu from "./NovelBlockMenu";
import EditorBubbleMenu from "./editor/EditorBubbleMenu";
import EditorToolbar from "./editor/EditorToolbar";
import { buildExtensions } from "./editor/extensions";
import { homeSlashItems, notesSlashItems, pageSlashItems } from "./editor/slashItems";
import "./editor/editor.css";

const editorProps = {
    handleDOMEvents: { keydown: (_view, event) => handleCommandNavigation(event) },
};

// Tiptap's own onCreate can report an instance that React's strict mode has already
// thrown away, so hand callers the editor that is actually on screen.
function ReportEditor({ onReady }) {
    const { editor } = useEditor();
    useEffect(() => {
        if (editor) onReady?.({ editor });
    }, [editor, onReady]);
    return null;
}

/**
 * Shared Novel rich-text editor.
 *
 *   initialContent – Tiptap JSON. Only read on mount, so give it a React key to load another document.
 *   onUpdate       – ({ editor }) => void, on every change
 *   onCreate       – ({ editor }) => void, once on mount
 *   editable       – false renders the same document read-only
 *   variant        – "page" has every block; "home" leaves out auto-marked activities; "notes" is text only
 *   toolbarExtra   – extra controls at the end of the toolbar
 */
export default function NovelEditor({
    initialContent,
    onUpdate,
    onCreate,
    editable = true,
    placeholder = "Start writing...",
    className = "",
    variant = "page",
    toolbarExtra,
}) {
    const slashItems = { notes: notesSlashItems, home: homeSlashItems, page: pageSlashItems }[variant];
    const extensions = useMemo(() => buildExtensions({ placeholder, slashItems }), [placeholder, slashItems]);

    return (
        <EditorRoot>
            <EditorContent
                initialContent={initialContent}
                editable={editable}
                extensions={extensions}
                editorProps={editorProps}
                onUpdate={onUpdate}
                className={`w-full max-w-none focus:outline-none ${className}`}
                slotBefore={editable && variant !== "notes" ? <EditorToolbar items={slashItems} extra={toolbarExtra} /> : null}
            >
                <ReportEditor onReady={onCreate} />
                {editable ? (
                    <>
                        <EditorBubbleMenu />
                        <NovelBlockMenu />
                        <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-koru-md bg-koru-surface-container-lowest p-1.5 text-koru-on-surface shadow-koru-md ring-1 ring-inset ring-koru-outline-faint">
                            <EditorCommandEmpty className="px-2 py-1 text-koru-label text-koru-on-surface-variant">No matching blocks</EditorCommandEmpty>
                            <EditorCommandList>
                                {slashItems.map((item) => (
                                    <EditorCommandItem
                                        key={item.title}
                                        value={item.title}
                                        keywords={item.searchTerms}
                                        onCommand={(val) => item.command(val)}
                                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-koru-sm px-2 py-1.5 text-left hover:bg-koru-surface-container-high aria-selected:bg-koru-surface-container-high"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-koru-sm bg-koru-surface-container text-koru-on-surface-variant">{item.icon}</span>
                                        <span className="min-w-0">
                                            <span className="block text-koru-label text-koru-on-surface">{item.title}</span>
                                            <span className="block truncate text-koru-caption text-koru-on-surface-variant">{item.description}</span>
                                        </span>
                                    </EditorCommandItem>
                                ))}
                            </EditorCommandList>
                        </EditorCommand>
                    </>
                ) : null}
            </EditorContent>
        </EditorRoot>
    );
}
