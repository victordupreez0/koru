// Runs a learner's code in the browser. Every language answers in the same shape:
//   { stdout, error: null | { message, line }, turtle: drawing commands, tables?: SQL results }
// Nothing here marks anything: the server compares the output with the answer it keeps.

const TOO_SLOW = "Your program ran for too long and was stopped. Check your loops: one of them may never end.";
const RUN_MS = { python: 10000, other: 5000 };
const PYTHON_START_MS = 120000;

const failed = (message) => ({ stdout: "", turtle: [], error: { message, line: null } });

/** One worker, replaced when it has to be stopped. */
function workerPool(create) {
    let worker = null;
    let nextId = 0;
    return function send(message, ms, onTimeout = TOO_SLOW) {
        worker ??= create();
        const target = worker;
        const id = ++nextId;
        return new Promise((resolve) => {
            const finish = (value, stop) => {
                clearTimeout(timer);
                target.removeEventListener("message", onMessage);
                target.removeEventListener("error", onError);
                if (stop) {
                    target.terminate();
                    if (worker === target) worker = null;
                }
                resolve(value);
            };
            const onMessage = ({ data }) => { if (data.id === id) finish(data, false); };
            const onError = (event) => finish(failed(`The code runner stopped working: ${event.message ?? "unknown error"}`), true);
            const timer = setTimeout(() => finish(failed(onTimeout), true), ms);
            target.addEventListener("message", onMessage);
            target.addEventListener("error", onError);
            target.postMessage({ ...message, id });
        });
    };
}

const python = workerPool(() => new Worker(new URL("./pythonWorker.js", import.meta.url), { type: "module" }));
const script = workerPool(() => new Worker(new URL("./jsWorker.js", import.meta.url), { type: "module" }));

async function runPython(code, stdin) {
    const base = new URL("pyodide/", document.baseURI).href;
    // Starting Python is slow the first time, so it gets its own, longer, time limit.
    const started = await python({ base }, PYTHON_START_MS, "Python took too long to start. Check your connection and try again.");
    if (started.error) return started;
    return python({ base, code, stdin }, RUN_MS.python);
}

/**
 * @param {{ language: string, code: string, stdin?: string, setup?: string, ordered?: boolean }} job
 */
export async function runCode({ language, code, stdin = "", setup = "", ordered = false }) {
    try {
        if (language === "python") return await runPython(code, stdin);
        if (language === "sql") return await (await import("./sqlRunner")).runSql(code, setup, ordered);
        if (language === "blocks") {
            const { blocksToCode } = await import("./blocksCode");
            return await script({ language: "javascript", code: blocksToCode(code), stdin }, RUN_MS.other);
        }
        return await script({ language, code, stdin }, RUN_MS.other);
    } catch (err) {
        return failed(`The code couldn't be run: ${err.message}`);
    }
}

/** What gets compared when marking: everything printed, with any error on the end so a crash never matches. */
export const outputOf = (run) =>
    run.error ? `${run.stdout}${run.stdout && !run.stdout.endsWith("\n") ? "\n" : ""}Error: ${run.error.message}` : run.stdout;

/** Appends a test's extra code to the learner's program. Block programs are JavaScript by the time they run. */
async function withAppend(language, code, append) {
    if (!append) return { language, code };
    if (language !== "blocks") return { language, code: `${code}\n${append}` };
    const { blocksToCode } = await import("./blocksCode");
    return { language: "javascript", code: `${blocksToCode(code)}\n${append}` };
}

/** Runs the code once per test and returns each run. */
export async function runTests({ language, tests, setup, ordered }, code) {
    const runs = [];
    for (const test of tests) {
        const job = await withAppend(language, code, test.append);
        runs.push(await runCode({ ...job, stdin: test.stdin ?? "", setup, ordered }));
    }
    return runs;
}
