// Block-based coding (Blockly). Defines Koru's own blocks, the toolbox categories a lecturer can
// switch on, and turns a saved workspace into JavaScript (to run) or Python (to read).
import * as core from "blockly/core";
import * as library from "blockly/blocks";
import * as english from "blockly/msg/en";
import * as javascript from "blockly/javascript";
import * as pythonCode from "blockly/python";

// In the browser these are ES modules; where the showcase is built (Node) they are CommonJS
// and arrive wrapped in "default". This reads them either way.
const unwrap = (module) => module.default ?? module;
const Blockly = unwrap(core);
const { javascriptGenerator, Order: Js } = unwrap(javascript);
const { pythonGenerator, Order: Py } = unwrap(pythonCode);

Blockly.setLocale(unwrap(english));

const COLOURS = [["black", "black"], ["red", "red"], ["orange", "orange"], ["gold", "gold"], ["green", "green"], ["blue", "blue"], ["purple", "purple"], ["pink", "hotpink"], ["brown", "saddlebrown"], ["grey", "grey"]];

const statement = (type, message0, args0, colour, tooltip) => ({ type, message0, args0, previousStatement: null, nextStatement: null, colour, tooltip });
const number = (name) => ({ type: "input_value", name, check: "Number" });

Blockly.common.defineBlocksWithJsonArray([
    statement("koru_say", "say %1", [{ type: "input_value", name: "TEXT" }], 160, "Shows something on the screen."),
    { type: "koru_ask", message0: "ask %1", args0: [{ type: "input_value", name: "TEXT" }], output: "String", colour: 160, tooltip: "Asks a question and gives back what was typed." },
    { type: "koru_ask_number", message0: "ask for a number %1", args0: [{ type: "input_value", name: "TEXT" }], output: "Number", colour: 160, tooltip: "Asks a question and gives back the number that was typed." },
    { type: "koru_forever", message0: "forever %1 %2", args0: [{ type: "input_dummy" }, { type: "input_statement", name: "DO" }], previousStatement: null, colour: 120, tooltip: "Repeats the blocks inside again and again. Use 'break out of loop' to stop." },
    statement("turtle_forward", "move forward %1", [number("N")], 200, "Moves the turtle forward, drawing a line."),
    statement("turtle_back", "move back %1", [number("N")], 200, "Moves the turtle backwards."),
    statement("turtle_right", "turn right %1 degrees", [number("N")], 200, "Turns the turtle to its right."),
    statement("turtle_left", "turn left %1 degrees", [number("N")], 200, "Turns the turtle to its left."),
    statement("turtle_pen", "pen %1", [{ type: "field_dropdown", name: "MODE", options: [["down", "DOWN"], ["up", "UP"]] }], 200, "Pen up moves without drawing."),
    statement("turtle_colour", "set colour to %1", [{ type: "field_dropdown", name: "COLOUR", options: COLOURS }], 200, "Changes the colour of the line."),
    statement("turtle_width", "set pen width %1", [number("N")], 200, "Makes the line thicker or thinner."),
    statement("turtle_goto", "go to x %1 y %2", [number("X"), number("Y")], 200, "Jumps to a place. The middle is x 0, y 0."),
    { type: "turtle_fill", message0: "fill the shape %1 %2", args0: [{ type: "input_dummy" }, { type: "input_statement", name: "DO" }], previousStatement: null, nextStatement: null, colour: 200, tooltip: "Colours in the shape drawn by the blocks inside." },
]);

// "Break out of loop" only works inside blocks Blockly knows are loops, so "forever" has to say it is one.
unwrap(library).loops.loopTypes.add("koru_forever");

// --- JavaScript: what actually runs ---
const TOO_LONG = "Your program ran for too long and was stopped. Check your loops: one of them may never end.";
javascriptGenerator.INFINITE_LOOP_TRAP = `if (--__koru.budget < 0) throw new Error(${JSON.stringify(TOO_LONG)});\n`;

const jsValue = (block, name, fallback) => javascriptGenerator.valueToCode(block, name, Js.NONE) || fallback;
const jsBody = (block) => {
    const body = javascriptGenerator.statementToCode(block, "DO");
    return javascriptGenerator.addLoopTrap(body, block);
};
const js = javascriptGenerator.forBlock;
js.koru_say = js.text_print = (block) => `print(${jsValue(block, "TEXT", "''")});\n`;
js.koru_ask = (block) => [`input(${jsValue(block, "TEXT", "''")})`, Js.FUNCTION_CALL];
js.koru_ask_number = (block) => [`Number(input(${jsValue(block, "TEXT", "''")}))`, Js.FUNCTION_CALL];
js.text_prompt_ext = (block) => {
    const ask = `input(${jsValue(block, "TEXT", "''")})`;
    return [block.getFieldValue("TYPE") === "NUMBER" ? `Number(${ask})` : ask, Js.FUNCTION_CALL];
};
js.koru_forever = (block) => `while (true) {\n${jsBody(block)}}\n`;
js.turtle_forward = (block) => `turtle.forward(${jsValue(block, "N", "0")});\n`;
js.turtle_back = (block) => `turtle.back(${jsValue(block, "N", "0")});\n`;
js.turtle_right = (block) => `turtle.right(${jsValue(block, "N", "0")});\n`;
js.turtle_left = (block) => `turtle.left(${jsValue(block, "N", "0")});\n`;
js.turtle_pen = (block) => (block.getFieldValue("MODE") === "UP" ? "turtle.penUp();\n" : "turtle.penDown();\n");
js.turtle_colour = (block) => `turtle.color(${JSON.stringify(block.getFieldValue("COLOUR"))});\n`;
js.turtle_width = (block) => `turtle.width(${jsValue(block, "N", "1")});\n`;
js.turtle_goto = (block) => `turtle.goto(${jsValue(block, "X", "0")}, ${jsValue(block, "Y", "0")});\n`;
js.turtle_fill = (block) => `turtle.beginFill();\n${javascriptGenerator.statementToCode(block, "DO").replace(/^ {2}/gm, "")}turtle.endFill();\n`;

// --- Python: shown to learners so they can see their blocks as real code ---
const pyValue = (block, name, fallback) => pythonGenerator.valueToCode(block, name, Py.NONE) || fallback;
const pyTurtle = (call) => {
    pythonGenerator.definitions_.import_turtle = "import turtle";
    return `turtle.${call}\n`;
};
const py = pythonGenerator.forBlock;
py.koru_say = py.text_print = (block) => `print(${pyValue(block, "TEXT", "''")})\n`;
py.koru_ask = (block) => [`input(${pyValue(block, "TEXT", "''")})`, Py.FUNCTION_CALL];
py.koru_ask_number = (block) => [`float(input(${pyValue(block, "TEXT", "''")}))`, Py.FUNCTION_CALL];
py.text_prompt_ext = (block) => {
    const ask = `input(${pyValue(block, "TEXT", "''")})`;
    return [block.getFieldValue("TYPE") === "NUMBER" ? `float(${ask})` : ask, Py.FUNCTION_CALL];
};
py.koru_forever = (block) => `while True:\n${pythonGenerator.statementToCode(block, "DO") || pythonGenerator.PASS}`;
py.turtle_forward = (block) => pyTurtle(`forward(${pyValue(block, "N", "0")})`);
py.turtle_back = (block) => pyTurtle(`backward(${pyValue(block, "N", "0")})`);
py.turtle_right = (block) => pyTurtle(`right(${pyValue(block, "N", "0")})`);
py.turtle_left = (block) => pyTurtle(`left(${pyValue(block, "N", "0")})`);
py.turtle_pen = (block) => pyTurtle(block.getFieldValue("MODE") === "UP" ? "penup()" : "pendown()");
py.turtle_colour = (block) => pyTurtle(`color(${JSON.stringify(block.getFieldValue("COLOUR"))})`);
py.turtle_width = (block) => pyTurtle(`pensize(${pyValue(block, "N", "1")})`);
py.turtle_goto = (block) => pyTurtle(`goto(${pyValue(block, "X", "0")}, ${pyValue(block, "Y", "0")})`);
py.turtle_fill = (block) => `${pyTurtle("begin_fill()")}${pythonGenerator.statementToCode(block, "DO").replace(/^ {2}/gm, "")}${pyTurtle("end_fill()")}`;

// --- The toolbox ---
const num = (n) => ({ shadow: { type: "math_number", fields: { NUM: n } } });
const txt = (t) => ({ shadow: { type: "text", fields: { TEXT: t } } });
const block = (type, inputs) => ({ kind: "block", type, ...(inputs ? { inputs } : {}) });

/** The groups of blocks a lecturer can offer. Fewer groups is better for younger learners. */
export const TOOLBOX = {
    say: { label: "Say and ask", colour: "160", contents: [block("koru_say", { TEXT: txt("Hello!") }), block("koru_ask", { TEXT: txt("What is your name?") }), block("koru_ask_number", { TEXT: txt("How old are you?") }), block("text"), block("text_join")] },
    draw: { label: "Draw", colour: "200", contents: [block("turtle_forward", { N: num(100) }), block("turtle_back", { N: num(50) }), block("turtle_right", { N: num(90) }), block("turtle_left", { N: num(90) }), block("turtle_pen"), block("turtle_colour"), block("turtle_width", { N: num(3) }), block("turtle_goto", { X: num(0), Y: num(0) }), block("turtle_fill")] },
    loops: { label: "Repeat", colour: "120", contents: [block("controls_repeat_ext", { TIMES: num(4) }), block("koru_forever"), block("controls_whileUntil"), block("controls_for", { FROM: num(1), TO: num(10), BY: num(1) }), block("controls_forEach"), block("controls_flow_statements")] },
    logic: { label: "Decide", colour: "210", contents: [block("controls_if"), block("controls_ifelse"), block("logic_compare"), block("logic_operation"), block("logic_negate"), block("logic_boolean")] },
    math: { label: "Numbers", colour: "230", contents: [block("math_number"), block("math_arithmetic", { A: num(1), B: num(1) }), block("math_modulo", { DIVIDEND: num(10), DIVISOR: num(2) }), block("math_random_int", { FROM: num(1), TO: num(6) }), block("math_round")] },
    text: { label: "Words", colour: "160", contents: [block("text"), block("text_join"), block("text_length"), block("text_changeCase")] },
    variables: { label: "Variables", colour: "330", custom: "VARIABLE" },
    lists: { label: "Lists", colour: "260", contents: [block("lists_create_with"), block("lists_length"), block("lists_getIndex"), block("lists_setIndex"), block("lists_isEmpty"), block("lists_indexOf")] },
    functions: { label: "My blocks", colour: "290", custom: "PROCEDURE" },
};

export const toolboxFor = (ids) => ({
    kind: "categoryToolbox",
    contents: (ids?.length ? ids : Object.keys(TOOLBOX)).filter((id) => TOOLBOX[id]).map((id) => {
        const { label, colour, contents, custom } = TOOLBOX[id];
        return custom ? { kind: "category", name: label, colour, custom } : { kind: "category", name: label, colour, contents };
    }),
});

/** A saved workspace as code. Unreadable workspaces produce no code rather than an error. */
export function blocksToCode(json, language = "javascript") {
    const workspace = new Blockly.Workspace();
    try {
        Blockly.serialization.workspaces.load(JSON.parse(json || "{}"), workspace);
        return (language === "python" ? pythonGenerator : javascriptGenerator).workspaceToCode(workspace);
    } catch {
        return "";
    } finally {
        workspace.dispose();
    }
}

export { Blockly };
