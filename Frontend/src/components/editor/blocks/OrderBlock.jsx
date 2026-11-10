import React, { useState } from "react";
import { MotionConfig, Reorder, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical, ListOrdered, Plus, Trash2 } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const newId = () => crypto.randomUUID().slice(0, 8);
const swap = (list, i, j) => {
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
};

const arrowButton = "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-koru-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus disabled:cursor-default disabled:opacity-30";

function Author({ attrs, update }) {
    const { prompt, items, code } = attrs;
    const setItems = (next) => update({ items: next });
    const noun = code ? "line" : "step";

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Put the steps in the right order." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <label className="flex cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                <input type="checkbox" checked={!!code} onChange={(e) => update({ code: e.target.checked })} className="h-4 w-4 accent-koru-primary" />
                Show as lines of code
            </label>
            <div className="flex flex-col gap-2">
                <p className="text-koru-caption text-koru-on-surface-variant">Type the {noun}s in the right order. Students get these shuffled.</p>
                {items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-right text-koru-label text-koru-on-surface-variant">{i + 1}</span>
                        <Input
                            size="sm"
                            aria-label={`${noun} ${i + 1}`}
                            value={item.text}
                            onChange={(e) => setItems(items.map((it) => (it.id === item.id ? { ...it, text: e.target.value } : it)))}
                            className={code ? "font-mono" : undefined}
                            containerClassName="flex-1"
                        />
                        <Button variant="text" size="icon" aria-label={`Move ${noun} ${i + 1} up`} disabled={i === 0} onClick={() => setItems(swap(items, i, i - 1))}><ChevronUp size={16} /></Button>
                        <Button variant="text" size="icon" aria-label={`Move ${noun} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => setItems(swap(items, i, i + 1))}><ChevronDown size={16} /></Button>
                        <Button variant="text" size="icon" aria-label={`Remove ${noun} ${i + 1}`} disabled={items.length <= 2} onClick={() => setItems(items.filter((it) => it.id !== item.id))}><Trash2 size={15} /></Button>
                    </div>
                ))}
                <div>
                    <Button size="sm" variant="tonal" startIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setItems([...items, { id: newId(), text: "" }])}>
                        Add a {noun}
                    </Button>
                </div>
            </div>
        </>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, code } = attrs;
    const items = attrs.items ?? [];
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [own, setOwn] = useState(null); // null until the student moves something
    const [result, setResult] = useState(null);
    const [tries, setTries] = useState(0);
    const calm = useReducedMotion();

    // Come back to the order the student last tried, if it still fits these items.
    const saved = progress?.lastAnswer?.order;
    const byId = new Map(items.map((it) => [it.id, it]));
    const restored = Array.isArray(saved) && saved.length === items.length && new Set(saved).size === items.length && saved.every((id) => byId.has(id))
        ? saved.map((id) => byId.get(id))
        : null;
    const order = own ?? restored ?? items;
    const done = !!result?.passed;

    const reorder = (next) => {
        setResult(null);
        setOwn(next);
    };
    const check = async () => {
        const r = await submit({ order: order.map((it) => it.id) });
        if (!r) return;
        setResult(r);
        setTries((t) => t + 1);
        if (r.passed) celebrate();
    };

    return (
        <MotionConfig reducedMotion="user">
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <p className="text-koru-caption text-koru-on-surface-variant">{done ? "All done!" : "Drag the rows, or use the arrows to move them."}</p>
            <Reorder.Group
                axis="y"
                values={order}
                onReorder={reorder}
                aria-label="Put these in order"
                className={cn("flex flex-col gap-2", code && "rounded-koru-lg bg-koru-inverse-surface p-2 gap-1")}
            >
                {order.map((item, i) => {
                    const mark = result?.details?.perItem?.[i];
                    return (
                        <Reorder.Item
                            key={item.id}
                            value={item}
                            dragListener={!done && !busy}
                            whileDrag={{ scale: 1.02 }}
                            className={cn(
                                "flex items-center gap-2 rounded-koru-md py-1.5 pl-2 pr-1.5 transition-colors",
                                !done && "cursor-grab active:cursor-grabbing",
                                code
                                    ? "text-koru-inverse-on-surface hover:bg-koru-inverse-on-surface/5"
                                    : "bg-koru-surface-container-lowest text-koru-on-surface shadow-koru-xs ring-1 ring-koru-outline-faint",
                                mark === true && (code ? "ring-2 ring-inset ring-koru-success" : "bg-koru-success-soft ring-2 ring-koru-success"),
                                mark === false && (code ? "ring-2 ring-inset ring-koru-error" : "bg-koru-error-container ring-2 ring-koru-error"),
                            )}
                        >
                            <span
                                key={`${i}-${tries}`}
                                aria-hidden="true"
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-koru-pill text-koru-label font-bold",
                                    code ? "font-mono text-koru-inverse-on-surface/60" : "bg-koru-primary-container text-koru-on-primary-container",
                                    mark === true && !calm && "koru-pop",
                                    mark === false && !calm && "koru-shake",
                                )}
                            >
                                {i + 1}
                            </span>
                            {!done ? <GripVertical size={16} aria-hidden="true" className={code ? "shrink-0 text-koru-inverse-on-surface/40" : "shrink-0 text-koru-outline"} /> : null}
                            <span className={cn("min-w-0 flex-1 select-none py-1", code ? "whitespace-pre font-mono text-sm overflow-x-auto" : "text-koru-body")}>
                                <span className="sr-only">{`Number ${i + 1}: `}</span>
                                {item.text}
                            </span>
                            <button
                                type="button"
                                aria-label={`Move "${item.text}" up`}
                                disabled={done || busy || i === 0}
                                onClick={() => reorder(swap(order, i, i - 1))}
                                className={cn(arrowButton, code ? "text-koru-inverse-on-surface hover:bg-koru-inverse-on-surface/10" : "text-koru-primary hover:bg-koru-primary/10")}
                            >
                                <ChevronUp size={20} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label={`Move "${item.text}" down`}
                                disabled={done || busy || i === order.length - 1}
                                onClick={() => reorder(swap(order, i, i + 1))}
                                className={cn(arrowButton, code ? "text-koru-inverse-on-surface hover:bg-koru-inverse-on-surface/10" : "text-koru-primary hover:bg-koru-primary/10")}
                            >
                                <ChevronDown size={20} aria-hidden="true" />
                            </button>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>
            <div>
                <Button size="sm" onClick={check} loading={busy} disabled={!items.length || done}>Check my answer</Button>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </MotionConfig>
    );
}

export const OrderBlock = makeActivityBlock({
    name: "orderBlock",
    label: "Put in order",
    icon: <ListOrdered size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "Put the steps in the right order." },
        items: jsonAttribute("items", [
            { id: "step1", text: "Get out of bed" },
            { id: "step2", text: "Brush your teeth" },
            { id: "step3", text: "Go to school" },
        ]),
        code: { default: false },
    },
    Author,
    Play,
});
