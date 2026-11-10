// Builds saved block workspaces (Blockly's JSON) from plain function calls, so a starter program
// can be written in a few readable lines:
//
//   workspace([repeat(4, [forward(100), right(90)])])
//
// Pure data: nothing here needs Blockly, so it also runs where the showcase is built.

const value = (v) => {
    if (v && typeof v === "object") return { block: v };
    return typeof v === "number" ? { block: { type: "math_number", fields: { NUM: v } } } : { block: { type: "text", fields: { TEXT: String(v) } } };
};

/** Links statements top to bottom and returns the first one. */
const stack = (blocks) => {
    const list = blocks.filter(Boolean).map((b) => ({ ...b }));
    for (let i = list.length - 2; i >= 0; i--) list[i].next = { block: list[i + 1] };
    return list[0];
};
const body = (blocks) => (blocks?.length ? { block: stack(blocks) } : undefined);
const inputs = (map) => Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined));
const variable = (name) => ({ id: `var-${name}` });

export const say = (v) => ({ type: "koru_say", inputs: { TEXT: value(v) } });
export const ask = (question) => ({ type: "koru_ask", inputs: { TEXT: value(question) } });
export const askNumber = (question) => ({ type: "koru_ask_number", inputs: { TEXT: value(question) } });
export const join = (...parts) => ({ type: "text_join", extraState: { itemCount: parts.length }, inputs: Object.fromEntries(parts.map((p, i) => [`ADD${i}`, value(p)])) });
export const length = (v) => ({ type: "text_length", inputs: { VALUE: value(v) } });

export const repeat = (times, blocks) => ({ type: "controls_repeat_ext", inputs: inputs({ TIMES: value(times), DO: body(blocks) }) });
export const forever = (blocks) => ({ type: "koru_forever", inputs: inputs({ DO: body(blocks) }) });
export const whileLoop = (condition, blocks) => ({ type: "controls_whileUntil", fields: { MODE: "WHILE" }, inputs: inputs({ BOOL: value(condition), DO: body(blocks) }) });
export const forLoop = (name, from, to, blocks, by = 1) => ({ type: "controls_for", fields: { VAR: variable(name) }, inputs: inputs({ FROM: value(from), TO: value(to), BY: value(by), DO: body(blocks) }) });
export const forEach = (name, list, blocks) => ({ type: "controls_forEach", fields: { VAR: variable(name) }, inputs: inputs({ LIST: value(list), DO: body(blocks) }) });
export const stopLoop = () => ({ type: "controls_flow_statements", fields: { FLOW: "BREAK" } });

export const when = (condition, then) => ({ type: "controls_if", inputs: inputs({ IF0: value(condition), DO0: body(then) }) });
export const whenElse = (condition, then, otherwise) => ({ type: "controls_ifelse", inputs: inputs({ IF0: value(condition), DO0: body(then), ELSE: body(otherwise) }) });
/** op: EQ, NEQ, LT, LTE, GT, GTE */
export const compare = (a, op, b) => ({ type: "logic_compare", fields: { OP: op }, inputs: { A: value(a), B: value(b) } });
/** op: AND, OR */
export const both = (a, op, b) => ({ type: "logic_operation", fields: { OP: op }, inputs: { A: value(a), B: value(b) } });
export const not = (a) => ({ type: "logic_negate", inputs: { BOOL: value(a) } });

/** op: ADD, MINUS, MULTIPLY, DIVIDE, POWER */
export const maths = (a, op, b) => ({ type: "math_arithmetic", fields: { OP: op }, inputs: { A: value(a), B: value(b) } });
export const remainder = (a, b) => ({ type: "math_modulo", inputs: { DIVIDEND: value(a), DIVISOR: value(b) } });
export const randomInt = (from, to) => ({ type: "math_random_int", inputs: { FROM: value(from), TO: value(to) } });

export const setVar = (name, v) => ({ type: "variables_set", fields: { VAR: variable(name) }, inputs: { VALUE: value(v) } });
export const getVar = (name) => ({ type: "variables_get", fields: { VAR: variable(name) } });
export const changeVar = (name, by) => ({ type: "math_change", fields: { VAR: variable(name) }, inputs: { DELTA: value(by) } });

export const list = (...items) => ({ type: "lists_create_with", extraState: { itemCount: items.length }, inputs: Object.fromEntries(items.map((p, i) => [`ADD${i}`, value(p)])) });
export const listLength = (l) => ({ type: "lists_length", inputs: { VALUE: value(l) } });
/** Positions count from 1, the way Blockly shows them. */
export const listGet = (l, position) => ({ type: "lists_getIndex", fields: { MODE: "GET", WHERE: "FROM_START" }, inputs: { VALUE: value(l), AT: value(position) } });
export const listSet = (l, position, v) => ({ type: "lists_setIndex", fields: { MODE: "SET", WHERE: "FROM_START" }, inputs: { LIST: value(l), AT: value(position), TO: value(v) } });
export const listAdd = (l, v) => ({ type: "lists_setIndex", fields: { MODE: "INSERT", WHERE: "LAST" }, inputs: { LIST: value(l), TO: value(v) } });
// "remove" has no output, so Blockly must be told it is a statement block or it can't be stacked.
export const listRemove = (l, position) => ({ type: "lists_getIndex", extraState: { isStatement: true }, fields: { MODE: "REMOVE", WHERE: "FROM_START" }, inputs: { VALUE: value(l), AT: value(position) } });

export const define = (name, blocks) => ({ type: "procedures_defnoreturn", fields: { NAME: name }, inputs: inputs({ STACK: body(blocks) }) });
export const call = (name) => ({ type: "procedures_callnoreturn", extraState: { name } });

export const forward = (n) => ({ type: "turtle_forward", inputs: { N: value(n) } });
export const back = (n) => ({ type: "turtle_back", inputs: { N: value(n) } });
export const right = (n) => ({ type: "turtle_right", inputs: { N: value(n) } });
export const left = (n) => ({ type: "turtle_left", inputs: { N: value(n) } });
export const pen = (mode) => ({ type: "turtle_pen", fields: { MODE: mode === "up" ? "UP" : "DOWN" } });
export const colour = (name) => ({ type: "turtle_colour", fields: { COLOUR: name } });
export const penWidth = (n) => ({ type: "turtle_width", inputs: { N: value(n) } });
export const goTo = (x, y) => ({ type: "turtle_goto", inputs: { X: value(x), Y: value(y) } });
export const fill = (blocks) => ({ type: "turtle_fill", inputs: inputs({ DO: body(blocks) }) });

/** Finds every variable the blocks mention, because a workspace must list them. */
function variablesIn(node, found = new Set()) {
    if (!node || typeof node !== "object") return found;
    if (typeof node.id === "string" && node.id.startsWith("var-")) found.add(node.id.slice(4));
    for (const child of Object.values(node)) variablesIn(child, found);
    return found;
}

/**
 * @param stacks one array of statements per separate pile of blocks (most programs have one)
 * @returns the workspace as the JSON string the code block stores
 */
export function workspace(...stacks) {
    const top = stacks.map((blocks, i) => ({ ...stack(blocks), x: 30 + i * 320, y: 30 }));
    const names = [...variablesIn(top)];
    return JSON.stringify({
        blocks: { languageVersion: 0, blocks: top },
        ...(names.length ? { variables: names.map((name) => ({ name, id: `var-${name}` })) } : {}),
    });
}
