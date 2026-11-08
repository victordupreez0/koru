import { commandsToText, newCommand, textToCommands } from "../../src/components/editor/blocks/moveProgram";

describe("moveProgram", () => {
  test("blocks become text", () => {
    expect(commandsToText([newCommand("right", 3), newCommand("up")])).toBe("move right 3\nmove up 1");
  });

  test("text becomes blocks", () => {
    const { commands, skipped } = textToCommands("move right 3\nUP 2\nleft");
    expect(commands.map((c) => [c.dir, c.count])).toEqual([["right", 3], ["up", 2], ["left", 1]]);
    expect(skipped).toBe(0);
  });

  test("comments and blank lines are ignored", () => {
    expect(textToCommands("# plan\n\n// go\nmove down 1").commands).toHaveLength(1);
  });

  test("lines that aren't commands are counted, not kept", () => {
    const { commands, skipped } = textToCommands("move right 1\njump\nalert(1)");
    expect(commands).toHaveLength(1);
    expect(skipped).toBe(2);
  });

  test("every command gets its own id so reordering is stable", () => {
    const ids = textToCommands("up\nup\nup").commands.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  test("text and blocks round trip", () => {
    const text = "move right 3\nmove down 2";
    expect(commandsToText(textToCommands(text).commands)).toBe(text);
  });

  test("handles nothing", () => {
    expect(textToCommands(null).commands).toEqual([]);
  });
});
