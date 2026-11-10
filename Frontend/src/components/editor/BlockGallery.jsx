import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "novel";
import { Plus, Search } from "lucide-react";
import { Button, Card } from "../UI";
import { cn } from "../../utils/cn";
import { CATEGORIES } from "./slashItems";

const matches = (item, query) =>
    [item.title, item.description, ...(item.searchTerms ?? [])].some((text) => text.toLowerCase().includes(query));

/**
 * Everything that can be added to a page, grouped and searchable. It replaces a long flat
 * menu: a lecturer can see what exists, what each thing is for, and which ones are marked.
 */
export default function BlockGallery({ items }) {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState(null); // null shows everything
    const search = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        search.current?.focus();
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const shown = items.filter((item) => (q ? matches(item, q) : !category || item.category === category));
        return CATEGORIES.map((c) => ({ ...c, items: shown.filter((item) => item.category === c.id) })).filter((g) => g.items.length);
    }, [items, query, category]);
    const available = useMemo(() => CATEGORIES.filter((c) => items.some((item) => item.category === c.id)), [items]);

    if (!editor) return null;

    const close = () => {
        setOpen(false);
        setQuery("");
    };
    const add = (item) => {
        item.command({ editor });
        close();
    };

    return (
        // No "relative" here on purpose: the panel hangs off the sticky toolbar and spans its whole width.
        <div>
            <Button variant="filled" size="sm" aria-haspopup="dialog" aria-expanded={open} onMouseDown={(e) => e.preventDefault()} onClick={() => (open ? close() : setOpen(true))} startIcon={<Plus size={13} />}>
                Add
            </Button>
            {open ? (
                <>
                    <div className="fixed inset-0 z-20" onClick={close} />
                    <Card
                        role="dialog"
                        aria-label="Add to the page"
                        variant="elevated"
                        tone="surface"
                        radius="lg"
                        padding="none"
                        className="@container absolute inset-x-0 top-full z-30 mt-2 flex max-h-[70vh] flex-col overflow-hidden shadow-koru-lg ring-1 ring-inset ring-koru-outline-faint"
                    >
                        <div className="flex flex-col gap-3 border-b border-koru-outline-faint p-3">
                            <label className="flex items-center gap-2 rounded-koru-pill bg-koru-surface-container-high px-3 py-2">
                                <Search size={15} aria-hidden="true" className="text-koru-on-surface-variant" />
                                <input
                                    ref={search}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && groups[0]) add(groups[0].items[0]); }}
                                    placeholder="What do you want to add? Try quiz, python, columns…"
                                    aria-label="Search everything you can add"
                                    className="w-full bg-transparent text-koru-body text-koru-on-surface outline-none placeholder:text-koru-outline"
                                />
                            </label>
                            <div role="tablist" aria-label="Kinds of block" className="flex flex-wrap gap-1">
                                {[{ id: null, label: "All" }, ...available].map((c) => (
                                    <button
                                        key={c.label}
                                        type="button"
                                        role="tab"
                                        aria-selected={!query && category === c.id}
                                        onClick={() => { setCategory(c.id); setQuery(""); }}
                                        className={cn(
                                            "cursor-pointer rounded-koru-pill px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                            !query && category === c.id ? "bg-koru-primary text-koru-on-primary" : "bg-koru-surface-container text-koru-on-surface-variant hover:bg-koru-surface-container-highest",
                                        )}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 overflow-y-auto p-3">
                            {groups.length === 0 ? <p className="p-6 text-center text-koru-body text-koru-on-surface-variant">Nothing matches "{query}". Try another word.</p> : null}
                            {groups.map((group) => (
                                <section key={group.id} aria-label={group.label}>
                                    <h3 className="mb-1.5 flex items-baseline gap-2 px-1">
                                        <span className="text-koru-label text-koru-on-surface">{group.label}</span>
                                        <span className="text-koru-caption text-koru-on-surface-variant">{group.hint}</span>
                                    </h3>
                                    <div className="grid gap-1.5 @md:grid-cols-2 @2xl:grid-cols-3">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.title}
                                                type="button"
                                                onClick={() => add(item)}
                                                className="flex cursor-pointer items-start gap-2.5 rounded-koru-md p-2 text-left transition-colors hover:bg-koru-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                            >
                                                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-koru-sm", group.id === "activities" ? "bg-koru-success-soft text-koru-success" : group.id === "code" ? "bg-koru-info-soft text-koru-info" : group.id === "explore" ? "bg-koru-warning-soft text-koru-warning" : "bg-koru-primary-container text-koru-on-primary-container")}>{item.icon}</span>
                                                <span className="min-w-0">
                                                    <span className="block text-koru-label text-koru-on-surface">{item.title}</span>
                                                    <span className="block text-koru-caption text-koru-on-surface-variant">{item.description}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </Card>
                </>
            ) : null}
        </div>
    );
}
