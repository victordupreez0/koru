// Runs Python in a worker, so a learner's endless loop can be stopped without freezing the page.
import { RUNNER, TURTLE_MODULE } from "./pythonSource";

let ready = null;

function load(base) {
    ready ??= (async () => {
        const { loadPyodide } = await import(/* @vite-ignore */ `${base}pyodide.mjs`);
        const pyodide = await loadPyodide({ indexURL: base });
        pyodide.FS.writeFile("/home/pyodide/turtle.py", TURTLE_MODULE);
        pyodide.runPython(RUNNER);
        return pyodide.globals.get("_koru_run");
    })();
    return ready;
}

self.onmessage = async ({ data }) => {
    const { id, base, code, stdin } = data;
    try {
        const run = await load(base);
        if (code === undefined) return self.postMessage({ id, loaded: true });
        self.postMessage({ id, ...JSON.parse(run(code, stdin ?? "")) });
    } catch (err) {
        self.postMessage({ id, stdout: "", turtle: [], error: { message: `Python couldn't start: ${err.message ?? err}`, line: null } });
    }
};
