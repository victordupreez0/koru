import React, { useState } from "react";
import { TextCursorInput } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { blankAnswers, countBlanks, splitBlanks } from "./blanksText";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

const fit = (values, n) => Array.from({ length: n }, (_, i) => (typeof values?.[i] === "string" ? values[i] : ""));

/** How a blank looks: waiting, right or wrong. Code blanks sit on the dark code surface. */
const blankLook = (mark, code) =>
    mark === true
        ? "koru-pop border-koru-success bg-koru-success-soft text-koru-on-surface"
        : mark === false
          ? "koru-shake border-koru-error bg-koru-danger-soft text-koru-on-surface"
          : code
            ? "border-koru-inverse-primary bg-koru-inverse-on-surface/10 text-koru-inverse-on-surface"
            : "border-koru-primary bg-koru-primary-subtle text-koru-on-surface";

/** The text with something rendered in place of each blank. */
function BlankText({ text, code, renderBlank }) {
    return (
        <div
            className={cn(
                "rounded-koru-md leading-[2.4]",
                code
                    ? "overflow-x-auto whitespace-pre-wrap bg-koru-inverse-surface px-5 py-4 font-mono text-sm text-koru-inverse-on-surface"
                    : "whitespace-pre-line text-koru-body text-koru-on-surface",
            )}
        >
            {splitBlanks(text).map((part, i) => (part.blank === undefined ? <span key={i}>{part.text}</span> : <React.Fragment key={i}>{renderBlank(part.blank)}</React.Fragment>))}
        </div>
    );
}

function Toggle({ checked, onChange, children }) {
    return (
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
            <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-koru-primary" />
            {children}
        </label>
    );
}

const parseWords = (raw) => raw.split(",").map((w) => w.trim()).filter(Boolean);

function Author({ attrs, update }) {
    const { prompt, text, code, bank, distractors, caseSensitive } = attrs;
    const [wrongWords, setWrongWords] = useState((distractors ?? []).join(", "));
    const count = countBlanks(text);
    const answers = blankAnswers(text);

    return (
        <>
            <Input size="sm" label="Instructions" placeholder="Fill in the missing words." value={prompt} onChange={(e) => update({ prompt: e.target.value })} />
            <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor={`blanks-${attrs.blockId}`} className="text-koru-label text-koru-on-surface-variant">Text</label>
                    <span className={cn("text-koru-caption", count ? "text-koru-on-surface-variant" : "text-koru-error")}>
                        {count === 1 ? "1 blank" : `${count} blanks`}
                    </span>
                </div>
                <textarea
                    id={`blanks-${attrs.blockId}`}
                    rows={code ? 6 : 3}
                    value={text}
                    spellCheck={!code}
                    onChange={(e) => update({ text: e.target.value })}
                    className={cn(
                        "w-full resize-y rounded-koru-sm bg-koru-surface-container-high px-3 py-2 text-koru-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                        code ? "font-mono text-sm" : "text-koru-body",
                    )}
                />
                <p className="mt-1 text-koru-caption text-koru-on-surface-variant">
                    Put each answer in double curly brackets, like: The {"{{CPU}}"} is the brain of the computer. Separate other accepted answers with | like {"{{colour|color}}"}.
                </p>
            </div>
            <div className="flex flex-wrap gap-x-5">
                <Toggle checked={code} onChange={(v) => update({ code: v })}>Show as code</Toggle>
                <Toggle checked={bank} onChange={(v) => update({ bank: v })}>Give students a word bank</Toggle>
                <Toggle checked={caseSensitive} onChange={(v) => update({ caseSensitive: v })}>Capital letters matter</Toggle>
            </div>
            {bank ? (
                <Input
                    size="sm"
                    label="Extra wrong words for the bank"
                    hint="Separate them with commas."
                    placeholder="RAM, keyboard"
                    value={wrongWords}
                    onChange={(e) => {
                        setWrongWords(e.target.value);
                        update({ distractors: parseWords(e.target.value) });
                    }}
                />
            ) : null}
            {count ? (
                <div>
                    <p className="mb-1.5 text-koru-caption text-koru-on-surface-variant">Preview</p>
                    <BlankText
                        text={text}
                        code={code}
                        renderBlank={(i) => (
                            <span className={cn("mx-0.5 inline-block rounded-koru-xs border-b-2 px-2 leading-normal", blankLook(null, code))}>
                                {answers[i]?.[0] || "?"}
                            </span>
                        )}
                    />
                </div>
            ) : null}
        </>
    );
}

function Play({ attrs }) {
    const { blockId, prompt, text, code, options } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const count = countBlanks(text);
    const [typed, setTyped] = useState(null); // null until the student changes something
    const [selected, setSelected] = useState(null); // bank mode: the slot the next word goes into
    const [result, setResult] = useState(null);
    const [marks, setMarks] = useState([]);

    const values = typed ?? fit(progress?.lastAnswer?.blanks, count);
    const bank = Array.isArray(options);
    const done = busy || result?.passed;
    const ready = count > 0 && values.every((v) => v.trim());

    const set = (i, value) => {
        setTyped(values.map((v, j) => (j === i ? value : v)));
        setMarks((m) => m.map((x, j) => (j === i ? null : x)));
    };

    // The bank shows each option once for every time it hasn't been used yet.
    const remaining = [...(options ?? [])];
    for (const v of values) {
        const at = remaining.indexOf(v);
        if (v && at >= 0) remaining.splice(at, 1);
    }

    const pickWord = (word) => {
        const target = selected ?? values.findIndex((v) => !v);
        if (target < 0) return;
        set(target, word);
        setSelected(null);
    };

    const tapSlot = (i) => {
        if (values[i]) set(i, "");
        setSelected(values[i] || selected !== i ? i : null);
    };

    const check = async () => {
        const r = await submit({ blanks: values });
        if (!r) return;
        setResult(r);
        setMarks(r.details?.perBlank ?? []);
        if (r.passed) celebrate();
    };

    const renderBlank = (i) => {
        const value = values[i];
        const look = cn("mx-0.5 rounded-koru-xs border-b-2 align-baseline leading-normal transition-colors", blankLook(marks[i] ?? null, code));
        if (!bank) {
            return (
                <input
                    aria-label={`Blank ${i + 1}`}
                    value={value}
                    disabled={done}
                    size={Math.max(4, value.length + 1)}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(e) => set(i, e.target.value)}
                    className={cn(look, "min-h-9 px-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus", code && "font-mono")}
                />
            );
        }
        return (
            <button
                type="button"
                disabled={done}
                onClick={() => tapSlot(i)}
                aria-label={value ? `Blank ${i + 1}: ${value}. Tap to take it out.` : `Blank ${i + 1}: empty`}
                aria-pressed={selected === i}
                className={cn(
                    look,
                    "inline-flex min-h-9 min-w-20 items-center justify-center px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                    !value && "border-dashed",
                    selected === i && "ring-2 ring-koru-focus",
                    !done && "cursor-pointer",
                )}
            >
                {value || <span className="opacity-0">____</span>}
            </button>
        );
    };

    return (
        <>
            {prompt ? <Prose text={prompt} className="text-koru-body text-koru-on-surface" /> : null}
            <BlankText text={text} code={code} renderBlank={renderBlank} />
            {bank ? (
                <div role="group" aria-label="Word bank" className="flex min-h-12 flex-wrap gap-2 rounded-koru-md bg-koru-surface-container-low p-2">
                    {remaining.length ? (
                        remaining.map((word, i) => (
                            <button
                                key={`${word}-${i}`}
                                type="button"
                                disabled={done}
                                onClick={() => pickWord(word)}
                                className={cn(
                                    "min-h-10 rounded-koru-pill bg-koru-surface-container-highest px-4 text-koru-label text-koru-on-surface shadow-koru-xs transition hover:bg-koru-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus active:scale-95",
                                    code && "font-mono",
                                )}
                            >
                                {word}
                            </button>
                        ))
                    ) : (
                        <span className="self-center px-2 text-koru-caption text-koru-on-surface-variant">All the words are used. Tap a blank to take its word out.</span>
                    )}
                </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={check} loading={busy} disabled={!ready || result?.passed}>Check my answers</Button>
                {bank && !done ? <span className="text-koru-caption text-koru-on-surface-variant">Tap a word to put it in the next empty blank.</span> : null}
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

export const BlanksBlock = makeActivityBlock({
    name: "blanksBlock",
    label: "Fill in the blanks",
    icon: <TextCursorInput size={15} aria-hidden="true" />,
    attributes: {
        prompt: { default: "" },
        text: { default: "The {{CPU}} is the brain of the computer. It follows the {{instructions|steps}} in a program, one at a time." },
        code: { default: false },
        bank: { default: false },
        distractors: jsonAttribute("distractors", []),
        caseSensitive: { default: false },
        // Added by the server for students when the word bank is on.
        options: jsonAttribute("options", null),
    },
    Author,
    Play,
});
