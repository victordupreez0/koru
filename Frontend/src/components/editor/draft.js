// A short way to write a page. A "draft" is a list of simple objects such as
//   { t: "h2", text: "Loops" }   { t: "p", text: "A **loop** repeats." }   { t: "quiz", questions: [...] }
// and this file turns it into the blocks the editor stores. The showcase courses are written
// this way, and the AI drafts pages in the same format, so there is one converter to get right.
//
// Text may use **bold**, *italic*, `code` and [links](https://example.com).

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

/** Text with simple marks, as Tiptap text nodes. */
export function inline(text) {
    const source = String(text ?? "");
    const nodes = [];
    const push = (value, marks) => { if (value) nodes.push({ type: "text", text: value, ...(marks ? { marks } : {}) }); };
    let last = 0;
    for (const match of source.matchAll(INLINE)) {
        push(source.slice(last, match.index));
        if (match[1] !== undefined) push(match[1], [{ type: "bold" }]);
        else if (match[2] !== undefined) push(match[2], [{ type: "italic" }]);
        else if (match[3] !== undefined) push(match[3], [{ type: "code" }]);
        else push(match[4], [{ type: "link", attrs: { href: match[5] } }]);
        last = match.index + match[0].length;
    }
    push(source.slice(last));
    return nodes;
}

const paragraph = (text) => {
    const content = inline(text);
    return content.length ? { type: "paragraph", content } : { type: "paragraph" };
};
const listItems = (items, type = "listItem", attrs) => items.map((text) => ({ type, ...(attrs ? { attrs } : {}), content: [paragraph(text)] }));
const cell = (type, text) => ({ type, content: [paragraph(text)] });

/** Reads a robot-puzzle map drawn with letters: S start, T target, # blocked, * to collect, . empty. */
export function readMap(map) {
    const grid = { rows: map.length, cols: Math.max(...map.map((row) => row.length)), start: [0, 0], target: [0, 0], obstacles: [], stars: [] };
    map.forEach((row, r) => [...row].forEach((char, c) => {
        if (char === "S") grid.start = [r, c];
        else if (char === "T") grid.target = [r, c];
        else if (char === "#") grid.obstacles.push([r, c]);
        else if (char === "*") grid.stars.push([r, c]);
    }));
    return grid;
}

/**
 * @param blocks the draft
 * @param idPrefix every activity needs an id that is unique on its page; ids are idPrefix-1, idPrefix-2...
 * @param visit called with (node, draftBlock) for every activity, for callers that need to look at them
 * @returns Tiptap nodes
 */
export function draftToNodes(blocks, idPrefix = "b", visit = null) {
    let count = 0;
    let source = null;
    const nextId = () => `${idPrefix}-${++count}`;
    const activity = (type, attrs) => {
        const node = { type, attrs: { blockId: nextId(), ...attrs } };
        visit?.(node, source);
        return node;
    };
    const many = (list) => list.flatMap(convert);
    const inner = (b) => (b.blocks ? many(b.blocks) : [paragraph(b.text)]);

    function convert(b) {
        if (typeof b === "string") return [paragraph(b)];
        source = b;
        switch (b.t) {
            case "h1": case "h2": case "h3":
                return [{ type: "heading", attrs: { level: Number(b.t[1]) }, content: inline(b.text) }];
            case "p": return [paragraph(b.text)];
            case "bullets": return [{ type: "bulletList", content: listItems(b.items) }];
            case "steps": return [{ type: "orderedList", content: listItems(b.items) }];
            case "checklist": return [{ type: "taskList", content: listItems(b.items, "taskItem", { checked: false }) }];
            case "quote": return [{ type: "blockquote", content: [paragraph(b.text)] }];
            case "divider": return [{ type: "horizontalRule" }];
            case "callout": return [{ type: "callout", attrs: { variant: b.variant ?? "info" }, content: inner(b) }];
            case "code": return [{ type: "codeBlock", attrs: { language: b.lang ?? null }, content: [{ type: "text", text: b.code }] }];
            case "image": return [{ type: "image", attrs: { src: b.src, alt: b.alt ?? "", caption: b.caption ?? "" } }];
            case "embed": return [{ type: "embed", attrs: { url: b.url } }];
            case "table":
                return [{
                    type: "table",
                    content: [
                        { type: "tableRow", content: b.header.map((text) => cell("tableHeader", text)) },
                        ...b.rows.map((row) => ({ type: "tableRow", content: row.map((text) => cell("tableCell", text)) })),
                    ],
                }];
            case "hero": return [{ type: "hero", attrs: { title: b.title ?? "", subtitle: b.subtitle ?? "", emoji: b.emoji ?? "", theme: b.theme ?? "purple" } }];
            case "columns":
                return [{ type: "columns", attrs: { layout: b.layout ?? "equal" }, content: b.cols.map((col) => ({ type: "column", content: many(col) })) }];
            case "reveal": return [{ type: "details", attrs: { title: b.title ?? "" }, content: inner(b) }];
            case "diagram": return [{ type: "diagram", attrs: { code: b.code, caption: b.caption ?? "" } }];

            case "flashcards":
                return [activity("flashcardsBlock", { title: b.title ?? "", cards: b.cards.map((c) => (Array.isArray(c) ? { front: c[0], back: c[1] } : c)) })];
            case "logic": return [activity("logicBlock", { prompt: b.prompt ?? "", expression: b.expression, showTable: b.showTable ?? true })];
            case "algo": return [activity("algoBlock", { prompt: b.prompt ?? "", algorithm: b.algorithm, data: b.data, target: b.target ?? b.data[0] })];

            case "quiz":
                return [activity("quizBlock", {
                    passPercent: b.pass ?? 50,
                    questions: b.questions.map((q) => ({ question: q.q, options: q.options, correctAnswer: q.answer })),
                })];
            case "squares":
                return [activity("squaresBlock", { prompt: b.prompt ?? "", rows: b.rows, cols: b.cols, correct: b.correct, exactly: b.exactly ?? null })];
            case "robot":
                return [activity("moveBlock", {
                    prompt: b.prompt ?? "",
                    ...readMap(b.map),
                    theme: b.theme ?? "robot",
                    mode: b.mode ?? "blocks",
                    facing: b.facing ?? "right",
                    maxBlocks: b.maxBlocks ?? null,
                    starter: b.starter ?? "",
                })];
            case "pattern":
                return [activity("patternBlock", { prompt: b.prompt ?? "", tokens: b.tokens, blanks: b.blanks, distractors: b.distractors ?? [], options: null })];
            case "order":
                return [activity("orderBlock", { prompt: b.prompt ?? "", code: b.code ?? false, items: b.items.map((text, i) => ({ id: `i${i + 1}`, text })) })];
            case "sort": {
                const groups = Object.keys(b.groups).map((label, i) => ({ id: `g${i + 1}`, label }));
                const items = groups.flatMap((g) => b.groups[g.label].map((text) => ({ text, group: g.id }))).map((item, i) => ({ id: `i${i + 1}`, ...item }));
                return [activity("sortBlock", { prompt: b.prompt ?? "", groups, items })];
            }
            case "blanks":
                return [activity("blanksBlock", { prompt: b.prompt ?? "", text: b.text, code: b.code ?? false, bank: b.bank ?? false, distractors: b.distractors ?? [], caseSensitive: b.caseSensitive ?? false, options: null })];
            case "fillTable": {
                // A cell that starts with "?" is one the student must work out: "?12" means the answer is 12.
                const answers = [];
                const rows = b.rows.map((row, r) => row.map((value, c) => {
                    const text = String(value);
                    if (!text.startsWith("?")) return text;
                    answers.push([r, c]);
                    return text.slice(1);
                }));
                return [activity("fillTableBlock", { prompt: b.prompt ?? "", headers: b.headers, rows, answers, caseSensitive: b.caseSensitive ?? false })];
            }
            case "bits": return [activity("bitsBlock", { prompt: b.prompt ?? "", bits: b.bits ?? 8, target: b.target ?? null })];
            case "codelab":
                return [activity("codeLab", {
                    language: b.language,
                    prompt: b.prompt ?? "",
                    starter: b.starter ?? "",
                    setup: b.setup ?? "",
                    solution: b.solution ?? "",
                    tests: (b.tests ?? []).map((test) => ({ name: test.name ?? "", stdin: test.stdin ?? "", append: test.append ?? "", expected: test.expected ?? "", hidden: test.hidden ?? false })),
                    ordered: b.ordered ?? false,
                    toolbox: b.toolbox ?? ["say", "loops", "logic", "math", "variables"],
                })];
            default:
                throw new Error(`Unknown block in a draft: ${JSON.stringify(b).slice(0, 80)}`);
        }
    }

    return many(blocks);
}

/** A whole page, in the shape the server stores. */
export const draftToPage = (title, blocks, idPrefix, visit) => ({
    title,
    sections: [{ id: "main", type: "text", content: { type: "doc", content: draftToNodes(blocks, idPrefix, visit) } }],
});
