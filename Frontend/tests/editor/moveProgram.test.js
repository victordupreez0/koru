/* global describe, test, expect */
import {
  addCommand,
  changeCommand,
  countCommands,
  forward,
  move,
  removeCommand,
  repeat,
  shiftCommand,
  textToTree,
  treeToText,
  turn,
} from "../../src/components/editor/blocks/moveProgram";

// Ids are generated, so compare programs by what they say.
const shape = (tree) => tree.map(({ id: _id, body, ...rest }) => (body ? { ...rest, body: shape(body) } : rest));

describe("robot programs", () => {
  test("commands become text the server understands", () => {
    const { text } = treeToText([move("right", 3), repeat(2, [forward(1), turn("left")]), move("up")]);
    expect(text).toBe("move right 3\nrepeat 2\n  forward 1\n  turn left\nend\nmove up 1");
  });

  test("every line of text is linked to the command it came from", () => {
    const loop = repeat(2, [move("up")]);
    const { commandOnLine } = treeToText([move("right"), loop]);
    expect(commandOnLine[2]).toBe(loop.id);
    expect(commandOnLine[3]).toBe(loop.body[0].id);
    expect(commandOnLine[4]).toBeUndefined(); // "end" belongs to nothing
  });

  test("text becomes commands, including every way of writing them", () => {
    const { tree, skipped } = textToTree("right\nmove UP 2\nfwd 3\nTL\ntr\nturn around\nrepeat 4 times:\n  down\nend repeat");
    expect(skipped).toBe(0);
    expect(shape(tree)).toEqual([
      { kind: "move", dir: "right", count: 1 },
      { kind: "move", dir: "up", count: 2 },
      { kind: "forward", count: 3 },
      { kind: "turn", dir: "left" },
      { kind: "turn", dir: "right" },
      { kind: "turn", dir: "around" },
      { kind: "repeat", times: 4, body: [{ kind: "move", dir: "down", count: 1 }] },
    ]);
  });

  test("repeats nest", () => {
    const { tree } = textToTree("repeat 2\nrepeat 3\nright\nend\nup\nend");
    expect(shape(tree)).toEqual([{ kind: "repeat", times: 2, body: [{ kind: "repeat", times: 3, body: [{ kind: "move", dir: "right", count: 1 }] }, { kind: "move", dir: "up", count: 1 }] }]);
  });

  test("comments and blank lines are ignored; nonsense and stray ends are counted", () => {
    const { tree, skipped } = textToTree("# plan\n\n// go\nright\njump\nend");
    expect(shape(tree)).toEqual([{ kind: "move", dir: "right", count: 1 }]);
    expect(skipped).toBe(2);
  });

  test("text and commands round trip", () => {
    const text = "move left 2\nrepeat 3\n  forward 1\n  turn right\nend";
    expect(treeToText(textToTree(text).tree).text).toBe(text);
  });

  test("a repeat counts as one command, plus what is inside it", () => {
    expect(countCommands(textToTree("repeat 4\nright\nup\nend\ndown").tree)).toBe(4);
    expect(countCommands([])).toBe(0);
  });

  test("editing returns a new program and leaves the old one alone", () => {
    const loop = repeat(2);
    const first = [move("up"), loop];
    const added = addCommand(first, loop.id, move("left"));
    expect(shape(first)[1].body).toEqual([]);
    expect(shape(added)[1].body).toEqual([{ kind: "move", dir: "left", count: 1 }]);

    const inner = added[1].body[0];
    expect(shape(changeCommand(added, inner.id, { count: 5 }))[1].body[0].count).toBe(5);
    expect(removeCommand(added, inner.id)[1].body).toEqual([]);
    expect(shape(addCommand(first, null, turn("right")))).toHaveLength(3);
  });

  test("commands move up and down among their neighbours only", () => {
    const a = move("up");
    const b = move("down");
    expect(shiftCommand([a, b], b.id, -1)).toEqual([b, a]);
    expect(shiftCommand([a, b], a.id, -1)).toEqual([a, b]);
    const loop = repeat(2, [a, b]);
    expect(shiftCommand([loop], a.id, 1)[0].body).toEqual([b, a]);
  });
});
