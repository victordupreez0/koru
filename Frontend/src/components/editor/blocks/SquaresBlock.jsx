import React, { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const MAX_SIZE = 10;
const clampSize = (value) => Math.min(MAX_SIZE, Math.max(1, Number(value) || 1));

function Grid({ rows, cols, isOn, onToggle, disabled, state }) {
    return (
        <div
            role="group"
            aria-label="Grid of squares"
            className={cn("grid w-full gap-1.5", state === "wrong" && "koru-shake")}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 72 }}
        >
            {Array.from({ length: rows * cols }, (_, i) => {
                const on = isOn(i);
                return (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        aria-pressed={on}
                        aria-label={`Row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}`}
                        onClick={() => onToggle(i)}
                        className={cn(
                            "aspect-square rounded-koru-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2",
                            disabled ? "cursor-default" : "cursor-pointer",
                            on ? "bg-koru-primary" : "bg-koru-surface-container-high hover:bg-koru-primary-container",
                            on && state === "right" && "koru-pop bg-koru-success",
                        )}
                        style={state === "right" && on ? { animationDelay: `${(i % cols) * 40}ms` } : undefined}
                    />
                );
            })}
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, rows, cols, correct, exactly } = attrs;

    // Changing the grid keeps each ticked square in the same row and column.
    const resize = (nextRows, nextCols) => {
        const kept = correct
            .map((i) => [Math.floor(i / cols), i % cols])
            .filter(([r, c]) => r < nextRows && c < nextCols)
            .map(([r, c]) => r * nextCols + c);
        update({ rows: nextRows, cols: nextCols, correct: kept, exactly: exactly === null ? null : Math.min(exactly, Math.max(kept.length, 1)) });
    };

    const toggle = (i) => {
        const next = correct.includes(i) ? correct.filter((c) => c !== i) : [...correct, i];
        update({ correct: next, exactly: exactly === null ? null : Math.min(exactly, Math.max(next.length, 1)) });
    };

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Pick all the squares that…" value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-wrap items-end gap-3">
                <Input size="sm" type="number" min={1} max={MAX_SIZE} label="Rows" value={rows} onChange={(e) => resize(clampSize(e.target.value), cols)} containerClassName="w-24" />
                <Input size="sm" type="number" min={1} max={MAX_SIZE} label="Columns" value={cols} onChange={(e) => resize(rows, clampSize(e.target.value))} containerClassName="w-24" />
                <label className="flex h-10 cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                    <input
                        type="checkbox"
                        checked={exactly !== null}
                        onChange={(e) => update({ exactly: e.target.checked ? Math.max(correct.length, 1) : null })}
                        className="h-4 w-4 accent-koru-primary"
                    />
                    Students select exactly
                </label>
                {exactly !== null ? (
                    <Input size="sm" type="number" min={1} max={Math.max(correct.length, 1)} aria-label="How many squares to select" value={exactly} onChange={(e) => update({ exactly: Math.min(Math.max(correct.length, 1), Math.max(1, Number(e.target.value) || 1)) })} containerClassName="w-20" />
                ) : null}
            </div>
            <div>
                <p className="mb-2 text-koru-caption text-koru-on-surface-variant">Click the correct squares. Students never receive this answer.</p>
                <Grid rows={rows} cols={cols} isOn={(i) => correct.includes(i)} onToggle={toggle} />
            </div>
        </>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, rows, cols, exactly } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [picked, setPicked] = useState(null); // null until the student touches the grid
    const [result, setResult] = useState(null);

    const selected = picked ?? progress?.lastAnswer?.cells ?? [];
    const toggle = (i) => {
        setResult(null);
        setPicked(selected.includes(i) ? selected.filter((c) => c !== i) : [...selected, i]);
    };
    const ready = selected.length > 0 && (exactly === null || selected.length === exactly);

    const check = async () => {
        const r = await submit({ cells: selected });
        if (!r) return;
        setResult(r);
        if (r.passed) celebrate();
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <Grid rows={rows} cols={cols} isOn={(i) => selected.includes(i)} onToggle={toggle} disabled={busy || result?.passed} state={result ? (result.passed ? "right" : "wrong") : null} />
            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={check} loading={busy} disabled={!ready || result?.passed}>Check my answer</Button>
                <span className="text-koru-caption text-koru-on-surface-variant">
                    {exactly !== null ? `${selected.length} of ${exactly} selected` : `${selected.length} selected`}
                </span>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const SquaresBlock = makeActivityBlock({
    name: "squaresBlock",
    label: "Pick the right squares",
    icon: <Grid3x3 size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "" },
        rows: { default: 3 },
        cols: { default: 3 },
        correct: jsonAttribute("correct", []),
        exactly: { default: null },
    },
    Author,
    Play,
});
