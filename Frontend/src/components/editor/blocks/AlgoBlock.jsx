import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { BarChart3, Pause, Play as PlayIcon, RotateCcw, Search, Shuffle, StepBack, StepForward, Undo2 } from "lucide-react";
import { Alert, Button, Input, Select } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { ALGORITHMS, buildSteps } from "./algoSteps";
import Prose from "./Prose";

const SPEEDS = [
    { value: "slow", label: "Slow", ms: 1500 },
    { value: "normal", label: "Normal", ms: 850 },
    { value: "fast", label: "Fast", ms: 380 },
];
const LIST_HELP = "Type 3 to 12 whole numbers from 1 to 99, separated by commas.";
const TARGET_HELP = "Pick a whole number from 1 to 99.";
const SLIDE = { type: "spring", stiffness: 520, damping: 40 };

const isNumber = (v) => Number.isInteger(v) && v >= 1 && v <= 99;
const validList = (list) => Array.isArray(list) && list.length >= 3 && list.length <= 12 && list.every(isNumber);

function parseNumbers(text) {
    const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.every((p) => /^\d+$/.test(p))) return null;
    const list = parts.map(Number);
    return validList(list) ? list : null;
}

function randomList(length, kind, target) {
    const list = Array.from({ length }, () => 1 + Math.floor(Math.random() * 99));
    if (kind === "search" && Math.random() < 0.75) list[Math.floor(Math.random() * length)] = target;
    return list;
}

function Bars({ frame, reduce }) {
    const max = Math.max(...frame.array);
    return (
        <div>
            <div className="flex h-56 items-end justify-center gap-1.5 sm:gap-2">
                {frame.array.map((v, i) => {
                    const active = frame.compare.includes(i);
                    const tone = active && frame.swapped
                        ? "bg-koru-primary shadow-koru-sm"
                        : active
                            ? "bg-koru-warning shadow-koru-sm"
                            : frame.sorted.includes(i)
                                ? "bg-koru-success"
                                : "bg-koru-primary-container";
                    return (
                        <Motion.div key={frame.ids[i]} layout={!reduce} transition={SLIDE} className="flex h-full min-w-0 max-w-14 flex-1 flex-col items-center justify-end gap-1">
                            <span className={cn("text-xs font-bold tabular-nums sm:text-sm", active ? "text-koru-on-surface" : "text-koru-on-surface-variant")}>{v}</span>
                            <div
                                className={cn("w-full rounded-t-koru-sm transition-[background-color,height,box-shadow] duration-300 ease-koru-out", tone)}
                                style={{ height: `${Math.max(6, (v / max) * 88)}%` }}
                            />
                        </Motion.div>
                    );
                })}
            </div>
            <div className="mt-1 flex justify-center gap-1.5 border-t border-koru-outline-variant pt-1 sm:gap-2">
                {frame.array.map((_, i) => (
                    <span key={i} className="min-w-0 max-w-14 flex-1 text-center text-[11px] tabular-nums text-koru-on-surface-variant">{i + 1}</span>
                ))}
            </div>
        </div>
    );
}

function Boxes({ frame, reduce, binary }) {
    const n = frame.array.length;
    const grid = { gridTemplateColumns: `repeat(${n}, minmax(0, 3.5rem))` };
    const outside = (i) => frame.range && (i < frame.range[0] || i > frame.range[1]);
    const tags = (i) => (binary && frame.range
        ? [i === frame.range[0] && "low", i === frame.mid && "mid", i === frame.range[1] && "high"].filter(Boolean)
        : []);

    return (
        <div className="flex flex-col items-center gap-1 py-4">
            <div className="grid justify-center gap-1.5 sm:gap-2" style={grid} aria-hidden="true">
                {frame.array.map((_, i) => <span key={i} className="text-center text-[11px] tabular-nums text-koru-on-surface-variant">{i + 1}</span>)}
            </div>
            <div className="grid justify-center gap-1.5 sm:gap-2" style={grid}>
                {frame.array.map((v, i) => {
                    const found = frame.found === i;
                    const checking = frame.compare.includes(i) && !found;
                    return (
                        <Motion.div
                            key={frame.ids[i]}
                            layout={!reduce}
                            transition={SLIDE}
                            className={cn(
                                "flex aspect-square items-center justify-center rounded-koru-md text-base font-bold tabular-nums transition-[background-color,color,opacity,box-shadow] duration-300 ease-koru-out sm:text-xl",
                                found
                                    ? "koru-pop bg-koru-success text-koru-on-primary shadow-koru-md"
                                    : checking
                                        ? "bg-koru-warning-soft text-koru-warning ring-2 ring-koru-warning"
                                        : outside(i)
                                            ? "bg-koru-surface-container text-koru-on-surface-variant opacity-35"
                                            : "bg-koru-surface-container-high text-koru-on-surface ring-1 ring-inset ring-koru-outline-variant",
                            )}
                        >
                            {v}
                        </Motion.div>
                    );
                })}
            </div>
            {binary ? (
                <div className="grid min-h-8 justify-center gap-1.5 sm:gap-2" style={grid} aria-hidden="true">
                    {frame.array.map((_, i) => (
                        <span key={i} className="flex flex-col items-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-koru-primary">
                            {tags(i).map((t) => <span key={t}>{t}</span>)}
                        </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function Pseudocode({ lines, current }) {
    return (
        <ol aria-label="Pseudocode" className="flex flex-col gap-0.5 rounded-koru-md bg-koru-surface-container-low p-2 font-mono text-xs leading-relaxed">
            {lines.map((line, i) => (
                <li
                    key={i}
                    aria-current={i === current ? "step" : undefined}
                    className={cn(
                        "flex gap-2 whitespace-pre rounded-koru-xs border-l-2 px-2 py-0.5 transition-colors duration-200",
                        i === current ? "border-koru-primary bg-koru-primary-container text-koru-on-primary-container" : "border-transparent text-koru-on-surface-variant",
                    )}
                >
                    <span className="w-4 shrink-0 select-none text-right opacity-50">{i + 1}</span>
                    <span className="overflow-hidden text-ellipsis">{line}</span>
                </li>
            ))}
        </ol>
    );
}

function Animation({ algorithm, list, target, shuffled, onShuffle, onOriginal }) {
    const info = ALGORITHMS[algorithm] ?? ALGORITHMS.bubble;
    const search = info.kind === "search";
    const steps = useMemo(() => buildSteps(algorithm, list, target), [algorithm, list, target]);
    const reduce = useReducedMotion();
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState("normal");
    const last = steps.length - 1;
    const running = playing && index < last;
    const frame = steps[Math.min(index, last)];
    const delay = SPEEDS.find((s) => s.value === speed).ms;

    useEffect(() => {
        if (!running) return undefined;
        const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), delay);
        return () => clearTimeout(timer);
    }, [running, index, delay, last]);

    const go = (i) => {
        setPlaying(false);
        setIndex(Math.max(0, Math.min(last, i)));
    };
    const togglePlay = () => {
        if (running) return setPlaying(false);
        if (index >= last) setIndex(0);
        setPlaying(true);
    };
    const finished = index === last;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
                <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-koru-label text-koru-on-surface">{info.label}</span>
                        {search ? (
                            <span className="flex items-center gap-1.5 rounded-koru-pill bg-koru-primary-container px-3 py-1 text-koru-label text-koru-on-primary-container">
                                <Search size={13} aria-hidden="true" /> Looking for {target}
                            </span>
                        ) : null}
                    </div>
                    <div className="rounded-koru-md bg-koru-surface-container-lowest px-2 py-3 ring-1 ring-inset ring-koru-outline-faint">
                        {search ? <Boxes frame={frame} reduce={reduce} binary={algorithm === "binary"} /> : <Bars frame={frame} reduce={reduce} />}
                    </div>
                    <p
                        aria-live="polite"
                        className={cn(
                            "min-h-12 rounded-koru-md px-3 py-2 text-koru-body transition-colors",
                            finished ? "bg-koru-success-soft text-koru-success" : "bg-koru-surface-container text-koru-on-surface",
                        )}
                    >
                        {frame.note}
                    </p>
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                    <Pseudocode lines={info.pseudocode} current={frame.line} />
                    <dl className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-koru-md bg-koru-surface-container-low px-2 py-2">
                            <dt className="text-koru-caption text-koru-on-surface-variant">{search ? "Checks" : "Comparisons"}</dt>
                            <dd className="text-koru-heading tabular-nums text-koru-on-surface">{frame.comparisons}</dd>
                        </div>
                        <div className="rounded-koru-md bg-koru-surface-container-low px-2 py-2">
                            <dt className="text-koru-caption text-koru-on-surface-variant">{search ? "Numbers" : "Swaps"}</dt>
                            <dd className="text-koru-heading tabular-nums text-koru-on-surface">{search ? list.length : frame.swaps}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-koru-md bg-koru-surface-container-low p-3">
                <div className="flex items-center gap-3">
                    <span className="shrink-0 text-koru-caption tabular-nums text-koru-on-surface-variant">Step {index + 1} of {steps.length}</span>
                    <input
                        type="range"
                        min={0}
                        max={last}
                        value={index}
                        onChange={(e) => go(Number(e.target.value))}
                        aria-label="Choose a step"
                        className="h-1.5 w-full cursor-pointer accent-koru-primary"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="icon" variant="text" aria-label="Restart" onClick={() => go(0)}><RotateCcw size={16} aria-hidden="true" /></Button>
                    <Button size="icon" variant="text" aria-label="Step back" onClick={() => go(index - 1)} disabled={index === 0}><StepBack size={16} aria-hidden="true" /></Button>
                    <Button size="md" onClick={togglePlay} startIcon={running ? <Pause size={16} aria-hidden="true" /> : <PlayIcon size={16} aria-hidden="true" />} className="min-w-28">
                        {running ? "Pause" : finished ? "Play again" : "Play"}
                    </Button>
                    <Button size="icon" variant="text" aria-label="Step forward" onClick={() => go(index + 1)} disabled={finished}><StepForward size={16} aria-hidden="true" /></Button>
                    <span role="group" aria-label="Speed" className="flex rounded-koru-pill bg-koru-surface-container-high p-0.5">
                        {SPEEDS.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                aria-pressed={speed === s.value}
                                onClick={() => setSpeed(s.value)}
                                className={cn(
                                    "cursor-pointer rounded-koru-pill px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                    speed === s.value ? "bg-koru-surface text-koru-primary shadow-koru-xs" : "text-koru-on-surface-variant hover:text-koru-on-surface",
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </span>
                    <span className="ml-auto flex gap-1">
                        {shuffled ? <Button size="sm" variant="text" startIcon={<Undo2 size={14} aria-hidden="true" />} onClick={onOriginal}>Original list</Button> : null}
                        <Button size="sm" variant="tonal" startIcon={<Shuffle size={14} aria-hidden="true" />} onClick={onShuffle}>Shuffle</Button>
                    </span>
                </div>
            </div>
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, algorithm, data, target } = attrs;
    const [listText, setListText] = useState(() => (Array.isArray(data) ? data.join(", ") : ""));
    const [targetText, setTargetText] = useState(String(target ?? ""));
    const search = ALGORITHMS[algorithm]?.kind === "search";
    const listOk = parseNumbers(listText) !== null;
    const targetOk = /^\d+$/.test(targetText.trim()) && isNumber(Number(targetText));

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Watch how the list gets sorted. Count the swaps." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div className="flex flex-wrap items-start gap-3">
                <Select size="sm" label="Algorithm" value={algorithm} onChange={(e) => update({ algorithm: e.target.value })} containerClassName="w-48">
                    {Object.entries(ALGORITHMS).map(([id, a]) => <option key={id} value={id}>{a.label}</option>)}
                </Select>
                <Input
                    size="sm"
                    label="Numbers"
                    value={listText}
                    onChange={(e) => {
                        setListText(e.target.value);
                        const list = parseNumbers(e.target.value);
                        if (list) update({ data: list });
                    }}
                    error={listOk ? undefined : LIST_HELP}
                    hint={listOk ? "Separate the numbers with commas." : undefined}
                    containerClassName="min-w-56 flex-1"
                    className="font-mono"
                />
                {search ? (
                    <Input
                        size="sm"
                        label="Look for"
                        inputMode="numeric"
                        value={targetText}
                        onChange={(e) => {
                            setTargetText(e.target.value);
                            const value = Number(e.target.value);
                            if (/^\d+$/.test(e.target.value.trim()) && isNumber(value)) update({ target: value });
                        }}
                        error={targetOk ? undefined : TARGET_HELP}
                        containerClassName="w-32"
                    />
                ) : null}
            </div>
            {search && targetOk && listOk && !data.includes(target) ? (
                <p className="text-koru-caption text-koru-on-surface-variant">{target} is not in the list, so students will see the search come up empty.</p>
            ) : null}
        </>
    );
}

function Play({ attrs }) {
    const { prompt, algorithm, data, target } = attrs;
    const [shuffled, setShuffled] = useState(null);
    const kind = ALGORITHMS[algorithm]?.kind ?? "sort";
    const list = shuffled ?? data;

    if (!validList(data)) return <Alert variant="warning">This animation needs 3 to 12 numbers from 1 to 99.</Alert>;
    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <Animation
                key={`${algorithm}:${list.join(",")}:${target}`}
                algorithm={algorithm}
                list={list}
                target={target}
                shuffled={shuffled !== null}
                onShuffle={() => setShuffled(randomList(data.length, kind, target))}
                onOriginal={() => setShuffled(null)}
            />
        </>
    );
}

export const AlgoBlock = makeActivityBlock({
    name: "algoBlock",
    label: "Algorithm animation",
    icon: <BarChart3 size={15} aria-hidden="true" />,
    marked: false,
    attributes: {
        prompt: { default: "" },
        algorithm: { default: "bubble" },
        data: jsonAttribute("data", [5, 2, 8, 1, 9, 3]),
        target: { default: 8 },
    },
    Author,
    Play,
});

/** The two views, exported for tests. */
export { Author as AlgoAuthor, Play as AlgoPlay };
