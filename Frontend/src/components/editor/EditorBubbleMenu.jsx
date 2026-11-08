import React, { useState } from "react";
import { EditorBubble, useEditor } from "novel";
import { Bold, Code, Heading2, Italic, Link as LinkIcon, List, Quote, Strikethrough, Underline, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { safeUrl } from "./pageDocument";

function BubbleButton({ active, label, onClick, children }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={!!active}
            // mousedown would otherwise blur the editor and lose the selection
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={cn(
                "cursor-pointer rounded-koru-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                active ? "bg-koru-primary-container text-koru-on-primary-container" : "text-koru-on-surface-variant hover:bg-koru-surface-container-high hover:text-koru-on-surface",
            )}
        >
            {children}
        </button>
    );
}

export default function EditorBubbleMenu() {
    const { editor } = useEditor();
    const [linking, setLinking] = useState(false);
    const [href, setHref] = useState("");
    const [badLink, setBadLink] = useState(false);
    if (!editor) return null;

    const chain = () => editor.chain().focus();

    const openLink = () => {
        setHref(editor.getAttributes("link").href ?? "");
        setBadLink(false);
        setLinking(true);
    };

    const applyLink = (e) => {
        e.preventDefault();
        const value = /^[a-z]+:/i.test(href.trim()) ? href.trim() : `https://${href.trim()}`;
        if (!safeUrl(value)) {
            setBadLink(true);
            return;
        }
        chain().extendMarkRange("link").setLink({ href: value }).run();
        setLinking(false);
    };

    const removeLink = () => {
        chain().extendMarkRange("link").unsetLink().run();
        setLinking(false);
    };

    return (
        <EditorBubble
            tippyOptions={{ placement: "top", onHidden: () => setLinking(false) }}
            className="flex items-center gap-0.5 rounded-koru-md bg-koru-surface-container-lowest px-1.5 py-1 text-koru-on-surface shadow-koru-md ring-1 ring-inset ring-koru-outline-faint"
        >
            {linking ? (
                <form onSubmit={applyLink} className="flex items-center gap-1">
                    <input
                        autoFocus
                        value={href}
                        onChange={(e) => { setHref(e.target.value); setBadLink(false); }}
                        placeholder="Paste a link"
                        aria-label="Link address"
                        aria-invalid={badLink}
                        className={cn("w-56 rounded-koru-xs bg-transparent px-2 py-1 text-koru-label outline-none", badLink && "text-koru-error")}
                    />
                    <button type="submit" className="cursor-pointer rounded-koru-sm px-2 py-1 text-koru-label text-koru-primary hover:bg-koru-primary/8">Add</button>
                    <BubbleButton label="Remove link" onClick={removeLink}><X size={16} /></BubbleButton>
                </form>
            ) : (
                <>
                    <BubbleButton label="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}><Bold size={16} /></BubbleButton>
                    <BubbleButton label="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><Italic size={16} /></BubbleButton>
                    <BubbleButton label="Underline" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}><Underline size={16} /></BubbleButton>
                    <BubbleButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}><Strikethrough size={16} /></BubbleButton>
                    <BubbleButton label="Inline code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}><Code size={16} /></BubbleButton>
                    <BubbleButton label="Link" active={editor.isActive("link")} onClick={openLink}><LinkIcon size={16} /></BubbleButton>
                    <div className="mx-1 h-5 w-px bg-koru-outline-variant" />
                    <BubbleButton label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></BubbleButton>
                    <BubbleButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}><List size={16} /></BubbleButton>
                    <BubbleButton label="Quote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}><Quote size={16} /></BubbleButton>
                </>
            )}
        </EditorBubble>
    );
}
