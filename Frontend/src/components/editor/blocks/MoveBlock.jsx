import React, { useState } from "react";
import { Reorder } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bot, Flag, GripVertical, Play as PlayIcon, RotateCcw, X, Blocks, Code2 } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import BlockShell from "./BlockShell";
import { celebrate, makeInteractiveBlock, useBlockAttempt } from "./interactive";
import { DIRECTIONS, commandsToText, newCommand, textToCommands } from "./moveProgram";

const MAX_SIZE = 10;
const STEP_MS = 260;
const clampSize = (value) => Math.min(MAX_SIZE, Math.max(2, Number(value) || 2));
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const ICONS = { right: ArrowRight, left: ArrowLeft, up: ArrowUp, down: ArrowDown };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The board. The player is one element that slides between squares, so moves animate on their own. */
function Board({ rows, cols, start, target, obstacles, player, onCell }) {
    const isObstacle = (cell) => obstacles.some((o) => same(o, cell));
    const shown = player ?? start;

    return (
        <div className="relative w-full" style={{ maxWidth: cols * 72 }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {Array.from({ length: rows * cols }, (_, i) => {
                    const cell = [Math.floor(i / cols), i % cols];
                    const blocked = isObstacle(cell);
                    const goal = same(cell, target);
                    const name = `Row ${cell[0] + 1}, column ${cell[1] + 1}${blocked ? ", wall" : goal ? ", target" : ""}`;
                    const className = cn(
                        "flex aspect-square items-center justify-center rounded-koru-xs",
                        blocked ? "bg-koru-inverse-surface" : goal ? "bg-koru-success-soft text-koru-success" : "bg-koru-surface-container-high",
                    );
                    return onCell ? (
                        <button key={i} type="button" aria-label={name} onClick={() => onCell(cell)} className={cn(className, "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus")}>
                            {goal ? <Flag size={16} aria-hidden="true" /> : null}
                        </button>
                    ) : (
                        <div key={i} className={className} aria-label={name} role="img">
                            {goal ? <Flag size={16} aria-hidden="true" /> : null}
                        </div>
                    );
                })}
            </div>
            <div
                data-testid="move-player"
                data-row={shown[0]}
                data-col={shown[1]}
                className="pointer-events-none absolute left-0 top-0 p-0.5 transition-transform duration-200 ease-koru-out"
                style={{ width: `${100 / cols}%`, height: `${100 / rows}%`, transform: `translate(${shown[1] * 100}%, ${shown[0] * 100}%)` }}
            >
                <div className="flex h-full w-full items-center justify-center rounded-koru-sm bg-koru-primary text-koru-on-primary shadow-koru-sm">
                    <Bot size={18} aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, rows, cols, start, target, obstacles } = attrs;
    const [tool, setTool] = useState("wall");

    const inside = (c, r = rows, cl = cols) => c[0] < r && c[1] < cl;
    const resize = (nextRows, nextCols) => update({
        rows: nextRows,
        cols: nextCols,
        start: inside(start, nextRows, nextCols) ? start : [0, 0],
        target: inside(target, nextRows, nextCols) ? target : [nextRows - 1, nextCols - 1],
        obstacles: obstacles.filter((o) => inside(o, nextRows, nextCols)),
    });

    const paint = (cell) => {
        const without = obstacles.filter((o) => !same(o, cell));
        if (tool === "start" && !same(cell, target)) update({ start: cell, obstacles: without });
        else if (tool === "target" && !same(cell, start)) update({ target: cell, obstacles: without });
        else if (tool === "wall" && !same(cell, start) && !same(cell, target)) {
            update({ obstacles: without.length === obstacles.length ? [...obstacles, cell] : without });
        }
    };

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Help the robot reach the flag" value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-wrap items-end gap-3">
                <Input size="sm" type="number" min={2} max={MAX_SIZE} label="Rows" value={rows} onChange={(e) => resize(clampSize(e.target.value), cols)} containerClassName="w-24" />
                <Input size="sm" type="number" min={2} max={MAX_SIZE} label="Columns" value={cols} onChange={(e) => resize(rows, clampSize(e.target.value))} containerClassName="w-24" />
                <div role="group" aria-label="What clicking a square places" className="flex gap-1">
                    {[["start", "Start"], ["target", "Target"], ["wall", "Wall"]].map(([value, label]) => (
                        <Button key={value} size="sm" variant={tool === value ? "tonal" : "text"} aria-pressed={tool === value} onClick={() => setTool(value)}>{label}</Button>
                    ))}
                </div>
            </div>
            <Board rows={rows} cols={cols} start={start} target={target} obstacles={obstacles} onCell={paint} />
        </>
    );
}

function CommandList({ commands, setCommands, disabled, activeIndex }) {
    const change = (id, patch) => setCommands(commands.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const add = (dir) => setCommands([...commands, newCommand(dir)]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
                {DIRECTIONS.map((dir) => {
                    const Icon = ICONS[dir];
                    return (
                        <Button
                            key={dir}
                            variant="tonal"
                            size="sm"
                            disabled={disabled}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("koru/direction", dir)}
                            onClick={() => add(dir)}
                            startIcon={<Icon size={13} />}
                        >
                            {dir}
                        </Button>
                    );
                })}
            </div>
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    const dir = e.dataTransfer.getData("koru/direction");
                    if (dir) { e.preventDefault(); add(dir); }
                }}
                className="min-h-24 rounded-koru-md bg-koru-surface-container-low p-2"
            >
                {commands.length === 0 ? (
                    <p className="p-3 text-center text-koru-caption text-koru-on-surface-variant">Click or drag commands here</p>
                ) : (
                    <Reorder.Group axis="y" values={commands} onReorder={setCommands} className="flex flex-col gap-1.5">
                        {commands.map((c, i) => (
                            <Reorder.Item key={c.id} value={c} dragListener={!disabled} data-command={c.dir}
                                className={cn("flex items-center gap-2 rounded-koru-sm bg-koru-surface-container-lowest px-2 py-1 shadow-koru-xs", i === activeIndex && "ring-2 ring-koru-primary")}
                            >
                                <GripVertical size={14} aria-hidden="true" className="cursor-grab text-koru-outline" />
                                <span className="text-koru-label text-koru-on-surface">move {c.dir}</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={c.count}
                                    disabled={disabled}
                                    aria-label={`Squares to move ${c.dir}`}
                                    onChange={(e) => change(c.id, { count: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
                                    className="w-14 rounded-koru-xs bg-koru-surface-container px-2 py-1 text-koru-label outline-none focus:ring-1 focus:ring-koru-primary"
                                />
                                <button type="button" disabled={disabled} aria-label="Remove command" onClick={() => setCommands(commands.filter((x) => x.id !== c.id))} className="ml-auto cursor-pointer rounded-koru-xs p-1 text-koru-on-surface-variant hover:bg-koru-surface-container-high">
                                    <X size={14} aria-hidden="true" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>
        </div>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, rows, cols, start, target, obstacles } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [mode, setMode] = useState("blocks");
    const [draft, setDraft] = useState(null); // null until the student changes anything
    const [player, setPlayer] = useState(null);
    const [running, setRunning] = useState(false);
    const [activeLine, setActiveLine] = useState(null);
    const [result, setResult] = useState(null);
    const [skipped, setSkipped] = useState(0);

    const text = draft ?? progress?.lastAnswer?.program ?? "";
    const [commands, setCommandsState] = useState(null);
    const list = commands ?? textToCommands(text).commands;

    const clearRun = () => {
        setPlayer(null);
        setResult(null);
        setActiveLine(null);
    };
    const setCommands = (next) => {
        setCommandsState(next);
        setDraft(commandsToText(next));
        clearRun();
    };
    const switchMode = (next) => {
        if (next === "blocks") {
            const parsed = textToCommands(text);
            setCommandsState(parsed.commands);
            setSkipped(parsed.skipped);
        } else {
            setSkipped(0);
        }
        setMode(next);
    };

    const run = async () => {
        clearRun();
        setRunning(true);
        try {
            const r = await submit({ program: text });
            if (!r) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const trace = r.details?.trace ?? [];
            for (const [row, col, line] of reduced ? trace.slice(-1) : trace) {
                setPlayer([row, col]);
                setActiveLine(line);
                await wait(STEP_MS);
            }
            setActiveLine(r.details?.line ?? null);
            setResult(r);
            if (r.passed) celebrate();
        } finally {
            setRunning(false);
        }
    };

    // Which command card is running: non-empty lines of the program in order.
    const lines = text.split("\n");
    const activeIndex = activeLine ? lines.slice(0, activeLine).filter((l) => l.trim() && !/^(#|\/\/)/.test(l.trim())).length - 1 : -1;
    const hitWall = result && ["wall", "obstacle"].includes(result.details?.status);

    return (
        <BlockShell icon={<Bot size={16} aria-hidden="true" />} label="Move the block" blockId={blockId} progress={progress}>
            {prompt ? <p className="text-koru-body text-koru-on-surface">{prompt}</p> : null}
            <div className="grid gap-5 md:grid-cols-2">
                <div className={cn(hitWall && "koru-shake")}>
                    <Board rows={rows} cols={cols} start={start} target={target} obstacles={obstacles} player={player} />
                </div>
                <div className="flex flex-col gap-3">
                    <div role="group" aria-label="How to write your program" className="flex gap-1">
                        <Button size="sm" variant={mode === "blocks" ? "tonal" : "text"} aria-pressed={mode === "blocks"} startIcon={<Blocks size={13} />} onClick={() => switchMode("blocks")}>Blocks</Button>
                        <Button size="sm" variant={mode === "code" ? "tonal" : "text"} aria-pressed={mode === "code"} startIcon={<Code2 size={13} />} onClick={() => switchMode("code")}>Code</Button>
                    </div>
                    {mode === "blocks" ? (
                        <CommandList commands={list} setCommands={setCommands} disabled={running} activeIndex={running || result ? activeIndex : -1} />
                    ) : (
                        <textarea
                            value={text}
                            disabled={running}
                            spellCheck={false}
                            rows={6}
                            aria-label="Your program"
                            placeholder={"move right 3\nmove up 2"}
                            onChange={(e) => { setDraft(e.target.value); setCommandsState(null); clearRun(); }}
                            className="w-full resize-y rounded-koru-md bg-koru-inverse-surface p-3 font-mono text-sm text-koru-inverse-on-surface outline-none focus:ring-2 focus:ring-koru-primary"
                        />
                    )}
                    {skipped > 0 ? <p className="text-koru-caption text-koru-warning">{skipped} line{skipped === 1 ? "" : "s"} couldn't be shown as blocks.</p> : null}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={run} loading={running || busy} disabled={!text.trim()} startIcon={<PlayIcon size={13} />}>Run</Button>
                        <Button size="sm" variant="text" disabled={running} onClick={clearRun} startIcon={<RotateCcw size={13} />}>Reset</Button>
                    </div>
                </div>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </BlockShell>
    );
}

function MoveView({ node, updateAttributes, editor }) {
    if (!editor.isEditable) return <Play attrs={node.attrs} />;
    return (
        <BlockShell icon={<Bot size={16} aria-hidden="true" />} label="Move the block" blockId={node.attrs.blockId}>
            <Author attrs={node.attrs} update={updateAttributes} />
        </BlockShell>
    );
}

export const MoveBlock = makeInteractiveBlock("moveBlock", {
    prompt: { default: "" },
    rows: { default: 5 },
    cols: { default: 5 },
    start: jsonAttribute("start", [4, 0]),
    target: jsonAttribute("target", [0, 4]),
    obstacles: jsonAttribute("obstacles", []),
}, MoveView);
