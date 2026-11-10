import React, { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Plus, Shapes, X } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import { COLORS, SHAPES, Token, tokenLabel } from "./shapes";
import Prose from "./Prose";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2";

/** Pick a shape and a colour, or type a number, letter or emoji, then press Add. */
function TokenBuilder({ onAdd, addLabel }) {
    const [shape, setShape] = useState("circle");
    const [color, setColor] = useState("red");
    const [text, setText] = useState("");
    const value = text.trim() ? `=${text.trim()}` : `${shape}:${color}`;
    const add = () => {
        onAdd(value);
        setText("");
    };

    return (
        <div className="flex flex-col gap-3 rounded-koru-md bg-koru-surface-container-low p-3">
            <div role="group" aria-label="Shape" className="flex flex-wrap gap-1.5">
                {SHAPES.map((s) => (
                    <button
                        key={s}
                        type="button"
                        aria-pressed={!text.trim() && shape === s}
                        aria-label={s.replace("-", " ")}
                        onClick={() => { setShape(s); setText(""); }}
                        className={cn(
                            "flex h-10 w-10 cursor-pointer items-center justify-center rounded-koru-sm transition-colors",
                            focusRing,
                            !text.trim() && shape === s ? "bg-koru-primary-container ring-2 ring-koru-primary" : "bg-koru-surface-container-lowest hover:bg-koru-surface-container-high",
                        )}
                    >
                        <Token value={`${s}:${color}`} size={26} />
                    </button>
                ))}
            </div>
            <div role="group" aria-label="Colour" className="flex flex-wrap gap-2">
                {Object.entries(COLORS).map(([name, hex]) => (
                    <button
                        key={name}
                        type="button"
                        aria-pressed={color === name}
                        aria-label={name}
                        onClick={() => { setColor(name); setText(""); }}
                        className={cn("h-8 w-8 cursor-pointer rounded-koru-pill transition-transform hover:scale-110", focusRing, color === name && "ring-2 ring-koru-on-surface ring-offset-2 ring-offset-koru-surface-container-low")}
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <Input
                    size="sm"
                    label="Or type a number, letter or emoji"
                    placeholder="7, A, 🐝"
                    maxLength={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    containerClassName="w-56"
                />
                <Button size="sm" variant="tonal" onClick={add} startIcon={<Plus size={14} aria-hidden="true" />}>
                    {addLabel}
                    <Token value={value} size={20} className="ml-1" />
                </Button>
            </div>
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, tokens, blanks, distractors } = attrs;

    const toggleBlank = (i) => update({ blanks: blanks.includes(i) ? blanks.filter((b) => b !== i) : [...blanks, i].sort((a, b) => a - b) });
    const removeAt = (i) => update({
        tokens: tokens.filter((_, j) => j !== i),
        blanks: blanks.filter((b) => b !== i).map((b) => (b > i ? b - 1 : b)),
    });

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="What comes next?" value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-col gap-2">
                <p className="text-koru-label text-koru-on-surface">The pattern</p>
                {tokens.length ? (
                    <div className="flex flex-wrap gap-2">
                        {tokens.map((token, i) => {
                            const blank = blanks.includes(i);
                            return (
                                <div key={i} className="relative">
                                    <button
                                        type="button"
                                        aria-pressed={blank}
                                        aria-label={`${tokenLabel(token)}${blank ? ", a gap" : ""}. Click to ${blank ? "show it" : "make it a gap"}.`}
                                        onClick={() => toggleBlank(i)}
                                        className={cn(
                                            "flex h-14 w-14 cursor-pointer items-center justify-center rounded-koru-md transition-colors",
                                            focusRing,
                                            blank ? "bg-koru-primary-subtle ring-2 ring-koru-primary" : "bg-koru-surface-container-lowest shadow-koru-xs hover:bg-koru-surface-container-high",
                                        )}
                                    >
                                        <Token value={token} size={40} className={blank ? "opacity-50" : undefined} />
                                    </button>
                                    {blank ? (
                                        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-koru-pill bg-koru-primary text-xs font-bold text-koru-on-primary">?</span>
                                    ) : null}
                                    <button
                                        type="button"
                                        aria-label={`Remove ${tokenLabel(token)}`}
                                        onClick={() => removeAt(i)}
                                        className={cn("absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-koru-pill bg-koru-surface-container-highest text-koru-on-surface-variant shadow-koru-xs hover:bg-koru-error hover:text-koru-on-error", focusRing)}
                                    >
                                        <X size={12} aria-hidden="true" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-koru-caption text-koru-on-surface-variant">Add shapes below to build the pattern.</p>
                )}
                <p className={cn("text-koru-caption", tokens.length && !blanks.length ? "text-koru-warning" : "text-koru-on-surface-variant")}>
                    {tokens.length && !blanks.length
                        ? "Click at least one shape to turn it into a gap."
                        : `Click a shape to turn it into a gap (${blanks.length} so far). Students fill the gaps from a set of choices.`}
                </p>
                <TokenBuilder addLabel="Add" onAdd={(t) => update({ tokens: [...tokens, t] })} />
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-koru-label text-koru-on-surface">Extra choices that are wrong</p>
                <div className="flex flex-wrap gap-2">
                    {distractors.map((token, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-koru-md bg-koru-surface-container-lowest py-1 pl-1.5 pr-1 shadow-koru-xs">
                            <Token value={token} size={28} />
                            <button
                                type="button"
                                aria-label={`Remove ${tokenLabel(token)}`}
                                onClick={() => update({ distractors: distractors.filter((_, j) => j !== i) })}
                                className={cn("flex h-6 w-6 cursor-pointer items-center justify-center rounded-koru-pill text-koru-on-surface-variant hover:bg-koru-error hover:text-koru-on-error", focusRing)}
                            >
                                <X size={12} aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                    {!distractors.length ? <span className="text-koru-caption text-koru-on-surface-variant">None yet. The right answers are always choices.</span> : null}
                </div>
                <TokenBuilder addLabel="Add choice" onAdd={(t) => update({ distractors: [...distractors, t] })} />
            </div>
        </>
    );
}

function Play({ attrs }) {
    const { blockId, prompt } = attrs;
    const tokens = attrs.tokens ?? [];
    const blanks = attrs.blanks ?? [];
    const options = attrs.options ?? [];
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const calm = useReducedMotion();
    const [own, setOwn] = useState(null); // null until the student touches it
    const [active, setActive] = useState(null);
    const [result, setResult] = useState(null);
    const [tries, setTries] = useState(0);

    const saved = progress?.lastAnswer?.picks;
    const picks = own ?? (Array.isArray(saved) && saved.length === blanks.length ? saved : blanks.map(() => null));
    const done = !!result?.passed;
    const target = active ?? (picks.indexOf(null) >= 0 ? picks.indexOf(null) : null);
    const filled = picks.filter(Boolean).length;
    const slotOf = new Map(blanks.map((b, k) => [b, k]));

    const change = (next, nextActive) => {
        setResult(null);
        setOwn(next);
        setActive(nextActive);
    };
    const choose = (token) => {
        if (target === null) return;
        const next = picks.map((p, k) => (k === target ? token : p));
        const after = next.findIndex((p, k) => p === null && k > target);
        change(next, after >= 0 ? after : next.indexOf(null) >= 0 ? next.indexOf(null) : null);
    };
    const tapSlot = (k) => {
        if (picks[k]) change(picks.map((p, j) => (j === k ? null : p)), k);
        else setActive(active === k ? null : k);
    };

    const check = async () => {
        const r = await submit({ picks });
        if (!r) return;
        setResult(r);
        setTries((t) => t + 1);
        setActive(null);
        if (r.passed) celebrate();
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <div role="list" aria-label="The pattern" className="flex flex-wrap items-center gap-2 rounded-koru-lg bg-koru-surface-container-low p-3 sm:gap-3">
                {tokens.map((token, i) => {
                    const k = slotOf.get(i);
                    if (k === undefined) {
                        return (
                            <span key={i} role="listitem" className="flex h-16 w-16 items-center justify-center">
                                <Token value={token} size={52} />
                            </span>
                        );
                    }
                    const pick = picks[k];
                    const mark = result?.details?.perBlank?.[k];
                    return (
                        <span key={i} role="listitem">
                            <button
                                key={`${k}-${tries}`}
                                type="button"
                                disabled={busy || done}
                                aria-label={pick ? `Gap ${k + 1}: ${tokenLabel(pick)}. Tap to take it out.` : `Gap ${k + 1}: empty${target === k ? ", ready to fill" : ""}`}
                                aria-pressed={target === k}
                                onClick={() => tapSlot(k)}
                                className={cn(
                                    "relative flex h-16 w-16 items-center justify-center rounded-koru-lg border-2 transition-colors",
                                    focusRing,
                                    done ? "cursor-default" : "cursor-pointer",
                                    pick ? "border-solid bg-koru-surface-container-lowest shadow-koru-xs" : "border-dashed border-koru-outline bg-koru-surface",
                                    pick && mark === undefined && "border-koru-outline-variant",
                                    target === k && !done && "border-koru-primary bg-koru-primary-subtle ring-4 ring-koru-primary/20",
                                    mark === true && "border-koru-success bg-koru-success-soft",
                                    mark === false && "border-koru-error bg-koru-error-container",
                                    mark === true && !calm && "koru-pop",
                                    mark === false && !calm && "koru-shake",
                                )}
                                style={mark === true ? { animationDelay: `${k * 60}ms` } : undefined}
                            >
                                {pick ? <Token value={pick} size={48} /> : <span className="text-koru-title font-bold text-koru-on-surface-variant">{k + 1}</span>}
                            </button>
                        </span>
                    );
                })}
            </div>
            <div className="flex flex-col gap-2">
                <p className="text-koru-caption text-koru-on-surface-variant">
                    {done ? "All done!" : target === null ? "Tap a gap to change it." : `Tap a shape to put it in gap ${target + 1}.`}
                </p>
                <div role="group" aria-label="Choices" className="flex flex-wrap gap-2 sm:gap-3">
                    {options.map((token) => (
                        <button
                            key={token}
                            type="button"
                            disabled={busy || done || target === null}
                            aria-label={`Put ${tokenLabel(token)} in the gap`}
                            onClick={() => choose(token)}
                            className={cn(
                                "flex h-16 w-16 cursor-pointer items-center justify-center rounded-koru-lg bg-koru-surface-container-lowest shadow-koru-sm transition-[transform,box-shadow] duration-150",
                                "hover:shadow-koru-md motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95",
                                "disabled:cursor-default disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0",
                                focusRing,
                            )}
                        >
                            <Token value={token} size={46} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={check} loading={busy} disabled={filled < blanks.length || !blanks.length || done}>Check my answer</Button>
                <span className="text-koru-caption text-koru-on-surface-variant">{filled} of {blanks.length} gaps filled</span>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const PatternBlock = makeActivityBlock({
    name: "patternBlock",
    label: "Complete the pattern",
    icon: <Shapes size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "What comes next? Fill in the gaps." },
        tokens: jsonAttribute("tokens", ["circle:red", "square:blue", "circle:red", "square:blue", "circle:red", "square:blue"]),
        blanks: jsonAttribute("blanks", [4, 5]),
        distractors: jsonAttribute("distractors", ["triangle:green"]),
        // Filled in by the server for students: the right answers and the distractors, shuffled.
        options: jsonAttribute("options", null),
    },
    Author,
    Play,
});
