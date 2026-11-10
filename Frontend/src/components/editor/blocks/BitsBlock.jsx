import React, { useState } from "react";
import { Binary, Lightbulb } from "lucide-react";
import { Alert, Button, Input, Select } from "../../UI";
import { cn } from "../../../utils/cn";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const bitCount = (bits) => (Number(bits) === 4 ? 4 : 8);
const largest = (n) => 2 ** n - 1;
const placeValues = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const clampTarget = (value, n) => (value === null ? null : Math.min(largest(n), Math.max(0, Math.round(value))));

function Author({ attrs, update }) {
    const { prompt, bits, target } = attrs;
    const n = bitCount(bits);

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Each switch that is on adds its number to the total." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-wrap items-start gap-3">
                <Select size="sm" label="Switches" value={n} onChange={(e) => update({ bits: Number(e.target.value), target: clampTarget(target, Number(e.target.value)) })} containerClassName="w-36">
                    <option value={4}>4 (up to 15)</option>
                    <option value={8}>8 (up to 255)</option>
                </Select>
                <Input
                    size="sm"
                    type="number"
                    min={0}
                    max={largest(n)}
                    label="Number to make"
                    hint="Leave empty to just explore."
                    value={target ?? ""}
                    onChange={(e) => update({ target: e.target.value === "" ? null : clampTarget(Number(e.target.value) || 0, n) })}
                    containerClassName="w-48"
                />
            </div>
        </>
    );
}

function Switch({ value, on, onToggle, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={`Switch for ${value}`}
            disabled={disabled}
            onClick={onToggle}
            className={cn(
                "group flex min-w-0 flex-col items-center gap-2 rounded-koru-md py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                disabled ? "cursor-default" : "cursor-pointer",
            )}
        >
            <span
                className={cn(
                    "flex aspect-square w-full max-w-12 items-center justify-center rounded-koru-pill transition-all duration-300",
                    on ? "bg-koru-warning-soft text-koru-warning shadow-[0_0_22px_4px_var(--color-koru-warning)]" : "bg-koru-surface-container-high text-koru-on-surface-variant opacity-60",
                )}
            >
                <Lightbulb aria-hidden="true" className="h-3/5 w-3/5" fill={on ? "currentColor" : "none"} strokeWidth={1.75} />
            </span>
            {/* The switch itself: a tall track with a knob that slides up when on. */}
            <span className={cn("relative h-16 w-full max-w-10 rounded-koru-pill transition-colors duration-200", on ? "bg-koru-primary" : "bg-koru-surface-container-highest", !disabled && "group-hover:shadow-koru-sm")}>
                <span className={cn("absolute left-1 right-1 aspect-square rounded-koru-pill bg-koru-surface-container-lowest shadow-koru-sm transition-all duration-200", on ? "top-1" : "bottom-1")} />
            </span>
            <span className={cn("font-mono text-koru-label tabular-nums", on ? "text-koru-on-surface" : "text-koru-on-surface-variant")}>{value}</span>
        </button>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, bits, target } = attrs;
    const n = bitCount(bits);
    const values = placeValues(n);
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [picked, setPicked] = useState(null);
    const [result, setResult] = useState(null);

    const saved = progress?.lastAnswer?.bits;
    const state = picked ?? (Array.isArray(saved) && saved.length === n ? saved.map((b) => (b ? 1 : 0)) : Array(n).fill(0));
    const total = state.reduce((sum, b, i) => sum + b * values[i], 0);
    const onValues = values.filter((_, i) => state[i]);
    const goal = typeof target === "number";
    const done = busy || result?.passed;

    const toggle = (i) => {
        setResult(null);
        setPicked(state.map((b, j) => (j === i ? 1 - b : b)));
    };

    const check = async () => {
        const r = await submit({ bits: state });
        if (!r) return;
        setResult(r);
        if (r.passed) celebrate();
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            {goal ? (
                <p className="text-koru-title text-koru-on-surface">
                    Make the number <span className="font-display text-koru-primary">{target}</span>
                </p>
            ) : null}
            <div role="group" aria-label="Binary switches" className="grid w-full gap-1 sm:gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, maxWidth: n * 76 }}>
                {values.map((value, i) => (
                    <Switch key={value} value={value} on={!!state[i]} disabled={done} onToggle={() => toggle(i)} />
                ))}
            </div>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-koru-md bg-koru-surface-container-low px-4 py-3" aria-live="polite">
                <div className="min-w-0">
                    <p className="font-mono text-koru-title tracking-[0.3em] text-koru-on-surface" aria-label={`Binary ${state.join("")}`}>{state.join("")}</p>
                    <p className="text-koru-caption text-koru-on-surface-variant">
                        {onValues.length ? `${onValues.join(" + ")} = ${total}` : "All switches are off, so the total is 0"}
                    </p>
                </div>
                <p
                    key={result ? `${result.passed}-${total}` : "total"}
                    className={cn(
                        "ml-auto font-display text-koru-display tabular-nums leading-none",
                        result?.passed ? "koru-pop text-koru-success" : result ? "koru-shake text-koru-error" : "text-koru-on-surface",
                    )}
                >
                    {total}
                </p>
            </div>
            {goal ? (
                <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" onClick={check} loading={busy} disabled={result?.passed}>Check my answer</Button>
                </div>
            ) : (
                <p className="text-koru-caption text-koru-on-surface-variant">Flip the switches and watch the number change.</p>
            )}
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const BitsBlock = makeActivityBlock({
    name: "bitsBlock",
    label: "Binary switches",
    icon: <Binary size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "Each switch that is on adds its number to the total." },
        bits: { default: 8 },
        // null is free play. (It has to be the default: Tiptap reads a missing HTML attribute as the default.)
        target: { default: null },
    },
    Author,
    Play,
});
