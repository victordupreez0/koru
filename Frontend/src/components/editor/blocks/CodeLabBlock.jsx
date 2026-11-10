import React, { Suspense, lazy, useEffect, useState } from "react";
import { Check, ChevronDown, Code2, EyeOff, FlaskConical, Play as PlayIcon, Plus, RotateCcw, Trash2, Wand2, X } from "lucide-react";
import { Alert, Badge, Button, Card, Input, Select, Skeleton } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { celebrate, useBlockAttempt } from "./interactive";
import Prose from "./Prose";

// The editors and runtimes are big, so they load only when a page has code on it.
const CodeEditor = lazy(() => import("./CodeEditor"));
const BlocksEditor = lazy(() => import("./BlocksEditor"));
const TurtleCanvas = lazy(() => import("./TurtleCanvas"));
const runtime = () => import("../runtime");

const LANGUAGES = {
    python: { label: "Python", starter: 'print("Hello, world!")\n', input: /\binput\s*\(/ },
    blocks: { label: "Blocks", starter: "" },
    pascal: { label: "Delphi (Pascal)", starter: "begin\n  WriteLn('Hello, world!');\nend.\n", input: /\bread(ln)?\b/i },
    javascript: { label: "JavaScript", starter: 'console.log("Hello, world!");\n', input: /\b(prompt|input)\s*\(/ },
    sql: { label: "SQL", starter: "SELECT * FROM learners;\n" },
    web: { label: "Web page", starter: "<h1>Hello, world!</h1>\n<p>Change me.</p>\n\n<style>\n  h1 { color: rebeccapurple; }\n</style>\n" },
};
const TOOLBOX_LABELS = { say: "Say and ask", draw: "Draw", loops: "Repeat", logic: "Decide", math: "Numbers", text: "Words", variables: "Variables", lists: "Lists", functions: "My blocks" };

const blankTest = () => ({ name: "", stdin: "", append: "", expected: "", hidden: false });
const draws = (run) => run?.turtle?.some((c) => ["line", "dot", "fill", "text"].includes(c[0]));
const fieldClass = "w-full resize-y rounded-koru-md bg-koru-surface-container-low px-3 py-2 font-mono text-sm text-koru-on-surface outline-none ring-1 ring-inset ring-koru-outline-variant focus:ring-2 focus:ring-koru-primary";
const labelClass = "mb-1 block text-koru-caption font-medium text-koru-on-surface-variant";

function Editor({ language, value, onChange, toolbox, label, minHeight }) {
    return (
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            {language === "blocks"
                ? <BlocksEditor value={value} onChange={onChange} toolbox={toolbox} />
                : <CodeEditor value={value} onChange={onChange} language={language} label={label} minHeight={minHeight} />}
        </Suspense>
    );
}

/** What a run printed, drew or returned. */
function Output({ run, language }) {
    if (!run) return null;
    const nothing = !run.stdout && !run.error && !draws(run) && !(run.tables?.length);
    return (
        <div className={cn("grid gap-4", draws(run) && (run.stdout || run.error) && "md:grid-cols-2")}>
            <div className="flex min-w-0 flex-col gap-2">
                {language === "sql" && !run.error ? (
                    run.tables.length === 0 ? <p className="text-koru-caption text-koru-on-surface-variant">Done. That query gave back no rows.</p> : run.tables.map((table, i) => <ResultTable key={i} table={table} />)
                ) : run.stdout ? (
                    <div role="log" aria-label="What the program printed" className="max-h-72 overflow-auto whitespace-pre-wrap rounded-koru-md bg-koru-surface-container-low p-3 font-mono text-sm text-koru-on-surface">{run.stdout}</div>
                ) : null}
                {nothing ? <p className="text-koru-caption text-koru-on-surface-variant">The program ran, but it didn't print anything.</p> : null}
                {run.error ? (
                    <Alert variant="error" title={run.error.line ? `Problem on line ${run.error.line}` : "Something went wrong"}>
                        <span className="whitespace-pre-wrap font-mono text-sm">{run.error.message}</span>
                    </Alert>
                ) : null}
            </div>
            {draws(run) ? <Suspense fallback={<Skeleton className="aspect-square w-full" />}><TurtleCanvas commands={run.turtle} /></Suspense> : null}
        </div>
    );
}

function ResultTable({ table }) {
    return (
        <div className="max-h-72 overflow-auto rounded-koru-md ring-1 ring-inset ring-koru-outline-variant">
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-koru-surface-container">
                    <tr>{table.columns.map((c, i) => <th key={i} className="px-3 py-1.5 text-left font-medium text-koru-on-surface">{c}</th>)}</tr>
                </thead>
                <tbody>
                    {table.values.map((row, r) => (
                        <tr key={r} className="border-t border-koru-outline-faint">
                            {row.map((value, c) => <td key={c} className="px-3 py-1.5 font-mono text-koru-on-surface">{value === null ? <span className="text-koru-outline">NULL</span> : String(value)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** The list of tests with a tick or cross after a check. Expected output is only known for tests that aren't hidden. */
function TestList({ tests, runs, perTest }) {
    return (
        <ul className="flex flex-col gap-1.5">
            {tests.map((test, i) => {
                const ok = perTest?.[i];
                const got = runs?.[i];
                return (
                    <li key={i} className={cn("rounded-koru-sm px-3 py-2 text-koru-label", ok === undefined ? "bg-koru-surface-container-low text-koru-on-surface" : ok ? "bg-koru-success-soft text-koru-success" : "bg-koru-error-container text-koru-on-error-container")}>
                        <span className="flex items-center gap-2">
                            {ok === undefined ? <FlaskConical size={14} aria-hidden="true" /> : ok ? <Check size={14} aria-label="Passed" /> : <X size={14} aria-label="Not yet" />}
                            <span>{test.name || `Test ${i + 1}`}</span>
                            {test.hidden ? <span className="flex items-center gap-1 text-koru-caption opacity-80"><EyeOff size={11} aria-hidden="true" /> hidden</span> : null}
                        </span>
                        {ok === false && got ? (
                            <span className="mt-2 grid gap-2 text-koru-on-surface md:grid-cols-2">
                                {test.expected !== undefined ? (
                                    <span><span className={labelClass}>It should print</span><span className="block whitespace-pre-wrap rounded-koru-xs bg-koru-surface p-2 font-mono text-xs">{test.expected || "(nothing)"}</span></span>
                                ) : null}
                                <span><span className={labelClass}>Your program printed</span><span className="block whitespace-pre-wrap rounded-koru-xs bg-koru-surface p-2 font-mono text-xs">{got || "(nothing)"}</span></span>
                            </span>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}

function WebPreview({ code }) {
    // A sandboxed frame with its own origin: scripts in it can't reach Koru or the learner's account.
    return <iframe title="Your web page" sandbox="allow-scripts" srcDoc={code} className="h-full min-h-[18rem] w-full rounded-koru-md bg-white ring-1 ring-inset ring-koru-outline-variant" />;
}

function Play({ attrs }) {
    const { blockId, language, prompt, starter, tests, toolbox } = attrs;
    const marked = tests.length > 0 && language !== "web";
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [draft, setDraft] = useState(null); // null until the learner changes something
    const [stdin, setStdin] = useState("");
    const [run, setRun] = useState(null);
    const [running, setRunning] = useState(false);
    const [checked, setChecked] = useState(null); // { result, runs } from the last check
    const [python, setPython] = useState(null); // the block program shown as Python

    const code = draft ?? progress?.lastAnswer?.code ?? starter;
    const [preview, setPreview] = useState(code);
    useEffect(() => {
        if (language !== "web") return undefined;
        const timer = setTimeout(() => setPreview(code), 500);
        return () => clearTimeout(timer);
    }, [code, language]);

    const change = (next) => {
        setDraft(next);
        setChecked(null);
        setPython(null);
    };

    const execute = async () => {
        setRunning(true);
        setChecked(null);
        const { runCode } = await runtime();
        setRun(await runCode({ ...attrs, code, stdin }));
        setRunning(false);
    };

    const check = async () => {
        setRunning(true);
        setRun(null);
        const { runTests, outputOf } = await runtime();
        const runs = (await runTests(attrs, code)).map(outputOf);
        setRunning(false);
        const result = await submit({ code, outputs: runs });
        if (!result) return;
        setChecked({ result, runs });
        if (result.passed) celebrate();
    };

    const showPython = async () => {
        if (python !== null) return setPython(null);
        const { blocksToCode } = await import("../runtime/blocksCode");
        setPython(blocksToCode(code, "python") || "# Add some blocks first.");
    };

    // "Run" is for trying things out, so it gets an Input box; "Check my code" uses the tests' own input.
    const wantsInput = LANGUAGES[language]?.input?.test(code);
    const editor = <Editor language={language} value={code} onChange={change} toolbox={toolbox} label="Your code" />;

    return (
        <>
            {prompt ? <Prose text={prompt} className="whitespace-pre-line text-koru-body text-koru-on-surface" /> : null}

            {language === "web" ? (
                <div className="grid gap-3 md:grid-cols-2">{editor}<WebPreview code={preview} /></div>
            ) : editor}

            {wantsInput ? (
                <label className="block">
                    <span className={labelClass}>Input: what the program should read, one answer on each line</span>
                    <textarea rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} className={fieldClass} />
                </label>
            ) : null}

            {language !== "web" ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant={marked ? "tonal" : "filled"} onClick={execute} loading={running && !busy} disabled={running || busy} startIcon={<PlayIcon size={13} />}>Run</Button>
                    {marked ? <Button size="sm" onClick={check} loading={busy} disabled={running || busy || checked?.result.passed} startIcon={<Check size={13} />}>Check my code</Button> : null}
                    {language === "blocks" ? <Button size="sm" variant="text" onClick={showPython} startIcon={<Code2 size={13} />}>{python === null ? "Show as Python" : "Hide Python"}</Button> : null}
                    <Button size="sm" variant="text" disabled={running || code === starter} onClick={() => { change(starter); setRun(null); }} startIcon={<RotateCcw size={13} />}>Start again</Button>
                    {running && language === "python" ? <span className="text-koru-caption text-koru-on-surface-variant">The first run takes a few seconds while Python starts.</span> : null}
                </div>
            ) : null}

            {python !== null ? <div aria-label="Your blocks as Python" className="overflow-auto whitespace-pre rounded-koru-md bg-koru-inverse-surface p-3 font-mono text-sm text-koru-inverse-on-surface">{python}</div> : null}

            <Output run={run} language={language} />

            {marked ? (
                <div className="flex flex-col gap-2">
                    <span className={labelClass}>Your code passes when all of these work</span>
                    <TestList tests={tests} runs={checked?.runs} perTest={checked?.result.details?.perTest} />
                </div>
            ) : null}
            {checked ? <Alert variant={checked.result.passed ? "success" : "warning"}>{checked.result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

function TestsEditor({ attrs, update }) {
    const { language, tests, solution } = attrs;
    const [busy, setBusy] = useState(false);
    const [problem, setProblem] = useState("");
    const set = (i, patch) => update({ tests: tests.map((t, n) => (n === i ? { ...t, ...patch } : t)) });

    // Runs the model answer once per test and stores what it printed as the expected output.
    const fill = async () => {
        setBusy(true);
        setProblem("");
        const { runTests, outputOf } = await runtime();
        const runs = await runTests(attrs, solution);
        const broken = runs.find((r) => r.error);
        if (broken) setProblem(`The model answer has a problem: ${broken.error.message}`);
        else update({ tests: tests.map((t, i) => ({ ...t, expected: outputOf(runs[i]) })) });
        setBusy(false);
    };

    return (
        <div className="flex flex-col gap-3">
            {tests.length === 0 ? <p className="text-koru-caption text-koru-on-surface-variant">No tests yet, so students can run this as often as they like and it isn't marked. Add a test to mark it automatically.</p> : null}
            {tests.map((test, i) => (
                <Card key={i} tone="low" radius="md" padding="sm" className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Input size="sm" aria-label={`Test ${i + 1} name`} placeholder={`Test ${i + 1}: what it checks`} value={test.name} onChange={(e) => set(i, { name: e.target.value })} containerClassName="flex-1" />
                        <Button variant="text" size="sm" aria-label={`Remove test ${i + 1}`} onClick={() => update({ tests: tests.filter((_, n) => n !== i) })}><Trash2 size={14} aria-hidden="true" /></Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {language !== "sql" ? (
                            <label><span className={labelClass}>What gets typed in (one answer per line)</span>
                                <textarea rows={2} value={test.stdin} spellCheck={false} onChange={(e) => set(i, { stdin: e.target.value })} className={fieldClass} />
                            </label>
                        ) : null}
                        <label><span className={labelClass}>{language === "sql" ? "Query to run after the student's (optional)" : "Code to run after the student's (optional)"}</span>
                            <textarea rows={2} value={test.append} spellCheck={false} placeholder={language === "sql" ? "SELECT * FROM learners;" : language === "python" ? "print(double(4))" : ""} onChange={(e) => set(i, { append: e.target.value })} className={fieldClass} />
                        </label>
                        <label className="md:col-span-2"><span className={labelClass}>What a correct program prints</span>
                            <textarea rows={2} value={test.expected ?? ""} spellCheck={false} onChange={(e) => set(i, { expected: e.target.value })} className={fieldClass} />
                        </label>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                        <input type="checkbox" checked={!!test.hidden} onChange={(e) => set(i, { hidden: e.target.checked })} className="h-4 w-4 accent-koru-primary" />
                        Keep the expected output hidden from students
                    </label>
                </Card>
            ))}
            <div className="flex flex-wrap gap-2">
                <Button variant="tonal" size="sm" startIcon={<Plus size={13} />} onClick={() => update({ tests: [...tests, blankTest()] })}>Add a test</Button>
                {tests.length > 0 ? <Button variant="outlined" size="sm" loading={busy} disabled={!solution.trim()} startIcon={<Wand2 size={13} />} onClick={fill}>Fill in the answers from the model answer</Button> : null}
            </div>
            {problem ? <Alert variant="error">{problem}</Alert> : null}
        </div>
    );
}

function Section({ title, hint, open: startOpen = false, children }) {
    const [open, setOpen] = useState(startOpen);
    return (
        <div className="rounded-koru-md ring-1 ring-inset ring-koru-outline-faint">
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-koru-md px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus">
                <span>
                    <span className="block text-koru-label text-koru-on-surface">{title}</span>
                    {hint ? <span className="block text-koru-caption text-koru-on-surface-variant">{hint}</span> : null}
                </span>
                <ChevronDown size={16} aria-hidden="true" className={cn("shrink-0 text-koru-on-surface-variant transition-transform", open && "rotate-180")} />
            </button>
            {open ? <div className="flex flex-col gap-3 px-3 pb-3">{children}</div> : null}
        </div>
    );
}

function Author({ attrs, update }) {
    const { language, prompt, starter, setup, solution, tests, ordered, toolbox } = attrs;
    const canMark = language !== "web";

    const changeLanguage = (next) => {
        // Swap the example code only if the lecturer hasn't written their own yet.
        const untouched = !starter.trim() || starter === LANGUAGES[language].starter;
        update({ language: next, ...(untouched ? { starter: LANGUAGES[next].starter } : {}) });
    };
    const toggleToolbox = (id) => update({ toolbox: toolbox.includes(id) ? toolbox.filter((t) => t !== id) : [...toolbox, id] });

    return (
        <>
            <div className="flex flex-wrap items-end gap-3">
                <Select size="sm" label="Language" value={language} onChange={(e) => changeLanguage(e.target.value)} containerClassName="w-48">
                    {Object.entries(LANGUAGES).map(([id, l]) => <option key={id} value={id}>{l.label}</option>)}
                </Select>
                {tests.length > 0 && canMark ? <Badge variant="success" dot>Marked automatically</Badge> : <Badge variant="neutral">Free practice</Badge>}
            </div>
            <label><span className={labelClass}>Instructions for students</span>
                <textarea rows={2} value={prompt} placeholder="Write a program that…" onChange={(e) => update({ prompt: e.target.value })} className={cn(fieldClass, "font-sans")} />
            </label>

            {language === "blocks" ? (
                <div>
                    <span className={labelClass}>Which blocks may students use?</span>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(TOOLBOX_LABELS).map(([id, text]) => (
                            <Button key={id} size="sm" variant={toolbox.includes(id) ? "tonal" : "text"} aria-pressed={toolbox.includes(id)} onClick={() => toggleToolbox(id)}>{text}</Button>
                        ))}
                    </div>
                </div>
            ) : null}

            <div>
                <span className={labelClass}>{language === "blocks" ? "The blocks students start with" : "The code students start with"}</span>
                <Editor language={language} value={starter} onChange={(v) => update({ starter: v })} toolbox={toolbox} label="Starter code" />
            </div>

            {language === "sql" ? (
                <Section title="Tables and data" hint="SQL that builds the database before every run. Students don't edit it." open>
                    <Editor language="sql" value={setup} onChange={(v) => update({ setup: v })} label="Tables and data" />
                    <label className="flex cursor-pointer items-center gap-2 text-koru-label text-koru-on-surface">
                        <input type="checkbox" checked={ordered} onChange={(e) => update({ ordered: e.target.checked })} className="h-4 w-4 accent-koru-primary" />
                        The order of the rows matters (the task asks for ORDER BY)
                    </label>
                </Section>
            ) : null}

            {canMark ? (
                <>
                    <Section title="Model answer" hint="Your own solution. Students never receive it." open={tests.length > 0}>
                        <Editor language={language} value={solution} onChange={(v) => update({ solution: v })} toolbox={toolbox} label="Model answer" />
                    </Section>
                    <Section title={`Marking${tests.length ? ` (${tests.length} ${tests.length === 1 ? "test" : "tests"})` : ""}`} hint="Each test runs the student's code and compares what it prints." open={tests.length > 0}>
                        <TestsEditor attrs={attrs} update={update} />
                    </Section>
                </>
            ) : null}
        </>
    );
}

export const CodeLabBlock = makeActivityBlock({
    name: "codeLab",
    label: (attrs) => `Code: ${LANGUAGES[attrs.language]?.label ?? attrs.language}`,
    icon: <Code2 size={15} aria-hidden="true" />,
    marked: (attrs) => attrs.tests.length > 0 && attrs.language !== "web",
    attributes: {
        language: { default: "python" },
        prompt: { default: "" },
        starter: { default: LANGUAGES.python.starter },
        setup: { default: "" },
        solution: { default: "" },
        tests: jsonAttribute("tests", []),
        ordered: { default: false },
        toolbox: jsonAttribute("toolbox", ["say", "loops", "logic", "math", "variables"]),
    },
    Author,
    Play,
});
