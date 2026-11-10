import React, { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Columns3, Plus, Trash2 } from "lucide-react";
import { Alert, Button, Input, Select } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const MIN_GROUPS = 2;
const MAX_GROUPS = 4;
// A private type, so a drop inside the editor never pastes the id into the page as text.
const DRAG_TYPE = "application/x-koru-sort-item";
const newId = () => crypto.randomUUID().slice(0, 8);
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2";

function Author({ attrs, update }) {
    const { prompt, groups, items } = attrs;

    const removeGroup = (id) => {
        const rest = groups.filter((g) => g.id !== id);
        update({ groups: rest, items: items.map((it) => (it.group === id ? { ...it, group: rest[0].id } : it)) });
    };
    const setItem = (id, patch) => update({ items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Put each one in the right group." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-col gap-2">
                <p className="text-koru-label text-koru-on-surface">Groups</p>
                {groups.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-2">
                        <Input size="sm" aria-label={`Group ${i + 1} name`} value={g.label} onChange={(e) => update({ groups: groups.map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)) })} containerClassName="flex-1" />
                        <Button variant="text" size="icon" aria-label={`Remove group ${i + 1}`} disabled={groups.length <= MIN_GROUPS} onClick={() => removeGroup(g.id)}><Trash2 size={15} /></Button>
                    </div>
                ))}
                <div>
                    <Button size="sm" variant="tonal" startIcon={<Plus size={14} aria-hidden="true" />} disabled={groups.length >= MAX_GROUPS} onClick={() => update({ groups: [...groups, { id: newId(), label: `Group ${String.fromCharCode(65 + groups.length)}` }] })}>
                        Add a group
                    </Button>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-koru-label text-koru-on-surface">Things to sort</p>
                <p className="text-koru-caption text-koru-on-surface-variant">Choose the right group for each one. Students get them shuffled, without the answers.</p>
                {items.map((it, i) => (
                    <div key={it.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        <Input size="sm" aria-label={`Thing ${i + 1}`} value={it.text} onChange={(e) => setItem(it.id, { text: e.target.value })} containerClassName="min-w-40 flex-1" />
                        <Select size="sm" aria-label={`Group for thing ${i + 1}`} value={it.group} onChange={(e) => setItem(it.id, { group: e.target.value })} containerClassName="w-44">
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.label || "Unnamed group"}</option>)}
                        </Select>
                        <Button variant="text" size="icon" aria-label={`Remove thing ${i + 1}`} disabled={items.length <= 1} onClick={() => update({ items: items.filter((x) => x.id !== it.id) })}><Trash2 size={15} /></Button>
                    </div>
                ))}
                <div>
                    <Button size="sm" variant="tonal" startIcon={<Plus size={14} aria-hidden="true" />} onClick={() => update({ items: [...items, { id: newId(), text: "", group: groups[0].id }] })}>
                        Add a thing to sort
                    </Button>
                </div>
            </div>
        </>
    );
}

function Chip({ item, held, mark, calm, disabled, onClick, label }) {
    return (
        <button
            type="button"
            draggable={!disabled}
            disabled={disabled}
            aria-pressed={held}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE, item.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            className={cn(
                "min-h-11 cursor-pointer rounded-koru-pill px-4 py-2 text-koru-body font-medium shadow-koru-sm transition-[transform,box-shadow,background-color] duration-150",
                "bg-koru-surface-container-lowest text-koru-on-surface ring-1 ring-koru-outline-faint hover:shadow-koru-md motion-safe:hover:-translate-y-0.5",
                "disabled:cursor-default disabled:hover:translate-y-0",
                focusRing,
                held && "bg-koru-primary-container text-koru-on-primary-container shadow-koru-md ring-2 ring-koru-primary motion-safe:-translate-y-1",
                mark === true && "bg-koru-success-soft text-koru-success ring-2 ring-koru-success",
                mark === false && "bg-koru-error-container text-koru-on-error-container ring-2 ring-koru-error",
                mark === true && !calm && "koru-pop",
                mark === false && !calm && "koru-shake",
            )}
        >
            {item.text}
        </button>
    );
}

function Play({ attrs }) {
    const { blockId, prompt } = attrs;
    const groups = attrs.groups ?? [];
    const items = attrs.items ?? [];
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const calm = useReducedMotion();
    const [own, setOwn] = useState(null); // null until the student moves something
    const [held, setHeld] = useState(null);
    const [over, setOver] = useState(null);
    const [result, setResult] = useState(null);
    const [tries, setTries] = useState(0);

    // Come back to where the student last put things, keeping only what still exists.
    const saved = progress?.lastAnswer?.placements;
    const placements = own ?? Object.fromEntries(
        Object.entries(saved && typeof saved === "object" ? saved : {})
            .filter(([id, g]) => items.some((it) => it.id === id) && groups.some((x) => x.id === g)),
    );
    const done = !!result?.passed;
    const locked = done || busy;
    const tray = items.filter((it) => !placements[it.id]);
    const heldItem = items.find((it) => it.id === held);

    const place = (id, group) => {
        if (locked || !items.some((it) => it.id === id)) return;
        const next = { ...placements };
        if (group) next[id] = group;
        else delete next[id];
        setOwn(next);
        setResult(null);
        setHeld(null);
    };
    const dropProps = (group) => ({
        onDragOver: (e) => {
            if (locked || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
            e.preventDefault();
            setOver(group);
        },
        onDragLeave: () => setOver(null),
        onDrop: (e) => {
            e.preventDefault();
            setOver(null);
            place(e.dataTransfer.getData(DRAG_TYPE), group);
        },
    });
    const markOf = (id) => result?.details?.perItem?.[id];

    const check = async () => {
        const r = await submit({ placements });
        if (!r) return;
        setResult(r);
        setTries((t) => t + 1);
        if (r.passed) celebrate();
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <div
                {...dropProps("")}
                role="group"
                aria-label="Things to sort"
                className={cn(
                    "flex min-h-16 flex-wrap items-center gap-2 rounded-koru-lg border-2 border-dashed p-3 transition-colors",
                    over === "" ? "border-koru-primary bg-koru-primary-subtle" : "border-koru-outline-variant bg-koru-surface-container-low",
                )}
            >
                {tray.length ? tray.map((it) => (
                    <Chip
                        key={it.id}
                        item={it}
                        held={held === it.id}
                        calm={calm}
                        disabled={locked}
                        label={held === it.id ? `${it.text}, picked up. Now tap a group.` : `Pick up ${it.text}`}
                        onClick={() => setHeld(held === it.id ? null : it.id)}
                    />
                )) : (
                    <span className="px-1 text-koru-caption text-koru-on-surface-variant">{done ? "All done!" : "Everything is sorted. Press Check when you are ready."}</span>
                )}
            </div>
            <p className="-mt-1 text-koru-caption text-koru-on-surface-variant" aria-live="polite">
                {heldItem ? `Now tap the group where "${heldItem.text}" goes.` : tray.length ? "Tap a word to pick it up, then tap its group. You can drag too." : "Tap a word in a group to take it back out."}
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))" }}>
                {groups.map((g) => {
                    const inside = items.filter((it) => placements[it.id] === g.id);
                    const ready = !!held && !locked;
                    return (
                        <div
                            key={g.id}
                            {...dropProps(g.id)}
                            onClick={() => ready && place(held, g.id)}
                            className={cn(
                                "flex min-h-36 flex-col gap-2 rounded-koru-lg border-2 p-3 transition-colors",
                                over === g.id || ready ? "border-koru-primary bg-koru-primary-subtle" : "border-koru-outline-faint bg-koru-surface-container-low",
                                ready && "cursor-pointer",
                            )}
                        >
                            <button
                                type="button"
                                disabled={!ready}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    place(held, g.id);
                                }}
                                aria-label={ready ? `Put it in ${g.label}` : g.label}
                                className={cn("flex items-center justify-between gap-2 rounded-koru-sm text-left disabled:cursor-default", ready && "cursor-pointer", focusRing)}
                            >
                                <span className="text-koru-title text-koru-on-surface">{g.label}</span>
                                <span className="rounded-koru-pill bg-koru-surface-container-highest px-2 text-koru-caption text-koru-on-surface-variant">{inside.length}</span>
                            </button>
                            <div className="flex flex-wrap gap-2">
                                {inside.map((it) => (
                                    <Chip
                                        key={`${it.id}-${tries}`}
                                        item={it}
                                        held={false}
                                        mark={markOf(it.id)}
                                        calm={calm}
                                        disabled={locked}
                                        label={`${it.text}, in ${g.label}. Tap to take it out.`}
                                        onClick={() => place(it.id, "")}
                                    />
                                ))}
                            </div>
                            {ready ? <span className="mt-auto text-koru-caption text-koru-primary">Tap to put it here</span> : null}
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={check} loading={busy} disabled={tray.length > 0 || !items.length || done}>Check my answer</Button>
                <span className="text-koru-caption text-koru-on-surface-variant">{items.length - tray.length} of {items.length} sorted</span>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const SortBlock = makeActivityBlock({
    name: "sortBlock",
    label: "Sort into groups",
    icon: <Columns3 size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "Put each one in the right group." },
        groups: jsonAttribute("groups", [
            { id: "groupA", label: "Group A" },
            { id: "groupB", label: "Group B" },
        ]),
        items: jsonAttribute("items", [
            { id: "item1", text: "Apple", group: "groupA" },
            { id: "item2", text: "Banana", group: "groupA" },
            { id: "item3", text: "Carrot", group: "groupB" },
            { id: "item4", text: "Pea", group: "groupB" },
        ]),
    },
    Author,
    Play,
});
