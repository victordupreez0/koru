// Runs a JavaScript program and captures what it prints and draws. No DOM is needed, so this
// works in a worker (where the page uses it) and in Node (where the showcase is built).

const MAX_OUTPUT = 20000;
const MAX_TURTLE = 20000;
export const NO_INPUT = "The program asked for input, but there was nothing left to read. Add another line to the Input box.";

const show = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(show).join(",");
    if (value && typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

/** The same drawing commands the Python turtle produces, so one canvas draws both. */
export function makeTurtle(commands) {
    let x = 0, y = 0, heading = 0, down = true, pen = "black", fill = "black", width = 2, path = null;
    const emit = (...command) => { if (commands.length < MAX_TURTLE) commands.push(command); };
    emit("new", 0);
    const go = (nx, ny) => {
        if (down) emit("line", 0, x, y, nx, ny, pen, width);
        else emit("move", 0, nx, ny);
        x = nx;
        y = ny;
        path?.push([x, y]);
    };
    const turtle = {
        forward(distance) {
            const angle = (heading * Math.PI) / 180;
            go(x + distance * Math.cos(angle), y + distance * Math.sin(angle));
        },
        back(distance) { turtle.forward(-distance); },
        right(angle) { turtle.setHeading(heading - angle); },
        left(angle) { turtle.setHeading(heading + angle); },
        setHeading(angle) {
            heading = ((angle % 360) + 360) % 360;
            emit("turn", 0, heading);
        },
        goto(nx, ny) { go(Number(nx), Number(ny)); },
        home() { go(0, 0); turtle.setHeading(0); },
        penUp() { down = false; },
        penDown() { down = true; },
        color(value) { pen = fill = String(value); },
        width(value) { width = Number(value) || 1; },
        dot(size = 8) { emit("dot", 0, x, y, size, pen); },
        beginFill() { path = [[x, y]]; },
        endFill() {
            if (path && path.length > 2) emit("fill", 0, fill, path);
            path = null;
        },
        background(value) { emit("bg", String(value)); },
        write(text) { emit("text", 0, x, y, show(text), pen, 14, "left"); },
        hide() { emit("show", 0, false); },
    };
    return turtle;
}

// Chrome and Node report "<anonymous>:LINE:COL" for code made with new Function; the wrapper adds lines above the program.
const WRAPPER_LINES = 3;
function lineOf(err) {
    const match = /<anonymous>:(\d+):\d+/.exec(err?.stack ?? "");
    const line = match ? Number(match[1]) - WRAPPER_LINES : null;
    return line && line > 0 ? line : null;
}

/**
 * @param budget how many loop rounds block programs may use before they are stopped (see blocksCode.js)
 * @returns {{ stdout: string, error: null | { message: string, line: number | null }, turtle: any[] }}
 */
export function runJs(code, stdin = "", budget = 200000) {
    let out = "";
    const lines = stdin ? stdin.split("\n") : [];
    const commands = [];

    const write = (text) => {
        out += text;
        if (out.length > MAX_OUTPUT) throw new Error("Your program printed too much. Is a loop running forever?");
    };
    const print = (...values) => write(`${values.map(show).join(" ")}\n`);
    const input = (prompt = "") => {
        write(show(prompt));
        if (lines.length === 0) throw new Error(NO_INPUT);
        const line = lines.shift();
        write(`${line}\n`);
        return line;
    };
    const api = {
        console: { log: print, info: print, warn: print, error: print },
        print,
        input,
        prompt: input,
        turtle: makeTurtle(commands),
        __koru: { budget },
    };

    try {
        // The program is a learner's or lecturer's own code, run in a worker with no access to the page.
        new Function(...Object.keys(api), `"use strict";\n${code}`)(...Object.values(api));
        return { stdout: out, error: null, turtle: commands };
    } catch (err) {
        const known = err instanceof Error && (err.message === NO_INPUT || err.message.startsWith("Your program"));
        const message = known ? err.message : `${err?.name ?? "Error"}: ${err?.message ?? err}`;
        return { stdout: out, error: { message, line: known ? null : lineOf(err) }, turtle: commands };
    }
}
