/* global describe, test, expect */
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { evaluate, parseLogic, truthTable, variables } from "../../src/components/editor/blocks/logicExpr";
import { ALGORITHMS, buildSteps } from "../../src/components/editor/blocks/algoSteps";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { LogicBlock, LogicAuthor, LogicPlay } from "../../src/components/editor/blocks/LogicBlock";
import { AlgoBlock, AlgoAuthor, AlgoPlay } from "../../src/components/editor/blocks/AlgoBlock";
import { FlashcardsBlock, FlashcardsAuthor, FlashcardsPlay } from "../../src/components/editor/blocks/FlashcardsBlock";

const env = (s) => Object.fromEntries([...s].map((c, i) => [String.fromCharCode(65 + i), c === "1"]));

describe("logicExpr", () => {
    test("NOT binds tighter than AND, AND tighter than XOR, XOR tighter than OR", () => {
        expect(parseLogic("NOT A AND B")).toEqual({ type: "and", left: { type: "not", arg: { type: "var", name: "A" } }, right: { type: "var", name: "B" } });
        expect(parseLogic("A OR B AND C").type).toBe("or");
        expect(parseLogic("A XOR B AND C")).toMatchObject({ type: "xor", right: { type: "and" } });
        expect(parseLogic("A OR B XOR C")).toMatchObject({ type: "or", right: { type: "xor" } });
        expect(parseLogic("A NOR B NAND C")).toMatchObject({ type: "nor", right: { type: "nand" } });
    });

    test("parentheses override precedence", () => {
        expect(parseLogic("(A OR B) AND C")).toMatchObject({ type: "and", left: { type: "or" } });
        expect(parseLogic("NOT (A AND B)")).toMatchObject({ type: "not", arg: { type: "and" } });
    });

    test("symbols and lower case mean the same as the words", () => {
        expect(parseLogic("!a & b | c ^ d")).toEqual(parseLogic("NOT A AND B OR C XOR D"));
        expect(parseLogic("a and not b")).toEqual(parseLogic("A AND NOT B"));
    });

    test("anything invalid gets a friendly message", () => {
        for (const bad of ["", "A AND", "AB", "(A OR B", "A B", "A + B", "A AND OR B", ")"]) {
            expect(() => parseLogic(bad)).toThrow("I can't read that. Try: (A AND B) OR NOT C");
        }
        expect(() => parseLogic("A AND B AND C AND D AND E")).toThrow(/at most 4/);
    });

    test("variables, evaluate and truth table", () => {
        const ast = parseLogic("(B AND A) OR NOT C");
        expect(variables(ast)).toEqual(["A", "B", "C"]);
        expect(evaluate(ast, env("111"))).toBe(true);
        expect(evaluate(ast, env("101"))).toBe(false);
        const { vars, rows } = truthTable(parseLogic("A XOR B"));
        expect(vars).toEqual(["A", "B"]);
        expect(rows.map((r) => [r.env.A, r.env.B, r.output])).toEqual([
            [false, false, false], [false, true, true], [true, false, true], [true, true, false],
        ]);
        expect(truthTable(parseLogic("A NAND B")).rows.map((r) => r.output)).toEqual([true, true, true, false]);
        expect(truthTable(parseLogic("A NOR B")).rows.map((r) => r.output)).toEqual([true, false, false, false]);
    });
});

describe("algoSteps", () => {
    const data = [5, 2, 8, 1, 9, 3];

    test.each(["bubble", "selection", "insertion"])("%s ends sorted with every position marked", (id) => {
        for (const list of [data, [3, 3, 1], [1, 2, 3, 4], [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]]) {
            const frames = buildSteps(id, list, 0);
            const end = frames.at(-1);
            expect(end.array).toEqual([...list].sort((a, b) => a - b));
            expect([...end.sorted].sort((a, b) => a - b)).toEqual(list.map((_, i) => i));
            expect(end.line).toBe(ALGORITHMS[id].pseudocode.length - 1);
            expect(end.note).toMatch(/^Sorted in \d+ comparisons? and \d+ swaps?\.$/);
            frames.forEach((f) => expect([...f.ids].sort((a, b) => a - b)).toEqual(list.map((_, i) => i)));
        }
    });

    test("counters are right for a small case", () => {
        const bubble = buildSteps("bubble", [3, 1, 2], 0).at(-1);
        expect([bubble.comparisons, bubble.swaps]).toEqual([3, 2]);
        expect(bubble.note).toBe("Sorted in 3 comparisons and 2 swaps.");
        const selection = buildSteps("selection", [3, 1, 2], 0).at(-1);
        expect([selection.comparisons, selection.swaps]).toEqual([3, 2]);
        const insertion = buildSteps("insertion", [3, 1, 2], 0).at(-1);
        expect([insertion.comparisons, insertion.swaps]).toEqual([3, 2]);
        expect(buildSteps("bubble", [3, 1, 2], 0)[1].note).toBe("Compare 3 and 1. 3 is bigger, so they swap.");
    });

    test("linear search finds or doesn't find", () => {
        const found = buildSteps("linear", data, 8).at(-1);
        expect(found.found).toBe(2);
        expect(found.comparisons).toBe(3);
        expect(found.note).toBe("Found 8 at position 3 after 3 checks.");
        const missing = buildSteps("linear", data, 7).at(-1);
        expect(missing.found).toBeNull();
        expect(missing.comparisons).toBe(6);
        expect(missing.note).toMatch(/^7 is not in the list\./);
    });

    test("binary search sorts first, halves the range and finds or doesn't find", () => {
        const frames = buildSteps("binary", data, 8);
        expect(frames[0].note).toMatch(/sorted/);
        expect(frames[1].array).toEqual([1, 2, 3, 5, 8, 9]);
        const end = frames.at(-1);
        expect(end.found).toBe(4);
        expect(end.note).toBe("Found 8 at position 5 after 2 checks.");

        const missing = buildSteps("binary", [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23], 4);
        expect(missing.at(-1).note).toBe("4 is not in the list.");
        const sizes = missing.filter((f) => f.range).map((f) => Math.max(0, f.range[1] - f.range[0] + 1));
        const changes = sizes.filter((s, i) => i === 0 || s !== sizes[i - 1]);
        changes.slice(1).forEach((s, i) => expect(s).toBeLessThanOrEqual(Math.ceil(changes[i] / 2)));
        expect(missing.at(-1).comparisons).toBeLessThanOrEqual(4);
    });
});

describe("explore blocks survive a save and reload", () => {
    const extensions = [StarterKit.configure({ codeBlock: false, dropcursor: false }), LogicBlock, AlgoBlock, FlashcardsBlock];
    const roundTrip = (node) => {
        const editor = new Editor({ extensions, content: { type: "doc", content: [node] } });
        const out = editor.getJSON().content[0];
        const html = editor.getHTML();
        editor.destroy();
        const reparsed = new Editor({ extensions, content: html });
        const again = reparsed.getJSON().content[0];
        reparsed.destroy();
        return [out, again];
    };

    test.each([
        ["logic", { type: "logicBlock", attrs: { blockId: "l1", prompt: "Flip", expression: "(A OR B) AND NOT C", showTable: false } }],
        ["algo", { type: "algoBlock", attrs: { blockId: "a1", prompt: "Watch", algorithm: "binary", data: [4, 7, 1], target: 7 } }],
        ["flashcards", { type: "flashcardsBlock", attrs: { blockId: "f1", title: "Words", cards: [{ front: "Bee 🐝", back: "It buzzes" }] } }],
    ])("%s", (_name, node) => {
        const [json, html] = roundTrip(node);
        expect(json).toEqual(node);
        expect(html).toEqual(node);
    });

    test("defaults", () => {
        const [logic] = roundTrip({ type: "logicBlock" });
        expect(logic.attrs).toMatchObject({ expression: "A AND B", showTable: true, prompt: "" });
        const [algo] = roundTrip({ type: "algoBlock" });
        expect(algo.attrs).toMatchObject({ algorithm: "bubble", data: [5, 2, 8, 1, 9, 3], target: 8 });
        const [cards] = roundTrip({ type: "flashcardsBlock" });
        expect(cards.attrs.cards).toHaveLength(2);
    });
});

describe("explore blocks render and respond", () => {
    const noop = () => {};

    test("logic: switches light the lamp and table rows set the switches", () => {
        render(<LogicPlay attrs={{ prompt: "", expression: "A AND B", showTable: true }} />);
        expect(screen.getByText("Output: 0 (off)")).toBeTruthy();
        fireEvent.click(screen.getByRole("switch", { name: "Input A" }));
        fireEvent.click(screen.getByRole("switch", { name: "Input B" }));
        expect(screen.getByText("Output: 1 (on)")).toBeTruthy();
        fireEvent.click(screen.getByLabelText("A 0, B 1, output 0"));
        expect(screen.getByText("Output: 0 (off)")).toBeTruthy();
        render(<LogicAuthor attrs={{ prompt: "", expression: "A AND", showTable: true }} update={noop} />);
        expect(screen.getByText(/I can't read that/)).toBeTruthy();
        render(<LogicPlay attrs={{ prompt: "", expression: "(A NAND B) XOR (NOT C NOR D)", showTable: false }} />);
    });

    test("algo: steps forward and back, and every algorithm renders", () => {
        for (const algorithm of Object.keys(ALGORITHMS)) {
            const { unmount } = render(<AlgoPlay attrs={{ prompt: "", algorithm, data: [5, 2, 8, 1, 9, 3], target: 8 }} />);
            fireEvent.click(screen.getByRole("button", { name: "Step forward" }));
            expect(screen.getByText(/^Step 2 of/)).toBeTruthy();
            fireEvent.click(screen.getByRole("button", { name: "Step back" }));
            expect(screen.getByText(/^Step 1 of/)).toBeTruthy();
            fireEvent.click(screen.getByRole("button", { name: /Shuffle/ }));
            unmount();
        }
        render(<AlgoAuthor attrs={{ prompt: "", algorithm: "linear", data: [5, 2], target: 8 }} update={noop} />);
        expect(screen.getByText(/3 to 12 whole numbers/)).toBeTruthy();
    });

    test("flashcards: flip and move", async () => {
        render(<FlashcardsPlay attrs={{ title: "Words", cards: [{ front: "One", back: "1" }, { front: "Two", back: "2" }] }} />);
        expect(screen.getByText("Card 1 of 2")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Front: One/ }));
        expect(screen.getByRole("button", { name: /Back: 1/ })).toBeTruthy();
        await act(async () => { fireEvent.keyDown(screen.getByRole("group"), { key: "ArrowRight" }); });
        expect(screen.getByText("Card 2 of 2")).toBeTruthy();
        render(<FlashcardsAuthor attrs={{ title: "", cards: [{ front: "a", back: "b" }] }} update={noop} />);
    });
});
