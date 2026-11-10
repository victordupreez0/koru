import React, { useRef, useState } from "react";
import { Pencil, Plus, Table2, X } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const MAX_COLS = 8;
const MAX_ROWS = 20;
const key = (r, c) => `${r},${c}`;

const cellLook = (mark) =>
    mark === true ? "koru-pop border-koru-success bg-koru-success-soft" : mark === false ? "koru-shake border-koru-error bg-koru-danger-soft" : "border-koru-primary bg-koru-surface-container-lowest";

function Author({ attrs, update }) {
    const { prompt, headers, rows, answers, caseSensitive } = attrs;
    const cols = headers.length;
    const isAnswer = (r, c) => answers.some(([ar, ac]) => ar === r && ac === c);

    const setHeader = (c, value) => update({ headers: headers.map((h, j) => (j === c ? value : h)) });
    const setCell = (r, c, value) => update({ rows: rows.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)) });
    const toggleAnswer = (r, c) =>
        update({ answers: isAnswer(r, c) ? answers.filter(([ar, ac]) => ar !== r || ac !== c) : [...answers, [r, c]] });

    const addColumn = () => update({ headers: [...headers, ""], rows: rows.map((row) => [...row, ""]) });
    const removeColumn = (c) =>
        update({
            headers: headers.filter((_, j) => j !== c),
            rows: rows.map((row) => row.filter((_, j) => j !== c)),
            answers: answers.filter(([, ac]) => ac !== c).map(([ar, ac]) => [ar, ac > c ? ac - 1 : ac]),
        });
    const addRow = () => update({ rows: [...rows, headers.map(() => "")] });
    const removeRow = (r) =>
        update({
            rows: rows.filter((_, i) => i !== r),
            answers: answers.filter(([ar]) => ar !== r).map(([ar, ac]) => [ar > r ? ar - 1 : ar, ac]),
        });

    const field = "h-9 w-full min-w-16 rounded-koru-xs bg-transparent px-2 text-center font-mono text-sm text-koru-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus";

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Complete the table." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <p className="text-koru-caption text-koru-on-surface-variant">Type the full, correct table. Then click the pencil on each cell students must work out.</p>
            <div className="overflow-x-auto">
                <table className="border-separate border-spacing-1">
                    <thead>
                        <tr>
                            {headers.map((h, c) => (
                                <th key={c} className="p-0 align-bottom">
                                    <div className="flex items-center gap-0.5 rounded-koru-xs bg-koru-surface-container-high">
                                        <input aria-label={`Heading ${c + 1}`} value={h} onChange={(e) => setHeader(c, e.target.value)} className={cn(field, "font-semibold")} />
                                        {cols > 1 ? (
                                            <button type="button" aria-label={`Remove column ${c + 1}`} onClick={() => removeColumn(c)} className="shrink-0 rounded-koru-xs p-1 text-koru-on-surface-variant hover:text-koru-error">
                                                <X size={14} aria-hidden="true" />
                                            </button>
                                        ) : null}
                                    </div>
                                </th>
                            ))}
                            <th className="p-0">
                                {cols < MAX_COLS ? (
                                    <Button size="icon" variant="text" aria-label="Add a column" onClick={addColumn}><Plus size={16} aria-hidden="true" /></Button>
                                ) : null}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, r) => (
                            <tr key={r}>
                                {row.map((value, c) => {
                                    const answer = isAnswer(r, c);
                                    return (
                                        <td key={c} className="p-0">
                                            <div className={cn("flex items-center gap-0.5 rounded-koru-xs border", answer ? "border-koru-primary bg-koru-primary-container" : "border-koru-outline-variant bg-koru-surface-container-lowest")}>
                                                <input aria-label={`Row ${r + 1}, ${headers[c] || `column ${c + 1}`}`} value={value} onChange={(e) => setCell(r, c, e.target.value)} className={field} />
                                                <button
                                                    type="button"
                                                    aria-pressed={answer}
                                                    aria-label={`Students fill in row ${r + 1}, column ${c + 1}`}
                                                    title="Students fill this in"
                                                    onClick={() => toggleAnswer(r, c)}
                                                    className={cn("shrink-0 rounded-koru-xs p-1", answer ? "text-koru-primary" : "text-koru-on-surface-variant opacity-50 hover:opacity-100")}
                                                >
                                                    <Pencil size={13} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="p-0">
                                    {rows.length > 1 ? (
                                        <button type="button" aria-label={`Remove row ${r + 1}`} onClick={() => removeRow(r)} className="rounded-koru-xs p-1 text-koru-on-surface-variant hover:text-koru-error">
                                            <X size={14} aria-hidden="true" />
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {rows.length < MAX_ROWS ? <Button size="sm" variant="tonal" onClick={addRow}><Plus size={14} aria-hidden="true" />Add a row</Button> : null}
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                    <input type="checkbox" checked={!!caseSensitive} onChange={(e) => update({ caseSensitive: e.target.checked })} className="h-4 w-4 accent-koru-primary" />
                    Capital letters matter
                </label>
                <span className="text-koru-caption text-koru-on-surface-variant">
                    {answers.length === 1 ? "1 cell for students" : `${answers.length} cells for students`}
                </span>
            </div>
        </>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, headers, rows, answers } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [typed, setTyped] = useState(null);
    const [result, setResult] = useState(null);
    const [marks, setMarks] = useState({});
    const inputs = useRef({});

    const order = answers.map(([r, c]) => key(r, c)).sort((a, b) => {
        const [ar, ac] = a.split(",").map(Number);
        const [br, bc] = b.split(",").map(Number);
        return ar - br || ac - bc;
    });
    const open = new Set(order);
    const values = typed ?? progress?.lastAnswer?.cells ?? {};
    const done = busy || result?.passed;
    const ready = order.length > 0 && order.every((k) => values[k]?.trim());

    const set = (k, value) => {
        setTyped({ ...values, [k]: value });
        setMarks((m) => ({ ...m, [k]: null }));
    };

    const focus = (k) => {
        const el = inputs.current[k];
        if (!el) return false;
        el.focus();
        el.select();
        return true;
    };

    // Enter goes to the next cell to fill in; the arrows go to the nearest one that way.
    const onKeyDown = (e, r, c) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const next = order[order.indexOf(key(r, c)) + (e.shiftKey ? -1 : 1)];
            if (next) focus(next);
            return;
        }
        const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        if (!step) return;
        const el = e.currentTarget;
        if (step[1] === -1 && el.selectionStart > 0) return;
        if (step[1] === 1 && el.selectionEnd < el.value.length) return;
        for (let nr = r + step[0], nc = c + step[1]; nr >= 0 && nr < rows.length && nc >= 0 && nc < headers.length; nr += step[0], nc += step[1]) {
            if (open.has(key(nr, nc)) && focus(key(nr, nc))) {
                e.preventDefault();
                return;
            }
        }
    };

    const check = async () => {
        const cells = Object.fromEntries(order.map((k) => [k, values[k] ?? ""]));
        const r = await submit({ cells });
        if (!r) return;
        setResult(r);
        setMarks(r.details?.perCell ?? {});
        if (r.passed) celebrate();
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <div className="overflow-x-auto rounded-koru-md border border-koru-outline-variant">
                <table className="w-full border-collapse text-center font-mono text-sm text-koru-on-surface">
                    <thead className="bg-koru-surface-container-high">
                        <tr>
                            {headers.map((h, c) => (
                                <th key={c} scope="col" className="border-b border-koru-outline-variant px-3 py-2.5 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, r) => (
                            <tr key={r} className="even:bg-koru-surface-container-low">
                                {row.map((value, c) => {
                                    const k = key(r, c);
                                    return (
                                        <td key={c} className="border-t border-koru-outline-faint px-2 py-1.5">
                                            {open.has(k) ? (
                                                <input
                                                    ref={(el) => { inputs.current[k] = el; }}
                                                    aria-label={`Row ${r + 1}, ${headers[c] || `column ${c + 1}`}`}
                                                    value={values[k] ?? ""}
                                                    disabled={done}
                                                    autoComplete="off"
                                                    autoCapitalize="off"
                                                    spellCheck={false}
                                                    onChange={(e) => set(k, e.target.value)}
                                                    onKeyDown={(e) => onKeyDown(e, r, c)}
                                                    className={cn(
                                                        "h-10 w-full min-w-14 rounded-koru-sm border-2 border-dashed px-2 text-center font-mono text-sm text-koru-on-surface transition-colors focus:border-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                                        marks[k] != null && "border-solid",
                                                        cellLook(marks[k] ?? null),
                                                    )}
                                                />
                                            ) : (
                                                <span className="block px-1 py-2 whitespace-pre">{value}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={check} loading={busy} disabled={!ready || result?.passed}>Check my answers</Button>
                {!done ? <span className="text-koru-caption text-koru-on-surface-variant">Press Enter to go to the next box.</span> : null}
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const FillTableBlock = makeActivityBlock({
    name: "fillTableBlock",
    label: "Fill in the table",
    icon: <Table2 size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "" },
        headers: jsonAttribute("headers", ["A", "B", "A AND B"]),
        rows: jsonAttribute("rows", [["0", "0", "0"], ["0", "1", "0"], ["1", "0", "0"], ["1", "1", "1"]]),
        answers: jsonAttribute("answers", [[0, 2], [1, 2], [2, 2], [3, 2]]),
        caseSensitive: { default: false },
    },
    Author,
    Play,
});
