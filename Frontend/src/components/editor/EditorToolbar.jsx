import React, { useState } from "react";
import { useEditor } from "novel";
import {
    Bold,
    ChevronDown,
    Code,
    Columns2,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Palette,
    Plus,
    Quote,
    Redo2,
    Rows2,
    Strikethrough,
    Trash2,
    Underline,
    Undo2,
} from "lucide-react";
import { Button, Card } from "../UI";
import { cn } from "../../utils/cn";
import { FONT_SIZES, TEXT_COLORS } from "./palette";

function ToolbarButton({ active, className, children, ...props }) {
    return (
        <button
            type="button"
            aria-pressed={active === undefined ? undefined : !!active}
            aria-label={props.title}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
                "flex cursor-pointer items-center rounded-koru-sm p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus disabled:cursor-default disabled:opacity-40",
                active ? "bg-koru-primary-container text-koru-on-primary-container" : "text-koru-on-surface-variant hover:bg-koru-surface-container-highest",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

function MenuItem({ className, children, ...props }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-koru-sm px-2 py-1.5 text-left text-koru-label text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

/** A toolbar dropdown; children get a close() so picking an item shuts the menu. */
function ToolbarMenu({ trigger, children, className }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            {trigger({ open, toggle: () => setOpen((v) => !v) })}
            {open ? (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                    <Card variant="elevated" tone="surface" radius="lg" padding="none" className={cn("absolute left-0 z-30 mt-1.5 flex flex-col gap-0.5 p-1.5 shadow-koru-md", className)}>
                        {children(() => setOpen(false))}
                    </Card>
                </>
            ) : null}
        </div>
    );
}

const Divider = () => <div className="mx-1 h-4 w-px bg-koru-outline-variant" />;

export default function EditorToolbar({ items, extra }) {
    const { editor } = useEditor();
    if (!editor) return null;
    const chain = () => editor.chain().focus();

    const setFontSize = (fontSize) => {
        if (fontSize) chain().setMark("textStyle", { fontSize }).run();
        else chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
    };
    const setColor = (color) => (color ? chain().setColor(color).run() : chain().unsetColor().run());

    return (
        <div role="toolbar" aria-label="Formatting" className="sticky top-2 z-30 mb-6 flex select-none flex-wrap items-center gap-1 rounded-koru-xl bg-koru-surface-container-high p-2 shadow-koru-md">
            <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><Undo2 size={15} /></ToolbarButton>
            <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><Redo2 size={15} /></ToolbarButton>
            <Divider />
            <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => chain().toggleHeading({ level: 1 }).run()}><Heading1 size={15} /></ToolbarButton>
            <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></ToolbarButton>
            <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 size={15} /></ToolbarButton>
            <Divider />
            <ToolbarMenu
                className="min-w-[130px]"
                trigger={({ toggle }) => (
                    <ToolbarButton title="Text size" onClick={toggle} className="gap-1 px-2 text-koru-caption">
                        <span aria-hidden="true">Size</span><ChevronDown size={11} />
                    </ToolbarButton>
                )}
            >
                {(close) => FONT_SIZES.map((s) => (
                    <MenuItem key={s.label} onClick={() => { setFontSize(s.value); close(); }} aria-pressed={(editor.getAttributes("textStyle").fontSize ?? null) === s.value}>
                        {s.label}
                    </MenuItem>
                ))}
            </ToolbarMenu>
            <Divider />
            <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}><Bold size={15} /></ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}><Italic size={15} /></ToolbarButton>
            <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => chain().toggleUnderline().run()}><Underline size={15} /></ToolbarButton>
            <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}><Strikethrough size={15} /></ToolbarButton>
            <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}><Code size={15} /></ToolbarButton>
            <ToolbarMenu
                className="min-w-[150px]"
                trigger={({ toggle }) => (
                    <ToolbarButton title="Text colour" onClick={toggle} className="gap-0.5">
                        <Palette size={15} /><ChevronDown size={11} />
                    </ToolbarButton>
                )}
            >
                {(close) => TEXT_COLORS.map((c) => (
                    <MenuItem key={c.label} onClick={() => { setColor(c.color); close(); }}>
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-koru-outline-variant" style={{ backgroundColor: c.color ?? "var(--color-koru-on-surface)" }} />
                        {c.label}
                    </MenuItem>
                ))}
            </ToolbarMenu>
            <Divider />
            <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}><List size={15} /></ToolbarButton>
            <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={15} /></ToolbarButton>
            <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}><Quote size={15} /></ToolbarButton>

            {editor.isActive("table") ? (
                <>
                    <Divider />
                    <ToolbarButton title="Add row" onClick={() => chain().addRowAfter().run()}><Rows2 size={15} /></ToolbarButton>
                    <ToolbarButton title="Add column" onClick={() => chain().addColumnAfter().run()}><Columns2 size={15} /></ToolbarButton>
                    <ToolbarButton title="Delete row" onClick={() => chain().deleteRow().run()} className="gap-0.5"><Rows2 size={15} /><Trash2 size={11} /></ToolbarButton>
                    <ToolbarButton title="Delete column" onClick={() => chain().deleteColumn().run()} className="gap-0.5"><Columns2 size={15} /><Trash2 size={11} /></ToolbarButton>
                    <ToolbarButton title="Delete table" onClick={() => chain().deleteTable().run()}><Trash2 size={15} /></ToolbarButton>
                </>
            ) : null}

            <Divider />
            <ToolbarMenu
                className="max-h-[60vh] w-64 overflow-y-auto md:left-auto md:right-0"
                trigger={({ toggle }) => (
                    <Button variant="tonal" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={toggle} startIcon={<Plus size={13} />}>
                        Insert
                    </Button>
                )}
            >
                {(close) => items.map((item) => (
                    <MenuItem key={item.title} onClick={() => { item.command({ editor }); close(); }}>
                        <span className="text-koru-on-surface-variant">{item.icon}</span>
                        <span>{item.title}</span>
                    </MenuItem>
                ))}
            </ToolbarMenu>
            {extra}
        </div>
    );
}
