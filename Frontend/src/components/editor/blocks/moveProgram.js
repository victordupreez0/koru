// Turns the student's drag-and-drop command blocks into text and back. This only
// supports the editing UI: running and marking the program happens on the server.

export const DIRECTIONS = ["right", "left", "up", "down"];

const LINE = /^(?:move\s+)?(up|down|left|right)(?:\s+(\d{1,3}))?$/i;

let nextId = 0;

export const newCommand = (dir, count = 1) => ({ id: ++nextId, dir, count });

export const commandsToText = (commands) => commands.map((c) => `move ${c.dir} ${c.count}`).join("\n");

/** Lines that aren't commands are skipped; `skipped` lets the UI say so. */
export function textToCommands(text) {
    const commands = [];
    let skipped = 0;
    for (const raw of (text ?? "").split("\n")) {
        const line = raw.trim().replace(/\s+/g, " ");
        if (!line || line.startsWith("#") || line.startsWith("//")) continue;
        const match = line.match(LINE);
        if (match) commands.push(newCommand(match[1].toLowerCase(), match[2] ? Number(match[2]) : 1));
        else skipped++;
    }
    return { commands, skipped };
}
