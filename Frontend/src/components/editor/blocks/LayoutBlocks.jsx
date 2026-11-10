import React, { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../utils/cn";

// ---------- Banner ----------

const HERO_THEMES = {
    purple: { label: "Purple", from: "var(--color-koru-primary)", to: "var(--color-koru-stat-violet)" },
    ocean: { label: "Ocean", from: "var(--color-koru-info)", to: "var(--color-koru-stat-sky)" },
    forest: { label: "Forest", from: "var(--color-koru-success)", to: "var(--color-koru-stat-green)" },
    sunset: { label: "Sunset", from: "var(--color-koru-accent-ink)", to: "var(--color-koru-stat-orange)" },
    night: { label: "Night", from: "var(--color-koru-inverse-surface)", to: "var(--color-koru-stat-slate)" },
};

const heroInput = "w-full bg-transparent text-inherit outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/60 rounded-koru-xs";

function HeroView({ node, updateAttributes, editor }) {
    const { title, subtitle, emoji, theme } = node.attrs;
    const { from, to } = HERO_THEMES[theme] ?? HERO_THEMES.purple;
    const editable = editor.isEditable;

    return (
        <NodeViewWrapper className="my-5">
            <div contentEditable={false} className="relative overflow-hidden rounded-koru-xl px-6 py-8 text-white shadow-koru-md md:px-10 md:py-10" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                {/* Soft shapes behind the words, so a banner never looks flat. */}
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-5">
                    <div className="min-w-0 flex-1">
                        {editable ? (
                            <>
                                <input aria-label="Banner title" placeholder="Banner title" value={title} onChange={(e) => updateAttributes({ title: e.target.value })} className={cn(heroInput, "font-display text-3xl font-medium leading-tight md:text-4xl")} />
                                <input aria-label="Banner subtitle" placeholder="A line underneath (optional)" value={subtitle} onChange={(e) => updateAttributes({ subtitle: e.target.value })} className={cn(heroInput, "mt-2 text-base opacity-90 md:text-lg")} />
                            </>
                        ) : (
                            <>
                                <p className="font-display text-3xl font-medium leading-tight md:text-4xl" role="heading" aria-level={2}>{title}</p>
                                {subtitle ? <p className="mt-2 text-base opacity-90 md:text-lg">{subtitle}</p> : null}
                            </>
                        )}
                    </div>
                    {editable ? (
                        <input aria-label="Banner emoji" placeholder="🙂" value={emoji} maxLength={8} onChange={(e) => updateAttributes({ emoji: e.target.value })} className={cn(heroInput, "w-20 shrink-0 text-center text-5xl md:w-24 md:text-6xl")} />
                    ) : emoji ? (
                        <span aria-hidden="true" className="shrink-0 text-5xl drop-shadow md:text-7xl">{emoji}</span>
                    ) : null}
                </div>
                {editable ? (
                    <div role="group" aria-label="Banner colour" className="relative mt-5 flex gap-1.5">
                        {Object.entries(HERO_THEMES).map(([id, t]) => (
                            <button
                                key={id}
                                type="button"
                                title={t.label}
                                aria-label={`${t.label} banner`}
                                aria-pressed={theme === id}
                                onClick={() => updateAttributes({ theme: id })}
                                className={cn("h-6 w-6 cursor-pointer rounded-full ring-2 focus-visible:outline-none focus-visible:ring-white", theme === id ? "ring-white" : "ring-white/30")}
                                style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </NodeViewWrapper>
    );
}

/** A big coloured banner to open a page or a section. */
export const HeroBlock = Node.create({
    name: "hero",
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
        return { title: { default: "" }, subtitle: { default: "" }, emoji: { default: "" }, theme: { default: "purple" } };
    },
    parseHTML() {
        return [{ tag: "div[data-hero]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-hero": "" })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(HeroView);
    },
});

// ---------- Columns ----------

/** One column. Holds any blocks. */
export const ColumnBlock = Node.create({
    name: "column",
    content: "block+",
    isolating: true,
    parseHTML() {
        return [{ tag: "div[data-column]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-column": "", class: "koru-column" }), 0];
    },
});

/** Two to four columns side by side; they stack on a phone. `layout` can favour one side. */
export const ColumnsBlock = Node.create({
    name: "columns",
    group: "block",
    content: "column{2,4}",
    defining: true,
    isolating: true,
    addAttributes() {
        return {
            layout: {
                default: "equal",
                parseHTML: (el) => el.getAttribute("data-layout") ?? "equal",
                renderHTML: (attrs) => ({ "data-layout": attrs.layout }),
            },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-columns]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-columns": "", class: "koru-columns" }), 0];
    },
});

// ---------- Reveal ----------

function DetailsView({ node, updateAttributes, editor }) {
    const editable = editor.isEditable;
    const [open, setOpen] = useState(false);
    const shown = editable || open;

    return (
        <NodeViewWrapper className="my-3 rounded-koru-md bg-koru-surface-container-low ring-1 ring-inset ring-koru-outline-faint">
            <div contentEditable={false} className="flex items-center gap-2 px-4 py-2.5">
                {editable ? (
                    <>
                        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-koru-on-surface-variant" />
                        <input aria-label="What students click to open this" placeholder="Hint (students click this to open it)" value={node.attrs.title} onChange={(e) => updateAttributes({ title: e.target.value })} className="w-full bg-transparent text-koru-label text-koru-on-surface outline-none placeholder:text-koru-outline" />
                    </>
                ) : (
                    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center gap-2 rounded-koru-xs text-left text-koru-label text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus">
                        <ChevronDown size={16} aria-hidden="true" className={cn("shrink-0 transition-transform", !open && "-rotate-90")} />
                        {node.attrs.title || "Show more"}
                    </button>
                )}
            </div>
            <NodeViewContent className={cn("px-4 pb-3", !shown && "hidden")} />
        </NodeViewWrapper>
    );
}

/** A heading that opens to show what is inside: a hint, an answer, extra reading. */
export const DetailsBlock = Node.create({
    name: "details",
    group: "block",
    content: "block+",
    defining: true,
    addAttributes() {
        return { title: { default: "" } };
    },
    parseHTML() {
        return [{ tag: "div[data-details]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-details": "" }), 0];
    },
    addNodeView() {
        return ReactNodeViewRenderer(DetailsView);
    },
});
