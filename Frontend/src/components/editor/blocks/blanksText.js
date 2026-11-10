// A blank is written {{answer}} or {{answer|other accepted answer}}. Same pattern as the
// server (BlanksKind.cs): a blank never spans lines. Students get the text with every blank
// emptied to {{}}.
const MARKER = /\{\{(.*?)\}\}/g;

/** The text as parts: { text } for plain runs and { blank: index } for each blank, in order. */
export function splitBlanks(text = "") {
    const parts = [];
    let last = 0;
    let index = 0;
    for (const match of text.matchAll(MARKER)) {
        if (match.index > last) parts.push({ text: text.slice(last, match.index) });
        parts.push({ blank: index++ });
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last) });
    return parts;
}

export const countBlanks = (text = "") => [...text.matchAll(MARKER)].length;

/** The accepted answers for each blank, e.g. [["CPU"], ["colour", "color"]]. */
export const blankAnswers = (text = "") =>
    [...text.matchAll(MARKER)].map((m) => m[1].split("|").map((a) => a.trim()).filter(Boolean));
