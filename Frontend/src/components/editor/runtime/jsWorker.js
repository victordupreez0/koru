// Runs JavaScript (typed or generated from blocks) and Pascal off the main thread, so an
// endless loop can be stopped by ending the worker.
import { runJs } from "./jsRun";
import { runPascal } from "./pascal";

self.onmessage = ({ data }) => {
    const { id, language, code, stdin } = data;
    const result = language === "pascal" ? { turtle: [], ...runPascal(code, { stdin: stdin ?? "" }) } : runJs(code, stdin ?? "");
    self.postMessage({ id, ...result });
};
