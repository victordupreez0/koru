import React, { useMemo, useState } from "react";
import { CircuitBoard } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { makeActivityBlock } from "./activity";
import { evaluate, parseLogic, truthTable, variables } from "./logicExpr";
import "./LogicBlock.css";
import Prose from "./Prose";

const PRESETS = ["A AND B", "A OR B", "NOT A", "A XOR B", "NOT (A AND B)", "(A AND B) OR C", "(A OR B) AND NOT C"];

// Diagram geometry, in viewBox units.
const ROW = 64;
const PAD = 22;
const COL = 120;
const IN_X = 26;
const WIRE_X = 42;
const FIRST_GATE = WIRE_X + 74;
const GATE_W = 56;
const HALF = 22;
const PIN = 11;
const INVERTED = new Set(["not", "nand", "nor"]);

const ON = "var(--color-koru-success)";
const OFF = "var(--color-koru-outline-variant)";

const tryParse = (text) => {
    try {
        return { ast: parseLogic(text), error: "" };
    } catch (err) {
        return { ast: null, error: err.message };
    }
};

const kids = (n) => (n.type === "var" ? [] : n.type === "not" ? [n.arg] : [n.left, n.right]);
const leafCount = (n) => (n.type === "var" ? 1 : kids(n).reduce((s, k) => s + leafCount(k), 0));
const gateDepth = (n) => (n.type === "var" ? 0 : 1 + Math.max(...kids(n).map(gateDepth)));

/**
 * Lays the circuit out left to right: inputs, then gates by distance from the output, then the lamp.
 * Every letter in the expression gets its own lane, so wires run straight past the gates they skip.
 */
function layoutCircuit(ast) {
    const vars = variables(ast);
    const leaves = leafCount(ast);
    const height = PAD * 2 + leaves * ROW;
    const columns = gateDepth(ast);
    const inputY = Object.fromEntries(vars.map((v, k) => [v, PAD + ((k + 0.5) * leaves * ROW) / vars.length]));
    const gates = [];
    const wires = [];
    let slot = 0;

    const place = (node, depth) => {
        if (node.type === "var") {
            const y = PAD + (slot++ + 0.5) * ROW;
            return { y, from: [WIRE_X, inputY[node.name]], leaf: true, node };
        }
        const x0 = FIRST_GATE + (columns - 1 - depth) * COL;
        const parts = kids(node).map((k) => place(k, depth + 1));
        const cy = parts.reduce((s, p) => s + p.y, 0) / parts.length;
        const inset = node.type === "xor" ? 12 : node.type === "not" ? 4 : 8;
        parts.forEach((p, i) => {
            const pin = [x0 + inset, parts.length === 1 ? cy : cy + (i === 0 ? -PIN : PIN)];
            wires.push({ source: p.node, d: p.leaf ? leafWire(p.from, p.y, pin) : curve(p.from, pin) });
        });
        gates.push({ node, x0, cy });
        const out = x0 + GATE_W + (node.type !== "not" && INVERTED.has(node.type) ? 9 : 0);
        return { y: cy, from: [out, cy], node };
    };

    const root = place(ast, 0);
    const lampX = (gates.length ? root.from[0] : WIRE_X + 40) + 56;
    const lampY = root.y;
    wires.push({ source: ast, d: root.leaf ? leafWire(root.from, root.y, [lampX - 18, lampY]) : curve(root.from, [lampX - 18, lampY]) });
    return { vars, inputY, gates, wires, lampX, lampY, width: lampX + 34, height };
}

function curve([x1, y1], [x2, y2]) {
    const dx = Math.max(16, (x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** From an input to a gate: bend into the letter's lane, run along it, bend into the pin. */
function leafWire([x1, y1], lane, [x2, y2]) {
    const bendEnd = x1 + 40;
    if (x2 - bendEnd < 36) return curve([x1, y1], [x2, y2]);
    return `M ${x1} ${y1} C ${x1 + 20} ${y1}, ${x1 + 20} ${lane}, ${bendEnd} ${lane} H ${x2 - 26} C ${x2 - 12} ${lane}, ${x2 - 12} ${y2}, ${x2} ${y2}`;
}

function gateBody(type, x0, cy) {
    const top = cy - HALF;
    const bottom = cy + HALF;
    const shield = (x) => `M ${x} ${top} Q ${x + 32} ${top} ${x0 + GATE_W} ${cy} Q ${x + 32} ${bottom} ${x} ${bottom} Q ${x + 14} ${cy} ${x} ${top} Z`;
    switch (type) {
        case "and":
        case "nand":
            return `M ${x0} ${top} H ${x0 + GATE_W - HALF} A ${HALF} ${HALF} 0 0 1 ${x0 + GATE_W - HALF} ${bottom} H ${x0} Z`;
        case "or":
        case "nor":
            return shield(x0);
        case "xor":
            return shield(x0 + 6);
        default:
            return `M ${x0} ${top + 2} L ${x0 + GATE_W - 8} ${cy} L ${x0} ${bottom - 2} Z`;
    }
}

function Gate({ node, x0, cy, on, inputsOn }) {
    const stroke = on ? ON : "var(--color-koru-outline)";
    const bubbleX = node.type === "not" ? x0 + GATE_W - 4 : x0 + GATE_W + 4;
    const labelX = node.type === "not" ? x0 + 17 : node.type === "xor" ? x0 + 27 : x0 + 23;
    return (
        <g className={cn(on && "koru-logic-on")}>
            {node.type === "xor" ? (
                <path d={`M ${x0} ${cy - HALF} Q ${x0 + 14} ${cy} ${x0} ${cy + HALF}`} fill="none" stroke={inputsOn ? ON : "var(--color-koru-outline)"} strokeWidth={2} strokeLinecap="round" className="koru-logic-gate" />
            ) : null}
            <path
                d={gateBody(node.type, x0, cy)}
                fill={on ? "var(--color-koru-success-soft)" : "var(--color-koru-surface-container-lowest)"}
                stroke={stroke}
                strokeWidth={on ? 2.5 : 2}
                strokeLinejoin="round"
                className="koru-logic-gate"
            />
            {INVERTED.has(node.type) ? (
                <circle cx={bubbleX} cy={cy} r={4} fill="var(--color-koru-surface-container-lowest)" stroke={stroke} strokeWidth={on ? 2.5 : 2} className="koru-logic-gate" />
            ) : null}
            <text x={labelX} y={cy + 3.5} textAnchor="middle" fontSize={node.type === "not" ? 9 : 10} fontWeight={600} letterSpacing="0.04em" fill={on ? "var(--color-koru-success)" : "var(--color-koru-on-surface-variant)"} style={{ pointerEvents: "none" }}>
                {node.type.toUpperCase()}
            </text>
        </g>
    );
}

/** The circuit drawn from the expression, every wire coloured by the signal it carries. */
function Circuit({ ast, env, onToggle, label }) {
    const layout = useMemo(() => layoutCircuit(ast), [ast]);
    const value = (node) => evaluate(node, env);
    const output = value(ast);
    const { lampX, lampY } = layout;

    return (
        <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width="100%"
            role="img"
            aria-label={`${label}. The output is ${output ? "on" : "off"}.`}
            className="block h-auto"
            style={{ maxWidth: layout.width * 1.6, maxHeight: Math.max(260, layout.height * 1.6) }}
        >
            {layout.wires.map((w, i) => {
                const on = value(w.source);
                return (
                    <g key={i}>
                        <path d={w.d} fill="none" stroke={on ? ON : OFF} strokeWidth={on ? 3.5 : 2.5} strokeLinecap="round" className={cn("koru-logic-wire", on && "koru-logic-on")} />
                        {on ? <path d={w.d} fill="none" stroke="var(--color-koru-success-soft)" strokeWidth={1.5} strokeLinecap="round" className="koru-logic-flow" /> : null}
                    </g>
                );
            })}
            {layout.gates.map((g, i) => (
                <Gate key={i} {...g} on={value(g.node)} inputsOn={kids(g.node).some(value)} />
            ))}
            {layout.vars.map((v) => {
                const on = Boolean(env[v]);
                const y = layout.inputY[v];
                return (
                    <g key={v} onClick={() => onToggle?.(v)} style={{ cursor: onToggle ? "pointer" : undefined }} aria-hidden="true">
                        <circle cx={IN_X} cy={y} r={15} fill={on ? ON : "var(--color-koru-surface-container-high)"} stroke={on ? ON : "var(--color-koru-outline)"} strokeWidth={2} className={cn("koru-logic-input", on && "koru-logic-on")} />
                        <text x={IN_X} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={on ? "var(--color-koru-on-primary)" : "var(--color-koru-on-surface)"} style={{ pointerEvents: "none" }}>{v}</text>
                    </g>
                );
            })}
            <g aria-hidden="true">
                <g className="koru-logic-rays" style={{ opacity: output ? 1 : 0, transform: output ? "scale(1)" : "scale(0.7)" }}>
                    {Array.from({ length: 8 }, (_, k) => {
                        const a = (k * Math.PI) / 4;
                        return <line key={k} x1={lampX + Math.cos(a) * 22} y1={lampY + Math.sin(a) * 22} x2={lampX + Math.cos(a) * 28} y2={lampY + Math.sin(a) * 28} stroke="var(--color-koru-accent)" strokeWidth={2.5} strokeLinecap="round" />;
                    })}
                </g>
                <circle cx={lampX} cy={lampY} r={18} fill={output ? "var(--color-koru-accent)" : "var(--color-koru-surface-container-high)"} stroke={output ? "var(--color-koru-accent-hover)" : "var(--color-koru-outline)"} strokeWidth={2} className={cn("koru-logic-lamp", output && "koru-logic-lamp-on")} />
                <text x={lampX} y={lampY + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={output ? "var(--color-koru-ink)" : "var(--color-koru-on-surface-variant)"}>{output ? 1 : 0}</text>
            </g>
        </svg>
    );
}

function Switch({ name, on, onToggle }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={`Input ${name}`}
            onClick={onToggle}
            className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-koru-pill py-1.5 pl-3 pr-1.5 text-koru-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2",
                on ? "bg-koru-success-soft text-koru-success" : "bg-koru-surface-container-high text-koru-on-surface",
            )}
        >
            <span className="w-3 font-bold">{name}</span>
            <span className={cn("relative h-6 w-11 rounded-koru-pill transition-colors", on ? "bg-koru-success" : "bg-koru-outline-variant")}>
                <span className="koru-logic-knob absolute left-0.5 top-0.5 h-5 w-5 rounded-koru-pill bg-koru-surface-container-lowest shadow-koru-xs" style={{ transform: on ? "translateX(20px)" : "none" }} />
            </span>
            <span className="w-3 text-center font-mono text-xs">{on ? 1 : 0}</span>
        </button>
    );
}

function TruthTable({ ast, env, onPick }) {
    const { vars, rows } = useMemo(() => truthTable(ast), [ast]);
    return (
        <div className="overflow-x-auto">
            <table className="mx-auto border-separate border-spacing-0 text-center text-koru-label">
                <caption className="mb-2 text-koru-caption text-koru-on-surface-variant">Truth table. Click a row to set the switches.</caption>
                <thead>
                    <tr>
                        {vars.map((v) => <th key={v} scope="col" className="px-4 py-1.5 font-semibold text-koru-on-surface-variant">{v}</th>)}
                        <th scope="col" className="border-l border-koru-outline-variant px-4 py-1.5 font-semibold text-koru-on-surface-variant">Output</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, r) => {
                        const current = vars.every((v) => row.env[v] === Boolean(env[v]));
                        const pick = () => onPick(row.env);
                        return (
                            <tr
                                key={r}
                                tabIndex={0}
                                aria-current={current || undefined}
                                aria-label={`${vars.map((v) => `${v} ${row.env[v] ? 1 : 0}`).join(", ")}, output ${row.output ? 1 : 0}`}
                                onClick={pick}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
                                }}
                                className={cn(
                                    "cursor-pointer font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-koru-focus",
                                    current ? "bg-koru-primary-container text-koru-on-primary-container" : "hover:bg-koru-surface-container-high",
                                )}
                            >
                                {vars.map((v, k) => (
                                    <td key={v} className={cn("px-4 py-1.5", k === 0 && "rounded-l-koru-sm")}>{row.env[v] ? 1 : 0}</td>
                                ))}
                                <td className="rounded-r-koru-sm border-l border-koru-outline-variant px-4 py-1.5">
                                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-koru-pill font-bold", row.output ? "bg-koru-success text-koru-on-primary" : "text-koru-on-surface-variant")}>{row.output ? 1 : 0}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/** Switches, circuit and truth table, all driven by the same inputs. */
function Explorer({ ast, showTable, expression }) {
    const [env, setEnv] = useState({});
    const vars = useMemo(() => variables(ast), [ast]);
    const toggle = (v) => setEnv((e) => ({ ...e, [v]: !e[v] }));
    const output = evaluate(ast, env);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Inputs" className="flex flex-wrap gap-2">
                    {vars.map((v) => <Switch key={v} name={v} on={Boolean(env[v])} onToggle={() => toggle(v)} />)}
                </div>
                <span
                    aria-live="polite"
                    className={cn(
                        "rounded-koru-pill px-3 py-1.5 font-mono text-koru-label transition-colors",
                        output ? "bg-koru-accent-soft text-koru-accent-ink" : "bg-koru-surface-container-high text-koru-on-surface-variant",
                    )}
                >
                    Output: {output ? "1 (on)" : "0 (off)"}
                </span>
            </div>
            <div className="flex justify-center rounded-koru-md bg-koru-surface-container-low p-3">
                <Circuit ast={ast} env={env} onToggle={toggle} label={`Circuit for ${expression}`} />
            </div>
            {showTable ? <TruthTable ast={ast} env={env} onPick={setEnv} /> : null}
        </div>
    );
}

function Author({ attrs, update }) {
    const { prompt, expression, showTable } = attrs;
    const { ast, error } = useMemo(() => tryParse(expression), [expression]);

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Flip the switches. When does the lamp light up?" value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <Input
                size="sm"
                label="Expression"
                value={expression}
                onChange={(e) => update({ expression: e.target.value })}
                error={error || undefined}
                hint="Use AND, OR, NOT, XOR, NAND, NOR and brackets, with up to 4 letters."
                className="font-mono"
            />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example expressions">
                {PRESETS.map((p) => (
                    <Button key={p} size="sm" variant={p === expression ? "tonal" : "outlined"} aria-pressed={p === expression} onClick={() => update({ expression: p })} className="font-mono">{p}</Button>
                ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                <input type="checkbox" checked={showTable} onChange={(e) => update({ showTable: e.target.checked })} className="h-4 w-4 accent-koru-primary" />
                Show the truth table
            </label>
            {ast ? (
                <div>
                    <p className="mb-2 text-koru-caption text-koru-on-surface-variant">Preview. Students can flip the switches to try every input.</p>
                    <Explorer key={expression} ast={ast} showTable={showTable} expression={expression} />
                </div>
            ) : null}
        </>
    );
}

function Play({ attrs }) {
    const { prompt, expression, showTable } = attrs;
    const { ast } = useMemo(() => tryParse(expression), [expression]);

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            {ast ? (
                <Explorer key={expression} ast={ast} showTable={showTable} expression={expression} />
            ) : (
                <Alert variant="warning">This circuit has a typo in it, so it can't be drawn yet.</Alert>
            )}
        </>
    );
}

export const LogicBlock = makeActivityBlock({
    name: "logicBlock",
    label: "Logic gates",
    icon: <CircuitBoard size={15} aria-hidden="true" />,
    marked: false,
    attributes: {
        prompt: { default: "" },
        expression: { default: "A AND B" },
        showTable: { default: true },
    },
    Author,
    Play,
});

/** The two views, exported for tests. */
export { Author as LogicAuthor, Play as LogicPlay };
