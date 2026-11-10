/**
 * Boolean expressions for the logic gates block.
 *
 * Precedence, tightest first: NOT, then AND / NAND, then XOR, then OR / NOR.
 * Symbols: & is AND, | is OR, ! is NOT, ^ is XOR. Variables are single letters A to Z.
 */

export const MAX_VARIABLES = 4;
const HELP = "I can't read that. Try: (A AND B) OR NOT C";
const WORDS = { AND: "and", OR: "or", NOT: "not", XOR: "xor", NAND: "nand", NOR: "nor" };
const SYMBOLS = { "&": "and", "|": "or", "!": "not", "^": "xor", "(": "(", ")": ")" };

function tokenize(text) {
    const tokens = [];
    const re = /\s*(?:([A-Za-z]+)|([&|!^()])|(\S))/y;
    let m;
    while (re.lastIndex < text.length && (m = re.exec(text))) {
        if (m[3]) throw new Error(HELP);
        if (m[2]) tokens.push(SYMBOLS[m[2]]);
        else if (m[1].length === 1) tokens.push({ name: m[1].toUpperCase() });
        else if (WORDS[m[1].toUpperCase()]) tokens.push(WORDS[m[1].toUpperCase()]);
        else throw new Error(HELP);
    }
    return tokens;
}

export function parseLogic(text) {
    const tokens = tokenize(String(text ?? ""));
    let i = 0;
    const peek = () => tokens[i];

    const binary = (next, ops) => () => {
        let left = next();
        while (ops.includes(peek())) {
            const type = tokens[i++];
            left = { type, left, right: next() };
        }
        return left;
    };
    const primary = () => {
        const t = tokens[i++];
        if (t === "not") return { type: "not", arg: primary() };
        if (t === "(") {
            const inner = or();
            if (tokens[i++] !== ")") throw new Error(HELP);
            return inner;
        }
        if (t && typeof t === "object") return { type: "var", name: t.name };
        throw new Error(HELP);
    };
    const and = binary(primary, ["and", "nand"]);
    const xor = binary(and, ["xor"]);
    const or = binary(xor, ["or", "nor"]);

    const ast = or();
    if (i !== tokens.length) throw new Error(HELP);
    if (variables(ast).length > MAX_VARIABLES) throw new Error(`Use at most ${MAX_VARIABLES} different letters, for example A, B, C and D.`);
    return ast;
}

export function variables(ast) {
    const found = new Set();
    const walk = (n) => {
        if (n.type === "var") found.add(n.name);
        else if (n.type === "not") walk(n.arg);
        else { walk(n.left); walk(n.right); }
    };
    walk(ast);
    return [...found].sort();
}

export function evaluate(ast, env) {
    switch (ast.type) {
        case "var": return Boolean(env[ast.name]);
        case "not": return !evaluate(ast.arg, env);
        default: {
            const a = evaluate(ast.left, env);
            const b = evaluate(ast.right, env);
            return { and: a && b, or: a || b, xor: a !== b, nand: !(a && b), nor: !(a || b) }[ast.type];
        }
    }
}

/** Every combination of inputs, counting up in binary with the first letter as the biggest bit. */
export function truthTable(ast) {
    const vars = variables(ast);
    const rows = Array.from({ length: 2 ** vars.length }, (_, r) => {
        const env = Object.fromEntries(vars.map((v, k) => [v, Boolean((r >> (vars.length - 1 - k)) & 1)]));
        return { env, output: evaluate(ast, env) };
    });
    return { vars, rows };
}
