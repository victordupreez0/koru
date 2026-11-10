import React, { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Blocks, Bot, ChevronDown, ChevronUp, Code2, CornerUpLeft, CornerUpRight, Delete, Play as PlayIcon, Repeat, RotateCcw, Undo2, X } from "lucide-react";
import { Alert, Button, Input, Select } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import { DIRECTIONS, addCommand, changeCommand, countCommands, forward, move, removeCommand, repeat, shiftCommand, textToTree, treeToText, turn } from "./moveProgram";
import Prose from "./Prose";

const MAX_SIZE = 10;
const STEP_MS = 280;
const clampSize = (value) => Math.min(MAX_SIZE, Math.max(2, Number(value) || 2));
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const has = (cells, cell) => cells.some((c) => same(c, cell));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARROWS = { up: ArrowUp, right: ArrowRight, down: ArrowDown, left: ArrowLeft };

// Who is walking, where they are going, what they collect and what is in the way.
const THEMES = {
    robot: { label: "Robot", player: "🤖", goal: "🔋", star: "⭐", wall: "🧱" },
    bee: { label: "Bee", player: "🐝", goal: "🌻", star: "🌼", wall: "🪨" },
    rocket: { label: "Rocket", player: "🚀", goal: "🪐", star: "⭐", wall: "☄️" },
    taxi: { label: "Taxi", player: "🚕", goal: "🏫", star: "🧒", wall: "🚧" },
    dog: { label: "Dog", player: "🐶", goal: "🏠", star: "🦴", wall: "🌳" },
};
const MODES = {
    arrows: "Arrow taps (youngest learners)",
    blocks: "Move commands with repeats",
    turns: "Forward and turn",
};

/** The board. The player is one element that slides between squares, so moves animate on their own. */
function Board({ attrs, player, visited, onCell }) {
    const { rows, cols, start, target, obstacles, stars, theme, mode, facing } = attrs;
    const look = THEMES[theme] ?? THEMES.robot;
    const shown = player ?? { row: start[0], col: start[1], facing: DIRECTIONS.indexOf(facing) };

    return (
        <div className="relative w-full select-none" style={{ maxWidth: cols * 76 }}>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {Array.from({ length: rows * cols }, (_, i) => {
                    const cell = [Math.floor(i / cols), i % cols];
                    const blocked = has(obstacles, cell);
                    const goal = same(cell, target);
                    const star = has(stars, cell) && !visited?.has(cell.join());
                    const name = `Row ${cell[0] + 1}, column ${cell[1] + 1}${blocked ? ", blocked" : goal ? ", the target" : star ? ", something to collect" : ""}`;
                    const className = cn(
                        "flex aspect-square items-center justify-center rounded-koru-sm text-2xl leading-none md:text-3xl",
                        blocked ? "bg-koru-surface-container-highest" : goal ? "bg-koru-success-soft" : "bg-koru-surface-container-high",
                    );
                    const content = <span aria-hidden="true" className={cn(star && "koru-pop")}>{blocked ? look.wall : goal ? look.goal : star ? look.star : ""}</span>;
                    return onCell ? (
                        <button key={i} type="button" aria-label={name} onClick={() => onCell(cell)} className={cn(className, "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus")}>{content}</button>
                    ) : (
                        <div key={i} className={className} aria-label={name} role="img">{content}</div>
                    );
                })}
            </div>
            <div
                data-testid="move-player"
                data-row={shown.row}
                data-col={shown.col}
                className="pointer-events-none absolute left-0 top-0 p-1 transition-transform duration-200 ease-koru-out"
                style={{ width: `${100 / cols}%`, height: `${100 / rows}%`, transform: `translate(${shown.col * 100}%, ${shown.row * 100}%)` }}
            >
                <div className="relative flex h-full w-full items-center justify-center rounded-koru-md bg-koru-primary-container text-2xl leading-none shadow-koru-sm ring-2 ring-koru-primary md:text-3xl">
                    <span aria-hidden="true">{look.player}</span>
                    {mode === "turns" ? (
                        // A small arrow on the edge shows which way "forward" is.
                        <span aria-hidden="true" className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${shown.facing * 90}deg)` }}>
                            <span className="absolute -top-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-koru-primary text-koru-on-primary"><ArrowUp size={11} /></span>
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, rows, cols, start, target, obstacles, stars, theme, mode, facing, maxBlocks, starter } = attrs;
    const [tool, setTool] = useState("wall");
    const look = THEMES[theme] ?? THEMES.robot;

    const inside = (c, r = rows, cl = cols) => c[0] < r && c[1] < cl;
    const resize = (nextRows, nextCols) => update({
        rows: nextRows,
        cols: nextCols,
        start: inside(start, nextRows, nextCols) ? start : [0, 0],
        target: inside(target, nextRows, nextCols) ? target : [nextRows - 1, nextCols - 1],
        obstacles: obstacles.filter((o) => inside(o, nextRows, nextCols)),
        stars: stars.filter((o) => inside(o, nextRows, nextCols)),
    });

    // Each square holds one thing, so placing something clears whatever was there.
    const paint = (cell) => {
        if (same(cell, start) || same(cell, target)) {
            if (tool !== "start" && tool !== "target") return;
        }
        const walls = obstacles.filter((o) => !same(o, cell));
        const rest = stars.filter((o) => !same(o, cell));
        if (tool === "start" && !same(cell, target)) update({ start: cell, obstacles: walls, stars: rest });
        else if (tool === "target" && !same(cell, start)) update({ target: cell, obstacles: walls, stars: rest });
        else if (tool === "wall") update({ obstacles: has(obstacles, cell) ? walls : [...walls, cell], stars: rest });
        else if (tool === "star") update({ stars: has(stars, cell) ? rest : [...rest, cell], obstacles: walls });
    };

    const tools = [["start", `${look.player} Start`], ["target", `${look.goal} Target`], ["wall", `${look.wall} Blocked`], ["star", `${look.star} Collect`]];

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Help the robot reach the battery" value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-wrap items-end gap-3">
                <Select size="sm" label="Characters" value={theme} onChange={(e) => update({ theme: e.target.value })} containerClassName="w-36">
                    {Object.entries(THEMES).map(([id, t]) => <option key={id} value={id}>{t.player} {t.label}</option>)}
                </Select>
                <Select size="sm" label="How students write the program" value={mode} onChange={(e) => update({ mode: e.target.value })} containerClassName="w-64">
                    {Object.entries(MODES).map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                </Select>
                {mode === "turns" ? (
                    <Select size="sm" label="Starts facing" value={facing} onChange={(e) => update({ facing: e.target.value })} containerClassName="w-28">
                        {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </Select>
                ) : null}
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <Input size="sm" type="number" min={2} max={MAX_SIZE} label="Rows" value={rows} onChange={(e) => resize(clampSize(e.target.value), cols)} containerClassName="w-20" />
                <Input size="sm" type="number" min={2} max={MAX_SIZE} label="Columns" value={cols} onChange={(e) => resize(rows, clampSize(e.target.value))} containerClassName="w-20" />
                <Input
                    size="sm"
                    type="number"
                    min={1}
                    max={99}
                    label="Most commands allowed"
                    placeholder="No limit"
                    hint="A limit makes students use repeats."
                    value={maxBlocks ?? ""}
                    onChange={(e) => update({ maxBlocks: e.target.value === "" ? null : Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
                    containerClassName="w-52"
                />
            </div>
            <div>
                <p className="mb-2 text-koru-caption text-koru-on-surface-variant">Pick what to place, then click squares on the board.</p>
                <div role="group" aria-label="What clicking a square places" className="mb-3 flex flex-wrap gap-1">
                    {tools.map(([value, label]) => (
                        <Button key={value} size="sm" variant={tool === value ? "tonal" : "text"} aria-pressed={tool === value} onClick={() => setTool(value)}>{label}</Button>
                    ))}
                </div>
                <Board attrs={attrs} onCell={paint} />
            </div>
            <label className="block">
                <span className="mb-1 block text-koru-caption font-medium text-koru-on-surface-variant">Program students start with (optional). Put a mistake in it for a "find the bug" task.</span>
                <textarea
                    rows={3}
                    value={starter}
                    spellCheck={false}
                    placeholder={mode === "turns" ? "forward 2\nturn left" : "move right 2\nmove up 1"}
                    onChange={(e) => update({ starter: e.target.value })}
                    className="w-full resize-y rounded-koru-md bg-koru-surface-container-low px-3 py-2 font-mono text-sm text-koru-on-surface outline-none ring-1 ring-inset ring-koru-outline-variant focus:ring-2 focus:ring-koru-primary"
                />
            </label>
        </>
    );
}

/** For the youngest learners: one tap, one step. The program is a row of arrows. */
function ArrowPad({ tree, setTree, disabled, activeId }) {
    const add = (dir) => setTree([...tree, move(dir)]);
    const key = (dir, className) => {
        const Icon = ARROWS[dir];
        return (
            <button
                type="button"
                disabled={disabled}
                aria-label={`Add a step ${dir}`}
                onClick={() => add(dir)}
                className={cn("flex h-14 w-14 cursor-pointer items-center justify-center rounded-koru-md bg-koru-primary text-koru-on-primary shadow-koru-sm transition-transform hover:bg-koru-primary-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 disabled:opacity-50", className)}
            >
                <Icon size={26} aria-hidden="true" />
            </button>
        );
    };
    return (
        <div className="flex flex-col gap-4">
            <div className="grid w-fit grid-cols-3 gap-1.5 self-center">
                {key("up", "col-start-2")}
                {key("left", "col-start-1 row-start-2")}
                {key("down", "col-start-2 row-start-2")}
                {key("right", "col-start-3 row-start-2")}
            </div>
            <div className="min-h-16 rounded-koru-md bg-koru-surface-container-low p-2">
                {tree.length === 0 ? (
                    <p className="p-3 text-center text-koru-caption text-koru-on-surface-variant">Tap the arrows to build your code</p>
                ) : (
                    <ol aria-label="Your code" className="flex flex-wrap gap-1.5">
                        {tree.map((c, i) => {
                            const Icon = ARROWS[c.dir];
                            return (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        aria-label={`Step ${i + 1}: ${c.dir}. Tap to remove`}
                                        onClick={() => setTree(tree.filter((x) => x.id !== c.id))}
                                        className={cn("flex h-10 w-10 cursor-pointer items-center justify-center rounded-koru-sm bg-koru-surface-container-lowest text-koru-primary shadow-koru-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus", c.id === activeId && "bg-koru-primary text-koru-on-primary")}
                                    >
                                        <Icon size={20} aria-hidden="true" />
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="text" disabled={disabled || tree.length === 0} startIcon={<Undo2 size={13} />} onClick={() => setTree(tree.slice(0, -1))}>Undo</Button>
                <Button size="sm" variant="text" disabled={disabled || tree.length === 0} startIcon={<Delete size={13} />} onClick={() => setTree([])}>Clear</Button>
            </div>
        </div>
    );
}

const smallNumber = "w-12 rounded-koru-xs bg-koru-surface-container px-1.5 py-1 text-center text-koru-label outline-none focus:ring-1 focus:ring-koru-primary";
const iconButton = "cursor-pointer rounded-koru-xs p-1 text-koru-on-surface-variant hover:bg-koru-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus disabled:cursor-default disabled:opacity-40";

/** One level of the program. Repeats draw their own list inside themselves. */
function CommandList({ list, tree, setTree, disabled, activeId, into, setInto }) {
    const number = (c, field, max) => (
        <input
            type="number"
            min={1}
            max={max}
            value={c[field]}
            disabled={disabled}
            aria-label={field === "times" ? "How many times to repeat" : "How many squares"}
            onChange={(e) => setTree(changeCommand(tree, c.id, { [field]: Math.min(max, Math.max(1, Number(e.target.value) || 1)) }))}
            className={smallNumber}
        />
    );
    return (
        <ul className="flex flex-col gap-1.5">
            {list.map((c, i) => (
                <li key={c.id} data-command={c.kind} className={cn("rounded-koru-sm shadow-koru-xs", c.kind === "repeat" ? "bg-koru-warning-soft" : "bg-koru-surface-container-lowest", c.id === activeId && "ring-2 ring-koru-primary")}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        {c.kind === "repeat" ? <Repeat size={14} aria-hidden="true" className="text-koru-warning" /> : null}
                        <span className="text-koru-label text-koru-on-surface">{c.kind === "move" ? `move ${c.dir}` : c.kind === "turn" ? `turn ${c.dir}` : c.kind}</span>
                        {c.kind === "move" || c.kind === "forward" ? number(c, "count", 99) : null}
                        {c.kind === "repeat" ? <>{number(c, "times", 20)}<span className="text-koru-label text-koru-on-surface">times</span></> : null}
                        <span className="ml-auto flex items-center">
                            <button type="button" disabled={disabled || i === 0} aria-label="Move this command up" onClick={() => setTree(shiftCommand(tree, c.id, -1))} className={iconButton}><ChevronUp size={14} aria-hidden="true" /></button>
                            <button type="button" disabled={disabled || i === list.length - 1} aria-label="Move this command down" onClick={() => setTree(shiftCommand(tree, c.id, 1))} className={iconButton}><ChevronDown size={14} aria-hidden="true" /></button>
                            <button type="button" disabled={disabled} aria-label="Remove this command" onClick={() => { if (into === c.id) setInto(null); setTree(removeCommand(tree, c.id)); }} className={iconButton}><X size={14} aria-hidden="true" /></button>
                        </span>
                    </div>
                    {c.kind === "repeat" ? (
                        <div className="pb-2 pl-6 pr-2">
                            <CommandList list={c.body} tree={tree} setTree={setTree} disabled={disabled} activeId={activeId} into={into} setInto={setInto} />
                            <button
                                type="button"
                                disabled={disabled}
                                aria-pressed={into === c.id}
                                onClick={() => setInto(into === c.id ? null : c.id)}
                                className={cn("mt-1.5 w-full cursor-pointer rounded-koru-sm border border-dashed px-2 py-1.5 text-koru-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus", into === c.id ? "border-koru-primary bg-koru-primary-container text-koru-on-primary-container" : "border-koru-outline text-koru-on-surface-variant hover:bg-koru-surface-container-lowest")}
                            >
                                {into === c.id ? "New commands go in this repeat. Tap to stop." : "Tap here, then pick commands to put inside"}
                            </button>
                        </div>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}

function CommandBuilder({ mode, tree, setTree, disabled, activeId }) {
    const [into, setInto] = useState(null); // the repeat that new commands are added to
    const add = (command) => setTree(addCommand(tree, into, command));
    const palette = mode === "turns"
        ? [["forward", () => forward(), ArrowUp], ["turn left", () => turn("left"), CornerUpLeft], ["turn right", () => turn("right"), CornerUpRight]]
        : DIRECTIONS.map((dir) => [dir, () => move(dir), ARROWS[dir]]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
                {palette.map(([label, make, Icon]) => (
                    <Button key={label} variant="tonal" size="sm" disabled={disabled} onClick={() => add(make())} startIcon={<Icon size={13} />}>{label}</Button>
                ))}
                <Button variant="outlined" size="sm" disabled={disabled} onClick={() => { const loop = repeat(); add(loop); setInto(loop.id); }} startIcon={<Repeat size={13} />}>repeat</Button>
            </div>
            <div className="min-h-24 rounded-koru-md bg-koru-surface-container-low p-2">
                {tree.length === 0
                    ? <p className="p-3 text-center text-koru-caption text-koru-on-surface-variant">Tap a command above to add it to your program</p>
                    : <CommandList list={tree} tree={tree} setTree={setTree} disabled={disabled} activeId={activeId} into={into} setInto={setInto} />}
            </div>
        </div>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, mode, maxBlocks, starter } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [edited, setEdited] = useState(null); // the program tree, null until the student changes anything
    const [typed, setTyped] = useState(null); // the program as text while "Code" is showing
    const [player, setPlayer] = useState(null);
    const [visited, setVisited] = useState(null);
    const [running, setRunning] = useState(false);
    const [activeLine, setActiveLine] = useState(null);
    const [result, setResult] = useState(null);
    const [skipped, setSkipped] = useState(0);

    // Students carry on from their last try, or from the lecturer's starting program (handy for "find the bug").
    const tree = edited ?? textToTree(progress?.lastAnswer?.program ?? starter ?? "").tree;
    const built = treeToText(tree);
    const text = typed ?? built.text;
    const used = typed === null ? countCommands(tree) : null;

    const clearRun = () => {
        setPlayer(null);
        setVisited(null);
        setResult(null);
        setActiveLine(null);
    };
    const setTree = (next) => {
        setEdited(next);
        clearRun();
    };
    const showBlocks = () => {
        const parsed = textToTree(typed);
        setEdited(parsed.tree);
        setSkipped(parsed.skipped);
        setTyped(null);
    };

    const run = async () => {
        clearRun();
        setRunning(true);
        try {
            const r = await submit({ program: text });
            if (!r) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const trace = r.details?.trace ?? [];
            const seen = new Set();
            for (const [row, col, line, facing] of trace) {
                seen.add(`${row},${col}`);
                if (reduced) continue;
                setPlayer({ row, col, facing });
                setVisited(new Set(seen));
                setActiveLine(line);
                await wait(STEP_MS);
            }
            const last = trace.at(-1);
            if (last) setPlayer({ row: last[0], col: last[1], facing: last[3] });
            setVisited(seen);
            setActiveLine(r.details?.line ?? null);
            setResult(r);
            if (r.passed) celebrate();
        } finally {
            setRunning(false);
        }
    };

    const activeId = typed === null && activeLine ? built.commandOnLine[activeLine] : null;
    const crashed = result && ["wall", "obstacle"].includes(result.details?.status);

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <div className="grid gap-5 md:grid-cols-2">
                <div className={cn(crashed && "koru-shake")}>
                    <Board attrs={attrs} player={player} visited={visited} />
                </div>
                <div className="flex flex-col gap-3">
                    {mode === "arrows" ? (
                        <ArrowPad tree={tree} setTree={setTree} disabled={running} activeId={activeId} />
                    ) : (
                        <>
                            <div role="group" aria-label="How to write your program" className="flex gap-1">
                                <Button size="sm" variant={typed === null ? "tonal" : "text"} aria-pressed={typed === null} startIcon={<Blocks size={13} />} onClick={() => typed !== null && showBlocks()}>Blocks</Button>
                                <Button size="sm" variant={typed !== null ? "tonal" : "text"} aria-pressed={typed !== null} startIcon={<Code2 size={13} />} onClick={() => { setSkipped(0); setTyped(text); }}>Code</Button>
                            </div>
                            {typed === null ? (
                                <CommandBuilder mode={mode} tree={tree} setTree={setTree} disabled={running} activeId={activeId} />
                            ) : (
                                <textarea
                                    value={typed}
                                    disabled={running}
                                    spellCheck={false}
                                    rows={7}
                                    aria-label="Your program"
                                    placeholder={mode === "turns" ? "forward 2\nturn left\nrepeat 3\n  forward 1\nend" : "move right 3\nrepeat 2\n  move up 1\nend"}
                                    onChange={(e) => { setTyped(e.target.value); clearRun(); }}
                                    className="w-full resize-y rounded-koru-md bg-koru-inverse-surface p-3 font-mono text-sm text-koru-inverse-on-surface outline-none focus:ring-2 focus:ring-koru-primary"
                                />
                            )}
                        </>
                    )}
                    {skipped > 0 ? <p className="text-koru-caption text-koru-warning">{skipped} line{skipped === 1 ? "" : "s"} couldn't be shown as blocks.</p> : null}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={run} loading={running || busy} disabled={!text.trim()} startIcon={<PlayIcon size={13} />}>{mode === "arrows" ? "Go!" : "Run"}</Button>
                        <Button size="sm" variant="text" disabled={running} onClick={clearRun} startIcon={<RotateCcw size={13} />}>Back to start</Button>
                        {maxBlocks && used !== null ? (
                            <span className={cn("text-koru-caption", used > maxBlocks ? "text-koru-warning" : "text-koru-on-surface-variant")}>{used} of {maxBlocks} commands used</span>
                        ) : null}
                    </div>
                </div>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const MoveBlock = makeActivityBlock({
    name: "moveBlock",
    label: "Robot puzzle",
    icon: <Bot size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "" },
        rows: { default: 5 },
        cols: { default: 5 },
        start: jsonAttribute("start", [4, 0]),
        target: jsonAttribute("target", [0, 4]),
        obstacles: jsonAttribute("obstacles", []),
        stars: jsonAttribute("stars", []),
        theme: { default: "robot" },
        mode: { default: "blocks" },
        facing: { default: "right" },
        maxBlocks: { default: null },
        starter: { default: "" },
    },
    Author,
    Play,
});
