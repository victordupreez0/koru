// The robot puzzle's program as a tree of commands, and as the text the server runs.
// This only supports the editing UI: running and marking the program happens on the server.
//
// A command is one of:
//   { kind: "move", dir, count }      move up/right/down/left on the grid
//   { kind: "forward", count }        move the way the robot is facing
//   { kind: "turn", dir }             left, right or around
//   { kind: "repeat", times, body }   run the commands in body several times

export const DIRECTIONS = ["up", "right", "down", "left"];

let nextId = 0;
const withId = (command) => ({ id: ++nextId, ...command });

export const move = (dir, count = 1) => withId({ kind: "move", dir, count });
export const forward = (count = 1) => withId({ kind: "forward", count });
export const turn = (dir) => withId({ kind: "turn", dir });
export const repeat = (times = 2, body = []) => withId({ kind: "repeat", times, body });

const MOVE = /^(?:move\s+)?(up|down|left|right)(?:\s+(\d{1,3}))?$/i;
const FORWARD = /^(?:forward|fwd)(?:\s+(\d{1,3}))?$/i;
const TURN = /^(?:turn\s+(left|right|around)|(tl|tr))$/i;
const REPEAT = /^repeat\s+(\d{1,2})(?:\s+times)?\s*:?$/i;
const END = /^end(?:\s+repeat)?$/i;

const lineFor = (c) => {
    if (c.kind === "move") return `move ${c.dir} ${c.count}`;
    if (c.kind === "forward") return `forward ${c.count}`;
    if (c.kind === "turn") return `turn ${c.dir}`;
    return `repeat ${c.times}`;
};

/** The program as text, plus which command each line number belongs to (to highlight it while it runs). */
export function treeToText(tree) {
    const lines = [];
    const commandOnLine = {};
    const walk = (list, depth) => {
        for (const command of list) {
            lines.push(`${"  ".repeat(depth)}${lineFor(command)}`);
            commandOnLine[lines.length] = command.id;
            if (command.kind === "repeat") {
                walk(command.body, depth + 1);
                lines.push(`${"  ".repeat(depth)}end`);
            }
        }
    };
    walk(tree, 0);
    return { text: lines.join("\n"), commandOnLine };
}

/** Lines that aren't commands are skipped; `skipped` lets the UI say so. */
export function textToTree(text) {
    const tree = [];
    const open = [tree];
    let skipped = 0;
    for (const raw of (text ?? "").split("\n")) {
        const line = raw.trim().replace(/\s+/g, " ");
        if (!line || line.startsWith("#") || line.startsWith("//")) continue;
        const body = open[open.length - 1];
        let match;
        if (END.test(line)) {
            if (open.length > 1) open.pop();
            else skipped++;
        } else if ((match = line.match(REPEAT))) {
            const loop = repeat(Math.max(1, Number(match[1])));
            body.push(loop);
            open.push(loop.body);
        } else if ((match = line.match(TURN))) {
            const way = (match[1] ?? match[2]).toLowerCase();
            body.push(turn(way === "tl" ? "left" : way === "tr" ? "right" : way));
        } else if ((match = line.match(FORWARD))) {
            body.push(forward(match[1] ? Number(match[1]) : 1));
        } else if ((match = line.match(MOVE))) {
            body.push(move(match[1].toLowerCase(), match[2] ? Number(match[2]) : 1));
        } else {
            skipped++;
        }
    }
    return { tree, skipped };
}

/** How many commands a program uses. A repeat counts as one, plus whatever is inside it. */
export const countCommands = (tree) => tree.reduce((n, c) => n + 1 + (c.kind === "repeat" ? countCommands(c.body) : 0), 0);

// --- Editing the tree without changing the old one ---

/** Adds a command to the end of a repeat (by id), or to the end of the program when repeatId is null. */
export const addCommand = (tree, repeatId, command) =>
    repeatId === null
        ? [...tree, command]
        : tree.map((c) => (c.kind !== "repeat" ? c : c.id === repeatId ? { ...c, body: [...c.body, command] } : { ...c, body: addCommand(c.body, repeatId, command) }));

export const changeCommand = (tree, id, patch) =>
    tree.map((c) => (c.id === id ? { ...c, ...patch } : c.kind === "repeat" ? { ...c, body: changeCommand(c.body, id, patch) } : c));

export const removeCommand = (tree, id) =>
    tree.filter((c) => c.id !== id).map((c) => (c.kind === "repeat" ? { ...c, body: removeCommand(c.body, id) } : c));

/** Moves a command one place up (-1) or down (+1) among its neighbours. */
export function shiftCommand(tree, id, by) {
    const at = tree.findIndex((c) => c.id === id);
    if (at === -1) return tree.map((c) => (c.kind === "repeat" ? { ...c, body: shiftCommand(c.body, id, by) } : c));
    const to = at + by;
    if (to < 0 || to >= tree.length) return tree;
    const next = [...tree];
    [next[at], next[to]] = [next[to], next[at]];
    return next;
}
