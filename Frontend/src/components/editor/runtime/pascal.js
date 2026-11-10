/*
 * pascal.js: a small interpreter for the Delphi-style console Pascal taught in
 * Grade 10-12 IT. It runs inside a Web Worker, so it has no dependencies and
 * never uses eval.
 *
 *   runPascal(source, { stdin, maxSteps, maxOutput }) -> { stdout, error }
 *
 * Pipeline: tokenize -> parse (recursive descent, every node keeps its line)
 * -> setup (declarations, types, an "is every name declared?" check) -> run
 * (tree-walking evaluator). It never throws: problems come back as
 * error = { message, line } in plain words.
 *
 * Output choices (where Delphi's exact text was not certain):
 * - A real number written without a width (WriteLn(x), FloatToStr(x)) prints
 *   in its shortest natural form, rounded to 15 significant digits: 3.14, 2.5,
 *   10, 0.3. Delphi's own WriteLn prints " 3.14000000000000E+0000"; we chose
 *   the readable form on purpose. x:w:d prints fixed decimals like Delphi;
 *   x:w (real, no decimals) prints the natural form padded to width w.
 * - Booleans print as TRUE / FALSE, like Delphi's Write.
 * - #13#10, #13 and #10 all print as a single newline.
 * - ffCurrency and Format('%m') print "R1,234.50" (R prefix, comma thousands).
 *
 * Error messages that are about a line of code start with "Line N: ". The
 * four limit messages (steps, output, recursion, input) are given word for word.
 */

const MAX_DEPTH = 2000;
const MAX_ITEMS = 2000000;
const MAX_TEXT = 1000000;

const MSG = {
  steps: "Your program ran for too long and was stopped. Check your loops: one of them may never end.",
  output: "Your program printed too much. Is a loop running forever?",
  depth: "The program called itself too many times. Check that your recursion has a stopping condition.",
  input: "The program asked for input, but there was nothing left to read. Add another line to the Input box.",
};

// ---------------------------------------------------------------- errors

class PascalError extends Error {
  constructor(message, line, extra = {}) {
    super(message);
    this.line = line ?? null;
    this.catchable = !!extra.catchable; // try..except may catch it
    this.ex = extra.ex || "Exception"; // Delphi exception class name
    this.bare = extra.bare ?? message; // message without "Line N: "
    this.obj = extra.obj || null; // the exception object, for raise
  }
}
class HaltSignal {}

const where = (line, msg) => (line ? `Line ${line}: ${msg}` : msg);
const fail = (line, msg) => new PascalError(where(line, msg), line); // compile-style mistake
const rt = (line, msg, ex) => new PascalError(where(line, msg), line, { catchable: true, ex, bare: msg });
const limit = (msg, line) => new PascalError(msg, line); // resource limit, exact text

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const given = (n) => (n === 0 ? "none were given" : `${n} ${n === 1 ? "was" : "were"} given`);

// ---------------------------------------------------------------- types

const T = {
  int: { k: "int", name: "Integer" },
  real: { k: "real", name: "Real" },
  str: { k: "str", name: "String" },
  char: { k: "char", name: "Char" },
  bool: { k: "bool", name: "Boolean" },
  nil: { k: "nil", name: "nil" },
  none: { k: "none", name: "nothing" },
};
const isNum = (t) => t.k === "int" || t.k === "real";
const isText = (t) => t.k === "str" || t.k === "char";
const isOrd = (t) => t.k === "int" || t.k === "char" || t.k === "bool";
const numTy = (a, b) => (a.k === "int" && b.k === "int" ? T.int : T.real);

function kindWord(t) {
  switch (t.k) {
    case "int": return "a whole number";
    case "real": return "a real number";
    case "str": return "text";
    case "char": return "a character";
    case "bool": return "True/False";
    case "array": return "an array";
    case "class": return `a ${t.raw} object`;
    case "nil": return "nil";
    default: return "nothing";
  }
}

function article(t) {
  switch (t.k) {
    case "int": return "an Integer";
    case "real": return "a Real";
    case "str": return "a String";
    case "char": return "a Char";
    case "bool": return "a Boolean";
    case "array": return "an array";
    case "class": return `a ${t.raw}`;
    default: return kindWord(t);
  }
}

function isA(sub, sup) {
  for (let c = sub; c; c = c.parent) if (c === sup) return true;
  return false;
}

function compatible(a, b) {
  if (a.k !== b.k) return false;
  if (a.k === "array") return compatible(a.elem, b.elem);
  if (a.k === "class") return isA(b, a);
  return true;
}

function ordOf(v, t) {
  if (t.k === "char") return v.charCodeAt(0);
  if (t.k === "bool") return v ? 1 : 0;
  return v;
}

function fromOrd(o, t) {
  if (t.k === "char") return String.fromCharCode(o);
  if (t.k === "bool") return o !== 0;
  return o;
}

function findMember(cls, name) {
  for (let c = cls; c; c = c.parent) {
    if (c.fields.has(name)) return { what: "field", info: c.fields.get(name) };
    if (c.methods.has(name)) return { what: "method", info: c.methods.get(name) };
    if (c.props.has(name)) return { what: "prop", info: c.props.get(name) };
  }
  return null;
}

function makeClass(raw, parent) {
  return { k: "class", name: raw.toLowerCase(), raw, parent, fields: new Map(), methods: new Map(), props: new Map() };
}

// Static arrays are values in Pascal: copy them (and fixed arrays inside them).
function copyArray(arr) {
  const items = arr.items.map((x) => (x && typeof x === "object" && x.items && !x.ty.dyn ? copyArray(x) : x));
  return { ty: arr.ty, lo: arr.lo, items };
}

// Source-like text for a node, used in messages ("arrMarks[i]", "objL.fName").
function describe(n) {
  switch (n.k) {
    case "id": return n.raw;
    case "field": return `${describe(n.obj)}.${n.raw}`;
    case "index": return `${describe(n.obj)}[${n.idx.map((x) => (x.k === "id" || x.k === "lit" ? describe(x) : "...")).join(", ")}]`;
    case "call": return `${describe(n.callee)}(...)`;
    case "lit": return isText(n.ty) ? `'${n.v}'` : String(n.v);
    default: return "this value";
  }
}

// ---------------------------------------------------------------- number and text helpers

// Shortest natural form, rounded to 15 significant digits (see the header).
function fmtReal(x) {
  if (Number.isNaN(x)) return "NAN";
  if (!Number.isFinite(x)) return x > 0 ? "INF" : "-INF";
  return String(Number(x.toPrecision(15))).replace("e+", "E").replace("e-", "E-");
}

const fixed = (v, d) => v.toFixed(Math.min(Math.max(d, 0), 20));

function thousands(s) {
  const neg = s[0] === "-";
  const [a, b] = (neg ? s.slice(1) : s).split(".");
  return (neg ? "-" : "") + a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b !== undefined ? "." + b : "");
}

// Delphi's Round rounds halves to the even neighbour (banker's rounding).
function bankers(x) {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

function trimText(s, left = true, right = true) {
  let a = 0, b = s.length;
  if (left) while (a < b && s.charCodeAt(a) <= 32) a++;
  if (right) while (b > a && s.charCodeAt(b - 1) <= 32) b--;
  return s.slice(a, b);
}

function parseWhole(s) {
  const t = s.trim();
  if (/^[+-]?\d+$/.test(t)) return Number(t);
  if (/^\$[0-9a-f]+$/i.test(t)) return parseInt(t.slice(1), 16);
  return null;
}

function toWhole(s, line, ex = "EConvertError") {
  const v = parseWhole(s);
  if (v === null) throw rt(line, `'${s}' is not a valid whole number.`, ex);
  return v;
}

function toReal(s, line, ex = "EConvertError") {
  const t = s.trim();
  if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return Number(t);
  throw rt(line, `'${s}' is not a valid number.`, ex);
}

function floatToStrF(v, f, p, d) {
  const prec = Math.min(Math.max(p, 1), 18);
  const r = Number(v.toPrecision(prec));
  switch (f) {
    case 1: { // ffExponent
      const [m, e] = v.toExponential(prec - 1).split("e");
      return `${m}E${e[0] === "-" ? "-" : "+"}${String(Math.abs(+e)).padStart(d, "0")}`;
    }
    case 2: return fixed(r, d); // ffFixed
    case 3: return thousands(fixed(r, d)); // ffNumber
    case 4: return (r < 0 ? "-R" : "R") + thousands(fixed(Math.abs(r), d)); // ffCurrency
    default: return fmtReal(r); // ffGeneral
  }
}

// FormatFloat('0.00', x), '#,##0.00', 'R 0.00', '0.0#'.
function formatFloat(fmt, x) {
  const f = fmt.split(";")[0].replace(/"([^"]*)"|'([^']*)'/g, (_, a, b) => a ?? b);
  const m = f.match(/[0#][0#,]*(\.[0#]*)?|\.[0#]+/);
  if (!m) return f;
  const pre = f.slice(0, m.index), post = f.slice(m.index + m[0].length);
  const [ip, dp = ""] = m[0].split(".");
  const minDec = dp.match(/^0*/)[0].length, minInt = (ip.replace(/,/g, "").match(/0+$/) || [""])[0].length;
  let [a, b = ""] = fixed(Math.abs(x), dp.length).split(".");
  while (b.length > minDec && b.endsWith("0")) b = b.slice(0, -1);
  if (minInt === 0 && a === "0") a = "";
  a = a.padStart(minInt, "0");
  if (ip.includes(",")) a = thousands(a);
  const neg = x < 0 && /[1-9]/.test(a + b);
  return (neg ? "-" : "") + pre + a + (b ? "." + b : "") + post;
}

// ---------------------------------------------------------------- tokenizer

const KEYWORDS = new Set((
  "and array as begin case class const constructor destructor div do downto else end except finally for " +
  "function goto if in inherited is label mod nil not of or procedure program property raise record repeat " +
  "set shl shr then to try type until uses var while with xor"
).split(" "));

const isDigit = (c) => c >= "0" && c <= "9";
const isHex = (c) => /[0-9A-Fa-f]/.test(c || "");

function tokenize(src) {
  const toks = [];
  const n = src.length;
  let i = 0, line = 1;
  while (i < n) {
    const c = src[i], start = i, ln = line;
    if (c === "\n") { line++; i++; continue; }
    if (c <= " " || c === "﻿" || c === " ") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "{" || (c === "(" && src[i + 1] === "*")) { // comments and {$directives}
      const close = c === "{" ? "}" : "*)";
      const end = src.indexOf(close, i + (c === "{" ? 1 : 2));
      if (end < 0) throw fail(ln, `This comment is never closed. Add "${close}" where it should end.`);
      for (let k = i; k < end; k++) if (src[k] === "\n") line++;
      i = end + close.length;
      continue;
    }
    if (isDigit(c)) {
      let real = false;
      while (isDigit(src[i])) i++;
      if (src[i] === "." && isDigit(src[i + 1])) { real = true; i++; while (isDigit(src[i])) i++; }
      if ((src[i] === "e" || src[i] === "E") && (isDigit(src[i + 1]) || ("+-".includes(src[i + 1] || "x") && isDigit(src[i + 2])))) {
        real = true;
        i += 2;
        while (isDigit(src[i])) i++;
      }
      toks.push({ t: "num", v: Number(src.slice(start, i)), real, raw: src.slice(start, i), line: ln });
      continue;
    }
    if (c === "$" && isHex(src[i + 1])) {
      i++;
      while (isHex(src[i])) i++;
      toks.push({ t: "num", v: parseInt(src.slice(start + 1, i), 16), real: false, raw: src.slice(start, i), line: ln });
      continue;
    }
    if (c === "'" || c === "#") { // 'text', 'it''s', #13#10, joined together
      let v = "";
      while (src[i] === "'" || src[i] === "#") {
        if (src[i] === "'") {
          i++;
          for (;;) {
            if (i >= n || src[i] === "\n") throw fail(ln, "This text in quotes is never closed. Add a ' at the end of it.");
            if (src[i] === "'") {
              if (src[i + 1] === "'") { v += "'"; i += 2; continue; }
              i++;
              break;
            }
            v += src[i++];
          }
        } else {
          i++;
          let code;
          if (src[i] === "$") { const s0 = ++i; while (isHex(src[i])) i++; code = parseInt(src.slice(s0, i), 16); }
          else { const s0 = i; while (isDigit(src[i])) i++; code = parseInt(src.slice(s0, i), 10); }
          if (Number.isNaN(code)) throw fail(ln, 'After "#" put a character code, like #65 for the letter A.');
          v += String.fromCharCode(code);
        }
      }
      toks.push({ t: "str", v, raw: src.slice(start, i), line: ln });
      continue;
    }
    if (c === '"') throw fail(ln, "Pascal puts text in single quotes, like 'Hello'. Change the double quotes to single quotes.");
    if (/[A-Za-z_]/.test(c)) {
      while (i < n && /[A-Za-z0-9_]/.test(src[i])) i++;
      const raw = src.slice(start, i), v = raw.toLowerCase();
      toks.push({ t: KEYWORDS.has(v) ? "kw" : "id", v, raw, line: ln });
      continue;
    }
    const two = src.slice(i, i + 2);
    if ([":=", "<=", ">=", "<>", ".."].includes(two)) { toks.push({ t: "sym", v: two, raw: two, line: ln }); i += 2; continue; }
    if ("+-*/=<>()[],;:.^@".includes(c)) { toks.push({ t: "sym", v: c, raw: c, line: ln }); i++; continue; }
    throw fail(ln, `I don't understand the character "${c}".`);
  }
  toks.push({ t: "eof", v: "", raw: "", line });
  return toks;
}

// ---------------------------------------------------------------- parser

const ROUTINE_KW = ["procedure", "function", "constructor", "destructor"];
const VIS = new Set(["private", "protected", "public", "published"]);
const DIRECTIVES = new Set(["forward", "virtual", "override", "abstract", "overload", "reintroduce", "dynamic", "static", "inline", "stdcall", "register", "cdecl", "final"]);
const REL = new Set(["=", "<>", "<", ">", "<=", ">="]);

class Parser {
  constructor(toks) { this.toks = toks; this.p = 0; }
  get tok() { return this.toks[this.p]; }
  peek(k = 1) { return this.toks[Math.min(this.p + k, this.toks.length - 1)]; }
  next() { const t = this.toks[this.p]; if (t.t !== "eof") this.p++; return t; }
  is(v, t = this.tok) { return (t.t === "kw" || t.t === "sym") && t.v === v; }
  isId(v) { return this.tok.t === "id" && this.tok.v === v; }
  accept(v) { if (this.is(v)) { this.next(); return true; } return false; }
  expect(v) { if (!this.is(v)) this.expected(`"${v}"`); return this.next(); }
  ident(what) { if (this.tok.t !== "id") this.expected(what); return this.next(); }

  expected(what) {
    const t = this.tok, prev = this.toks[this.p - 1];
    if (t.t === "eof") throw fail(t.line, `I expected ${what} but reached the end of the program.` + (what === '"end"' ? ' Every "begin" needs a matching "end".' : ""));
    if (what === '";"' && prev && prev.line < t.line) throw fail(t.line, `I expected ";" before "${t.raw}". Is the line above missing a semicolon?`);
    throw fail(t.line, `I expected ${what} but found "${t.raw}".`);
  }

  program() {
    if (this.accept("program")) { this.ident("the program's name"); this.expect(";"); }
    if (this.accept("uses")) {
      do {
        this.ident("a unit name");
        while (this.accept(".")) this.ident("a unit name");
        if (this.accept("in")) this.next();
      } while (this.accept(","));
      this.expect(";");
    }
    const decls = this.decls();
    if (!this.is("begin")) this.expected('"begin" (the start of the main program)');
    const line = this.next().line;
    const body = this.stmtList();
    this.expect("end");
    const okEnd = this.accept(".") || this.tok.t === "eof" || (this.is(";") && this.peek().t === "eof");
    if (!okEnd) throw fail(this.tok.line, `I expected "." after the last "end" but found "${this.tok.raw}". Check that every "begin" has exactly one "end".`);
    return { decls, body, line };
  }

  // const / type / var sections and routines, in any order.
  decls() {
    const out = [];
    for (;;) {
      if (this.accept("const")) {
        while (this.tok.t === "id") {
          const n = this.next();
          const type = this.accept(":") ? this.type() : null;
          this.expect("=");
          out.push({ k: "const", name: n.v, raw: n.raw, line: n.line, type, e: this.init(type) });
          this.expect(";");
        }
      } else if (this.accept("type")) {
        while (this.tok.t === "id") {
          const n = this.next();
          this.expect("=");
          const type = this.is("class") ? this.classDecl() : this.type();
          out.push({ k: "type", name: n.v, raw: n.raw, line: n.line, type });
          this.expect(";");
        }
      } else if (this.accept("var")) {
        while (this.tok.t === "id") {
          const names = this.idList();
          this.expect(":");
          const type = this.type();
          const e = this.accept("=") ? this.init(type) : null;
          out.push({ k: "var", names, type, e, line: names[0].line });
          this.expect(";");
        }
      } else if (ROUTINE_KW.some((v) => this.is(v))) {
        out.push(this.routine());
      } else if (this.is("class") && ROUTINE_KW.some((v) => this.is(v, this.peek()))) {
        throw fail(this.tok.line, "Class methods (class procedure / class function) are not supported here yet.");
      } else {
        return out;
      }
    }
  }

  idList() {
    const names = [this.ident("a name")];
    while (this.accept(",")) names.push(this.ident("a name"));
    return names;
  }

  // A constant value, or (1, 2, 3) for a fixed-size array.
  init(type) {
    if (!type || type.k !== "array" || type.dyn) return this.expr();
    const line = this.expect("(").line, items = [];
    do items.push(this.init(type.elem)); while (this.accept(","));
    this.expect(")");
    return { k: "list", items, line };
  }

  type() {
    const t = this.tok;
    if (this.accept("array")) {
      if (this.accept("[")) {
        const ranges = [];
        do {
          const lo = this.expr();
          this.expect("..");
          ranges.push({ lo, hi: this.expr() });
        } while (this.accept(","));
        this.expect("]");
        this.expect("of");
        let elem = this.type();
        for (let r = ranges.length - 1; r >= 0; r--) elem = { k: "array", lo: ranges[r].lo, hi: ranges[r].hi, elem, line: t.line };
        return elem;
      }
      this.expect("of");
      return { k: "array", dyn: true, elem: this.type(), line: t.line };
    }
    if (this.is("record")) throw fail(t.line, "Records are not supported here yet. Use a class or separate arrays instead.");
    if (this.is("set")) throw fail(t.line, "Set types are not supported here yet.");
    if (this.is("(")) throw fail(t.line, "Enumerated types like (Red, Green, Blue) are not supported here yet.");
    if (this.is("class")) throw fail(t.line, "Declare a class in the type section, like: type TLearner = class ... end;");
    if (t.t === "id") {
      this.next();
      if (t.v === "string" && this.accept("[")) { this.expr(); this.expect("]"); }
      return { k: "named", name: t.v, raw: t.raw, line: t.line };
    }
    if (t.t === "num") throw fail(t.line, "Range types like 1..10 are not supported here. Use Integer instead.");
    this.expected("a type, like Integer, Real, String, Char or Boolean");
  }

  classDecl() {
    const line = this.expect("class").line;
    let parent = null;
    if (this.accept("(")) { parent = this.ident("the parent class name"); this.expect(")"); }
    if (this.is(";")) throw fail(line, "Forward class declarations (TName = class;) are not supported here.");
    const c = { k: "class", parent, fields: [], methods: [], props: [], line };
    let vis = "public";
    while (!this.is("end")) {
      const t = this.tok;
      if (t.t === "eof") this.expected('"end"');
      if (t.t === "id" && VIS.has(t.v)) { this.next(); vis = t.v; continue; }
      if (t.t === "id" && t.v === "strict") { this.next(); vis = this.ident('"private" or "protected"').v; continue; }
      if (this.accept("var")) continue;
      if (ROUTINE_KW.some((v) => this.is(v))) {
        const h = this.heading(true);
        h.vis = vis;
        c.methods.push(h);
        continue;
      }
      if (this.accept("property")) {
        const n = this.ident("the property name");
        this.expect(":");
        const type = this.type();
        let read = null, write = null;
        while (this.isId("read") || this.isId("write")) {
          const which = this.next().v, target = this.ident("a field or method name");
          if (which === "read") read = target; else write = target;
        }
        this.expect(";");
        c.props.push({ name: n.v, raw: n.raw, type, read, write, vis, line: n.line });
        continue;
      }
      if (t.t === "id") {
        const names = this.idList();
        this.expect(":");
        c.fields.push({ names, type: this.type(), vis, line: t.line });
        this.expect(";");
        continue;
      }
      if (this.is("class")) throw fail(t.line, "Class methods and class variables are not supported here yet.");
      this.expected('a field, a method or "end"');
    }
    this.next();
    return c;
  }

  heading(inClass) {
    const kw = this.next();
    let n = this.ident(`a name for the ${kw.v}`), cls = null;
    if (!inClass && this.accept(".")) { cls = n; n = this.ident("a method name"); }
    const params = [];
    if (this.accept("(")) {
      if (!this.is(")")) do params.push(...this.paramGroup()); while (this.accept(";"));
      this.expect(")");
    }
    let ret = null;
    if (this.accept(":")) ret = this.type();
    else if (kw.v === "function" && !cls) this.expected('":" and the type of value the function gives back');
    this.expect(";");
    const h = { k: "routine", kind: kw.v, name: n.v, raw: n.raw, cls: cls && cls.v, clsRaw: cls && cls.raw, params, ret, line: kw.line, forward: false, abstract: false };
    while (this.tok.t === "id" && DIRECTIVES.has(this.tok.v)) {
      const d = this.next().v;
      if (d === "forward") h.forward = true;
      if (d === "abstract") h.abstract = true;
      this.expect(";");
    }
    return h;
  }

  paramGroup() {
    let mode = "val";
    if (this.accept("var")) mode = "var";
    else if (this.accept("const")) mode = "const";
    else if (this.isId("out") && this.peek().t === "id") { this.next(); mode = "var"; }
    const names = this.idList();
    if (!this.is(":")) this.expected('":" and a type for this parameter');
    this.next();
    let type;
    if (this.is("array") && this.is("of", this.peek())) {
      const line = this.next().line;
      this.next();
      type = { k: "array", dyn: true, open: true, elem: this.type(), line };
    } else type = this.type();
    if (this.is("=")) throw fail(this.tok.line, "Default values for parameters are not supported here yet.");
    return names.map((n) => ({ name: n.v, raw: n.raw, mode, type }));
  }

  routine() {
    const h = this.heading(false);
    if (h.forward) return h;
    h.decls = this.decls();
    if (!this.is("begin")) this.expected(`"begin" (the start of ${h.raw})`);
    h.bodyLine = this.next().line;
    h.body = this.stmtList();
    this.expect("end");
    if (this.is(".")) throw fail(this.tok.line, `Only the main program ends with "end." so end ${h.raw} with "end;" instead.`);
    this.expect(";");
    return h;
  }

  // Statements separated by ";" up to end / until / except / finally.
  stmtList() {
    const list = [];
    for (;;) {
      const s = this.stmt();
      if (s) list.push(s);
      if (this.accept(";")) continue;
      if (this.tok.t === "eof") this.expected('"end"');
      if (["end", "until", "except", "finally"].some((v) => this.is(v))) return list;
      this.expected('";"');
    }
  }

  stmt() {
    const t = this.tok, line = t.line;
    if (t.t === "eof" || this.is(";")) return null;
    if (t.t === "kw") {
      switch (t.v) {
        case "end": case "until": case "except": case "finally": return null;
        case "else": throw fail(line, 'Remove the ";" just before "else". In Pascal there is never a semicolon directly before else.');
        case "begin": {
          this.next();
          const stmts = this.stmtList();
          this.expect("end");
          return { k: "block", stmts, line };
        }
        case "if": {
          this.next();
          const cond = this.expr();
          if (this.is(":=")) throw fail(this.tok.line, "Use = to compare in a condition. := is only for giving a variable a value.");
          this.expect("then");
          const then = this.is("else") ? null : this.stmt();
          const els = this.accept("else") ? this.stmt() : null;
          return { k: "if", cond, then, els, line };
        }
        case "case": return this.caseStmt();
        case "for": {
          this.next();
          const v = this.ident("the loop counter variable");
          if (this.is("in")) throw fail(line, "for ... in loops are not supported here. Use for i := Low(a) to High(a) do.");
          this.expect(":=");
          const from = this.expr();
          let dir = 0;
          if (this.accept("to")) dir = 1;
          else if (this.accept("downto")) dir = -1;
          else this.expected('"to" or "downto"');
          const to = this.expr();
          this.expect("do");
          return { k: "for", v: { k: "id", name: v.v, raw: v.raw, line: v.line }, from, to, dir, body: this.stmt(), line };
        }
        case "while": {
          this.next();
          const cond = this.expr();
          this.expect("do");
          return { k: "while", cond, body: this.stmt(), line };
        }
        case "repeat": {
          this.next();
          const body = this.stmtList();
          this.expect("until");
          return { k: "repeat", body, cond: this.expr(), line };
        }
        case "try": return this.tryStmt();
        case "raise": {
          this.next();
          const e = this.is(";") || this.is("end") ? null : this.expr();
          return { k: "raise", e, line };
        }
        case "inherited": return { k: "callstmt", e: this.inherited(), line };
        case "with": throw fail(line, '"with" is not supported here. Write the object name in front of each field instead.');
        case "goto": case "label": throw fail(line, '"goto" is not supported. Use a loop instead.');
      }
    }
    if (t.t === "id") {
      const target = this.designator();
      if (this.accept(":=")) return { k: "assign", target, e: this.expr(), line };
      if (this.is("=")) throw fail(this.tok.line, "Use := to give a variable a value. A single = is only for comparing.");
      return { k: "callstmt", e: target, line };
    }
    throw fail(line, `I expected a statement but found "${t.raw}".`);
  }

  caseStmt() {
    const line = this.next().line;
    const sel = this.expr();
    this.expect("of");
    const branches = [];
    let els = null;
    while (!this.is("end")) {
      if (this.tok.t === "eof") this.expected('"end"');
      if (this.accept("else")) { els = this.stmtList(); break; }
      const labels = [];
      do {
        const a = this.expr();
        labels.push({ a, b: this.accept("..") ? this.expr() : null });
      } while (this.accept(","));
      this.expect(":");
      branches.push({ labels, s: this.stmt() });
      if (!this.accept(";") && !this.is("else")) break;
    }
    this.expect("end");
    return { k: "case", sel, branches, els, line };
  }

  tryStmt() {
    const line = this.next().line;
    const body = this.stmtList();
    if (this.accept("finally")) {
      const fin = this.stmtList();
      this.expect("end");
      return { k: "try", body, fin, line };
    }
    if (!this.accept("except")) this.expected('"except" or "finally"');
    const node = { k: "try", body, handler: null, handlers: null, els: null, line };
    if (this.isId("on")) {
      node.handlers = [];
      while (this.isId("on")) {
        this.next();
        let v = null, tn = this.ident("an exception type, like Exception");
        if (this.accept(":")) { v = tn; tn = this.ident("an exception type, like Exception"); }
        this.expect("do");
        node.handlers.push({ v: v && { name: v.v, raw: v.raw }, type: { k: "named", name: tn.v, raw: tn.raw, line: tn.line }, s: this.stmt() });
        if (!this.accept(";")) break;
      }
      if (this.accept("else")) node.els = this.stmtList();
    } else node.handler = this.stmtList();
    this.expect("end");
    return node;
  }

  inherited() {
    const line = this.next().line;
    let name = null, raw = null, args = null;
    if (this.tok.t === "id") {
      const n = this.next();
      name = n.v;
      raw = n.raw;
      args = this.is("(") ? this.args() : [];
    }
    return { k: "inherited", name, raw, args, line };
  }

  // expr = simple [relop simple]   (standard Pascal precedence)
  expr() {
    const l = this.simple();
    if (!this.isRel()) return l;
    const op = this.next();
    const e = { k: "bin", op: op.v, l, r: this.simple(), line: op.line };
    if (this.isRel()) throw fail(this.tok.line, "Put brackets around each comparison when you join them with and/or, like: (x > 0) and (x < 10).");
    return e;
  }
  isRel() { const t = this.tok; return (t.t === "sym" && REL.has(t.v)) || this.is("in"); }
  simple() {
    let l = this.term();
    while (this.is("+") || this.is("-") || this.is("or") || this.is("xor")) {
      const op = this.next();
      l = { k: "bin", op: op.v, l, r: this.term(), line: op.line };
    }
    return l;
  }
  term() {
    let l = this.factor();
    while (["*", "/", "div", "mod", "and", "shl", "shr"].some((v) => this.is(v))) {
      const op = this.next();
      l = { k: "bin", op: op.v, l, r: this.factor(), line: op.line };
    }
    return l;
  }
  factor() {
    const t = this.tok, line = t.line;
    if (t.t === "num") { this.next(); return { k: "lit", v: t.v, ty: t.real ? T.real : T.int, line }; }
    if (t.t === "str") { this.next(); return { k: "lit", v: t.v, ty: t.v.length === 1 ? T.char : T.str, line }; }
    if (t.t === "id") return this.designator();
    if (this.accept("(")) { const e = this.expr(); this.expect(")"); return e; }
    if (this.accept("not")) return { k: "un", op: "not", e: this.factor(), line };
    if (this.accept("-")) return { k: "un", op: "-", e: this.factor(), line };
    if (this.accept("+")) return { k: "un", op: "+", e: this.factor(), line };
    if (this.accept("nil")) return { k: "lit", v: null, ty: T.nil, line };
    if (this.accept("[")) {
      const items = [];
      if (!this.is("]")) do {
        const a = this.expr();
        items.push({ a, b: this.accept("..") ? this.expr() : null });
      } while (this.accept(","));
      this.expect("]");
      return { k: "set", items, line };
    }
    if (this.is("inherited")) return this.inherited();
    if (this.is("=")) throw fail(line, "Use a single = to compare two values in Pascal.");
    this.expected("a value or a variable");
  }

  designator() {
    const t = this.next();
    let node = { k: "id", name: t.v, raw: t.raw, line: t.line };
    for (;;) {
      const line = this.tok.line;
      if (this.is("[")) {
        this.next();
        const idx = [this.expr()];
        while (this.accept(",")) idx.push(this.expr());
        this.expect("]");
        node = { k: "index", obj: node, idx, line };
      } else if (this.is(".") && this.peek().t === "id") {
        this.next();
        const n = this.next();
        node = { k: "field", obj: node, name: n.v, raw: n.raw, line: n.line };
      } else if (this.is("(")) {
        node = { k: "call", callee: node, args: this.args(), line: node.line };
      } else if (this.is("^")) {
        throw fail(line, "Pointers (^) are not supported here.");
      } else return node;
    }
  }

  // Call arguments; Write-style x:8:2 becomes a "fmt" node.
  args() {
    this.expect("(");
    const list = [];
    if (!this.is(")")) do {
      let e = this.expr();
      if (this.is(":")) {
        const line = this.next().line;
        const w = this.expr();
        e = { k: "fmt", e, w, p: this.accept(":") ? this.expr() : null, line };
      }
      list.push(e);
    } while (this.accept(","));
    this.expect(")");
    return list;
  }
}

// ---------------------------------------------------------------- built-in routines

// Spec letters: n number, i whole number, s text, c char, b boolean,
// o ordinal, x anything; "?" marks where optional values start.
// Each fn returns [value, type], or null for a procedure.
const BUILTIN = {
  length: ["x", ([v], [t], line) => {
    if (isText(t)) return [v.length, T.int];
    if (t.k === "array") return [v.items.length, T.int];
    throw fail(line, `Length needs text or an array, but this is ${kindWord(t)}.` + (isNum(t) ? " To count digits, use Length(IntToStr(x))." : ""));
  }],
  copy: ["si?i", ([s, i, n = Infinity]) => {
    const st = Math.max(i, 1) - 1;
    return [n <= 0 ? "" : s.slice(st, st + n), T.str];
  }],
  pos: ["ss", ([sub, s]) => [sub ? s.indexOf(sub) + 1 : 0, T.int]],
  uppercase: ["s", ([s]) => [s.toUpperCase(), T.str]],
  lowercase: ["s", ([s]) => [s.toLowerCase(), T.str]],
  upcase: ["s", ([s], [t]) => [s.toUpperCase(), t]],
  trim: ["s", ([s]) => [trimText(s), T.str]],
  trimleft: ["s", ([s]) => [trimText(s, true, false), T.str]],
  trimright: ["s", ([s]) => [trimText(s, false, true), T.str]],
  stringofchar: ["ci", ([c, n], _t, line) => {
    if (n > MAX_TEXT) throw fail(line, "That text would be too long (more than a million characters).");
    return [n > 0 ? c.repeat(n) : "", T.str];
  }],
  sametext: ["ss", ([a, b]) => [a.toLowerCase() === b.toLowerCase(), T.bool]],
  inttostr: ["i", ([v]) => [String(v), T.str]],
  strtoint: ["s", ([s], _t, line) => [toWhole(s, line), T.int]],
  strtointdef: ["si", ([s, d]) => [parseWhole(s) ?? d, T.int]],
  floattostr: ["n", ([v]) => [fmtReal(v), T.str]],
  strtofloat: ["s", ([s], _t, line) => [toReal(s, line), T.real]],
  floattostrf: ["nii?i", ([v, f, p, d = 2]) => [floatToStrF(v, f, p, d), T.str]],
  formatfloat: ["sn", ([f, v]) => [formatFloat(f, v), T.str]],
  booltostr: ["b?b", ([b, words = false]) => [words ? (b ? "True" : "False") : b ? "-1" : "0", T.str]],
  round: ["n", ([v]) => [bankers(v), T.int]],
  trunc: ["n", ([v]) => [Math.trunc(v), T.int]],
  int: ["n", ([v]) => [Math.trunc(v), T.real]],
  frac: ["n", ([v]) => [v - Math.trunc(v), T.real]],
  abs: ["n", ([v], [t]) => [Math.abs(v), t]],
  sqr: ["n", ([v], [t]) => [v * v, t]],
  sqrt: ["n", ([v], _t, line) => {
    if (v < 0) throw rt(line, `Sqrt cannot work with a negative number (${fmtReal(v)}).`, "EInvalidOp");
    return [Math.sqrt(v), T.real];
  }],
  power: ["nn", ([a, b]) => [Math.pow(a, b), T.real]],
  exp: ["n", ([v]) => [Math.exp(v), T.real]],
  ln: ["n", ([v], _t, line) => {
    if (v <= 0) throw rt(line, "Ln only works with numbers bigger than 0.", "EInvalidOp");
    return [Math.log(v), T.real];
  }],
  ceil: ["n", ([v]) => [Math.ceil(v), T.int]],
  floor: ["n", ([v]) => [Math.floor(v), T.int]],
  pi: ["", () => [Math.PI, T.real]],
  max: ["nn", ([a, b], [s, t]) => [Math.max(a, b), numTy(s, t)]],
  min: ["nn", ([a, b], [s, t]) => [Math.min(a, b), numTy(s, t)]],
  ord: ["o", ([v], [t]) => [ordOf(v, t), T.int]],
  chr: ["i", ([v]) => [String.fromCharCode(v), T.char]],
  succ: ["o", ([v], [t]) => [fromOrd(ordOf(v, t) + 1, t), t]],
  pred: ["o", ([v], [t]) => [fromOrd(ordOf(v, t) - 1, t), t]],
  odd: ["i", ([v]) => [v % 2 !== 0, T.bool]],
  random: ["?i", ([n]) => (n === undefined ? [Math.random(), T.real] : [Math.floor(Math.random() * n), T.int])],
  randomrange: ["ii", ([a, b]) => [a + Math.floor(Math.random() * (b - a)), T.int]],
  randomize: ["", () => null],
  sleep: ["i", () => null],
  assigned: ["x", ([v], [t], line) => {
    if (t.k !== "class" && t.k !== "nil") throw fail(line, "Assigned only works with object variables.");
    return [v !== null, T.bool];
  }],
  showmessage: ["s", ([s], _t, _line, I) => { I.out(s + "\n"); return null; }],
};

// Built-ins that need variables (not just values) or special argument shapes.
const SPECIAL = new Set(["write", "writeln", "readln", "read", "inc", "dec", "setlength", "delete", "insert", "format", "high", "low", "freeandnil"]);
const PROCS = new Set(["write", "writeln", "readln", "read", "inc", "dec", "setlength", "delete", "insert", "freeandnil", "randomize", "sleep", "showmessage"]);
const CONTROL = new Set(["break", "continue", "exit", "halt"]);
const isBuiltin = (n) => Object.prototype.hasOwnProperty.call(BUILTIN, n) || SPECIAL.has(n);

const WANT = { n: "a number", i: "a whole number", s: "text", c: "a single character (Char)", b: "True or False", o: "a whole number or a character" };
const HINTS = {
  "inttostr:real": "Use FloatToStr for a real number, or Round it first.",
  "inttostr:str": "It is already text.",
  "floattostr:str": "It is already text.",
  "strtoint:int": "It is already a number.",
  "strtofloat:int": "It is already a number.",
  "strtofloat:real": "It is already a number.",
  "showmessage:int": "Use IntToStr to turn the number into text first.",
  "showmessage:real": "Use FloatToStr to turn the number into text first.",
  "chr:real": "Use Round first.",
};

// Format('%d %s %8.2f %-10s %%', [...])
function formatText(fmt, vals, tys, line, I) {
  let k = 0;
  return fmt.replace(/%(-?)(\d*)(?:\.(\d+))?([a-zA-Z%])/g, (all, left, width, prec, conv) => {
    if (conv === "%") return "%";
    if (k >= vals.length) throw rt(line, "Format has more % codes than values in the [ ] list.", "EConvertError");
    const v = vals[k], t = tys[k];
    k++;
    const c = conv.toLowerCase();
    const need = (ok, what) => {
      if (!ok) throw rt(line, `In Format, ${all} needs ${what}, but the value is ${kindWord(t)}.` + (c === "d" && t.k === "real" ? " Use %f for real numbers." : ""), "EConvertError");
    };
    const dec = prec ? +prec : 2;
    let s;
    if (c === "d") { need(t.k === "int", "a whole number"); s = String(Math.abs(v)).padStart(prec ? +prec : 0, "0"); if (v < 0) s = "-" + s; }
    else if (c === "f") { need(isNum(t), "a number"); s = fixed(v, dec); }
    else if (c === "n") { need(isNum(t), "a number"); s = thousands(fixed(v, dec)); }
    else if (c === "m") { need(isNum(t), "a number"); s = (v < 0 ? "-R" : "R") + thousands(fixed(Math.abs(v), dec)); }
    else if (c === "s") { s = I.toText(v, t, line); if (prec) s = s.slice(0, +prec); }
    else if (c === "x") { need(t.k === "int", "a whole number"); s = v.toString(16).toUpperCase(); }
    else throw rt(line, `Format does not know the code "%${conv}". Use %d, %s, %f or %.2f.`, "EConvertError");
    if (width) s = left ? s.padEnd(+width) : s.padStart(+width);
    return s;
  });
}

// ---------------------------------------------------------------- scopes

class Scope {
  constructor(parent, self = null, cls = null, fn = null) {
    this.map = new Map();
    this.parent = parent;
    this.self = self; // the object, inside a method
    this.cls = cls; // the class whose method is running
    this.fn = fn; // the routine whose frame this is
  }
  add(name, entry, line, raw) {
    if (this.map.has(name)) throw fail(line, `"${raw}" has already been declared. Use a different name.`);
    this.map.set(name, entry);
  }
}

// A variable or constant. Proxies (array items, var parameters) share this shape.
const cell = (ty, v, isConst = false) => ({ kind: "var", ty, v, isConst });

const BREAK = 1, CONTINUE = 2, EXIT = 3;

function makeRoot() {
  const root = new Scope(null);
  const types = {
    integer: T.int, byte: T.int, word: T.int, cardinal: T.int, int64: T.int, longint: T.int, shortint: T.int,
    smallint: T.int, longword: T.int, uint64: T.int, nativeint: T.int,
    real: T.real, double: T.real, extended: T.real, single: T.real, currency: T.real, real48: T.real,
    string: T.str, ansistring: T.str, widestring: T.str, shortstring: T.str, unicodestring: T.str,
    char: T.char, ansichar: T.char, widechar: T.char, boolean: T.bool,
  };
  for (const [k, ty] of Object.entries(types)) root.map.set(k, { kind: "type", ty });
  const consts = {
    true: [T.bool, true], false: [T.bool, false], maxint: [T.int, 2147483647], slinebreak: [T.str, "\n"],
    ffgeneral: [T.int, 0], ffexponent: [T.int, 1], fffixed: [T.int, 2], ffnumber: [T.int, 3], ffcurrency: [T.int, 4],
  };
  for (const [k, [ty, v]] of Object.entries(consts)) root.map.set(k, cell(ty, v, true));
  // Exception classes, so try..except on E: Exception do ... works.
  const base = makeClass("Exception", null);
  base.fields.set("message", { name: "message", raw: "Message", ty: T.str, vis: "public", cls: base });
  root.map.set("exception", { kind: "type", ty: base });
  for (const n of ["EConvertError", "EDivByZero", "EZeroDivide", "ERangeError", "EAccessViolation", "EInOutError", "EInvalidOp"]) {
    root.map.set(n.toLowerCase(), { kind: "type", ty: makeClass(n, base) });
  }
  return { root, exBase: base };
}

function splitInput(s) {
  if (!s) return [];
  const lines = s.split(/\r?\n/);
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

// ---------------------------------------------------------------- interpreter

class Interp {
  constructor(src, opts) {
    this.src = src;
    this.lines = splitInput(opts.stdin);
    this.inPos = 0;
    this.maxSteps = opts.maxSteps;
    this.maxOutput = opts.maxOutput;
    this.steps = 0;
    this.depth = 0;
    this.line = null;
    this.buf = [];
    this.outLen = 0;
    const { root, exBase } = makeRoot();
    this.exBase = exBase;
    this.global = new Scope(root);
    this.bodies = []; // routines with code, in source order, for the name check
    this.lastErr = null;
  }

  run() {
    const prog = new Parser(tokenize(this.src)).program();
    for (const d of prog.decls) this.declare(d, this.global);
    this.checkAll(prog);
    this.execList(prog.body, this.global);
  }

  out(s) {
    s = s.replace(/\r\n?/g, "\n");
    const room = this.maxOutput - this.outLen;
    if (s.length > room) {
      this.buf.push(s.slice(0, Math.max(0, room)));
      this.outLen = this.maxOutput;
      throw limit(MSG.output, this.line);
    }
    this.buf.push(s);
    this.outLen += s.length;
  }

  step(line) {
    this.line = line;
    if (++this.steps > this.maxSteps) throw limit(MSG.steps, line);
  }

  // Big allocations cost steps too, so they cannot hang the worker.
  charge(n) {
    this.steps += Math.floor(n / 128);
    if (this.steps > this.maxSteps) throw limit(MSG.steps, this.line);
  }

  text(s, line) {
    if (s.length > MAX_TEXT) throw fail(line, "This text has become too long (more than a million characters). Is a loop adding to it forever?");
    return s;
  }

  // ------------------------------------------------ names

  lookup(sc, name) {
    for (let s = sc; s; s = s.parent) {
      const e = s.map.get(name);
      if (e) return e;
      if (s.self) {
        const m = findMember(s.self.cls, name);
        if (m) return m.what === "field" ? s.self.f.get(name) : { kind: m.what, info: m.info, self: s.self };
      }
    }
    return null;
  }

  checkAccess(info, sc, line) {
    if (info.vis !== "private" && info.vis !== "protected") return;
    let cur = null;
    for (let s = sc; s && !cur; s = s.parent) cur = s.cls;
    if (cur && (info.vis === "private" ? cur === info.cls : isA(cur, info.cls))) return;
    throw fail(line, `${info.short || info.raw} is ${info.vis}. Use a method to reach it.`);
  }

  // ------------------------------------------------ declarations

  declare(d, sc) {
    switch (d.k) {
      case "const": {
        let ty = d.type && this.resolveType(d.type, sc), v;
        if (d.e.k === "list") v = this.buildList(ty, d.e, sc);
        else {
          v = this.eval(d.e, sc);
          if (ty) v = this.coerce(ty, v, d.e.ty, d.line, `"${d.raw}"`);
          else ty = d.e.ty;
        }
        sc.add(d.name, cell(ty, v, true), d.line, d.raw);
        return;
      }
      case "type":
        if (d.type.k === "class") return this.declareClass(d, sc);
        sc.add(d.name, { kind: "type", ty: this.resolveType(d.type, sc) }, d.line, d.raw);
        return;
      case "var": {
        const ty = this.resolveType(d.type, sc);
        for (const n of d.names) {
          let v = this.defaultValue(ty);
          if (d.e) v = d.e.k === "list" ? this.buildList(ty, d.e, sc) : this.coerce(ty, this.eval(d.e, sc), d.e.ty, d.line, `"${n.raw}"`);
          sc.add(n.v, cell(ty, v), n.line, n.raw);
        }
        return;
      }
      case "routine":
        return this.declareRoutine(d, sc);
    }
  }

  buildList(ty, node, sc) {
    if (!ty || ty.k !== "array" || ty.dyn) throw fail(node.line, "A list in ( ) can only give values to a fixed-size array.");
    const n = ty.hi - ty.lo + 1;
    if (node.items.length !== n) throw fail(node.line, `This list has ${plural(node.items.length, "value")}, but the array needs exactly ${n}.`);
    const items = node.items.map((it) => (it.k === "list" ? this.buildList(ty.elem, it, sc) : this.coerce(ty.elem, this.eval(it, sc), it.ty, it.line, "This array item")));
    return { ty, lo: ty.lo, items };
  }

  declareClass(d, sc) {
    const c = d.type, cls = makeClass(d.raw, null);
    if (c.parent && c.parent.v !== "tobject") {
      const p = this.lookup(sc, c.parent.v);
      if (!p || p.kind !== "type" || p.ty.k !== "class") throw fail(c.line, `"${c.parent.raw}" is not a class that has been declared. Declare the parent class first.`);
      cls.parent = p.ty;
    }
    sc.add(d.name, { kind: "type", ty: cls }, d.line, d.raw);
    const dup = (name, raw, line) => {
      if (cls.fields.has(name) || cls.methods.has(name) || cls.props.has(name)) throw fail(line, `"${raw}" is declared twice in ${d.raw}. (Two methods with the same name are not supported here.)`);
    };
    for (const f of c.fields) {
      const ty = this.resolveType(f.type, sc);
      for (const n of f.names) {
        dup(n.v, n.raw, n.line);
        cls.fields.set(n.v, { name: n.v, raw: n.raw, ty, vis: f.vis, cls });
      }
    }
    for (const m of c.methods) {
      dup(m.name, m.raw, m.line);
      cls.methods.set(m.name, this.prepHeading(m, sc, cls));
    }
    for (const p of c.props) {
      dup(p.name, p.raw, p.line);
      cls.props.set(p.name, { name: p.name, raw: p.raw, ty: this.resolveType(p.type, sc), read: p.read && p.read.v, write: p.write && p.write.v, vis: p.vis, cls, line: p.line });
    }
  }

  prepHeading(h, sc, cls) {
    const params = [], seen = new Set();
    for (const p of h.params) {
      if (seen.has(p.name)) throw fail(h.line, `The parameter "${p.raw}" appears twice.`);
      seen.add(p.name);
      params.push({ name: p.name, raw: p.raw, mode: p.mode, ty: this.resolveType(p.type, sc) });
    }
    return {
      name: h.name, raw: cls ? `${cls.raw}.${h.raw}` : h.raw, short: h.raw, kind: h.kind, params,
      retTy: h.ret ? this.resolveType(h.ret, sc) : null, cls, vis: h.vis || "public", abstract: h.abstract, line: h.line, body: null,
    };
  }

  declareRoutine(d, sc) {
    if (d.cls) { // TLearner.Create ... the code of a method
      const ce = sc.map.get(d.cls);
      if (!ce || ce.kind !== "type" || ce.ty.k !== "class") throw fail(d.line, `"${d.clsRaw}" is not a class that has been declared.`);
      const info = ce.ty.methods.get(d.name);
      if (!info) throw fail(d.line, `${ce.ty.raw} does not have a method called "${d.raw}". Add it to the class declaration first.`);
      if (d.forward) throw fail(d.line, "A method cannot be declared forward.");
      this.attachBody(info, d, sc);
      this.bodies.push(info);
      return;
    }
    const prev = sc.map.get(d.name);
    if (prev && prev.kind === "routine" && !prev.info.body && !d.forward) { // code for a forward declaration
      this.attachBody(prev.info, d, sc);
      this.bodies.push(prev.info);
      return;
    }
    const info = this.prepHeading(d, sc, null);
    sc.add(d.name, { kind: "routine", info, closure: sc }, d.line, d.raw);
    if (!d.forward) {
      this.attachBody(info, d, sc);
      this.bodies.push(info);
    }
  }

  // Prepares a routine's locals once; each call then makes fresh variables.
  attachBody(info, d, sc) {
    if (info.body) throw fail(d.line, `${info.raw} has already been written once.`);
    if (d.params.length && d.params.length !== info.params.length) throw fail(d.line, `The parameters of ${info.raw} here do not match where it was first declared.`);
    const st = new Scope(sc);
    const names = new Set(info.params.map((p) => p.name));
    if (info.retTy) names.add("result");
    const body = { stmts: d.body, vars: [], fixed: [], nested: [], names };
    const addName = (name, raw, line) => {
      if (names.has(name)) throw fail(line, `"${raw}" has already been declared. Use a different name.`);
      names.add(name);
    };
    for (const x of d.decls) {
      if (x.k === "const" || x.k === "type") {
        if (x.k === "type" && x.type.k === "class") throw fail(x.line, "Declare classes at the top of the program, not inside a procedure or function.");
        addName(x.name, x.raw, x.line);
        this.declare(x, st);
        body.fixed.push([x.name, st.map.get(x.name)]);
      } else if (x.k === "var") {
        const ty = this.resolveType(x.type, st);
        for (const n of x.names) {
          addName(n.v, n.raw, n.line);
          body.vars.push({ name: n.v, raw: n.raw, ty, e: x.e, line: n.line });
        }
      } else { // a routine inside a routine
        if (x.cls) throw fail(x.line, "Write the code of a method at the top level of the program, not inside another routine.");
        const prev = body.nested.find((r) => r.name === x.name && !r.body);
        if (prev && !x.forward) { this.attachBody(prev, x, st); continue; }
        addName(x.name, x.raw, x.line);
        const ni = this.prepHeading(x, st, null);
        st.map.set(x.name, { kind: "routine", info: ni, closure: null });
        if (!x.forward) this.attachBody(ni, x, st);
        body.nested.push(ni);
      }
    }
    info.body = body;
  }

  resolveType(a, sc) {
    if (a.k === "named") {
      const e = this.lookup(sc, a.name);
      if (!e || e.kind !== "type") throw fail(a.line, `"${a.raw}" is not a type I know. Check the spelling (for example Integer, Real, String, Char or Boolean).`);
      return e.ty;
    }
    const elem = this.resolveType(a.elem, sc);
    if (a.dyn) return { k: "array", dyn: true, open: !!a.open, elem, size: 1 };
    const lo = this.eval(a.lo, sc), hi = this.eval(a.hi, sc), lt = a.lo.ty, ht = a.hi.ty;
    let idx;
    if (lt.k === "int" && ht.k === "int") idx = T.int;
    else if (lt.k === "char" && ht.k === "char") idx = T.char;
    else throw fail(a.line, "Array bounds must be whole numbers (or characters), like array[1..10] of Integer.");
    const l = ordOf(lo, lt), h = ordOf(hi, ht);
    if (h < l) throw fail(a.line, `The array range ${l}..${h} goes backwards. Put the smaller number first.`);
    const size = (h - l + 1) * (elem.size || 1);
    if (size > MAX_ITEMS) throw fail(a.line, "This array is too big. Keep it under 2 000 000 items.");
    return { k: "array", lo: l, hi: h, idx, elem, size };
  }

  defaultValue(ty) {
    switch (ty.k) {
      case "int": case "real": return 0;
      case "str": return "";
      case "char": return "\0";
      case "bool": return false;
      case "array": {
        if (ty.dyn) return { ty, lo: 0, items: [] };
        const items = new Array(ty.hi - ty.lo + 1);
        this.charge(items.length);
        for (let i = 0; i < items.length; i++) items[i] = this.defaultValue(ty.elem);
        return { ty, lo: ty.lo, items };
      }
      default: return null; // objects start as nil
    }
  }

  newObject(cls) {
    const obj = { cls, f: new Map() };
    for (let c = cls; c; c = c.parent) {
      for (const [n, f] of c.fields) if (!obj.f.has(n)) obj.f.set(n, cell(f.ty, this.defaultValue(f.ty)));
    }
    return obj;
  }

  // Checks that a value fits a variable's type; copies fixed-size arrays.
  coerce(ty, v, vty, line, what) {
    const bad = (hint) => fail(line, `${what} is ${article(ty)}, so it cannot hold ${kindWord(vty)}.${hint ? " " + hint : ""}`);
    switch (ty.k) {
      case "int":
        if (vty.k === "int") return v;
        if (vty.k === "real") throw bad("Use Round or Trunc to turn a real number into a whole number.");
        if (isText(vty)) throw bad("Use StrToInt to turn text into a number.");
        throw bad();
      case "real":
        if (isNum(vty)) return v;
        if (isText(vty)) throw bad("Use StrToFloat to turn text into a number.");
        throw bad();
      case "str":
        if (isText(vty)) return v;
        if (isNum(vty)) throw bad(`Use ${vty.k === "int" ? "IntToStr" : "FloatToStr"} to turn the number into text.`);
        if (vty.k === "bool") throw bad("Use BoolToStr(b, True) to turn it into text.");
        throw bad();
      case "char":
        if (vty.k === "char") return v;
        if (vty.k === "str") throw bad("A Char holds exactly one character. Use s[i] to take one character out of a string.");
        if (vty.k === "int") throw bad("Use Chr to turn a character code into a Char.");
        throw bad();
      case "bool":
        if (vty.k === "bool") return v;
        throw bad();
      case "array": {
        if (vty.k !== "array" || !compatible(ty.elem, vty.elem)) throw bad();
        if (ty.dyn && vty.dyn && !ty.open) return v; // dynamic arrays are shared, like Delphi
        this.charge(v.items.length);
        const c = copyArray(v);
        if (ty.dyn) return { ty, lo: 0, items: c.items };
        const len = ty.hi - ty.lo + 1;
        if (c.items.length !== len) throw fail(line, `${what} holds ${plural(len, "item")}, but the other array has ${c.items.length}. Arrays must be the same size to copy one into the other.`);
        return { ty, lo: ty.lo, items: c.items };
      }
      case "class":
        if (vty.k === "nil") return null;
        if (vty.k === "class" && isA(vty, ty)) return v;
        throw bad();
    }
    return v;
  }

  // ------------------------------------------------ name check (before running)

  checkAll(prog) {
    const known = (n) => !!this.lookup(this.global, n) || isBuiltin(n) || CONTROL.has(n);
    for (const info of this.bodies) this.checkBody(info, known);
    this.walk(prog.body, known, 0);
  }

  checkBody(info, parentKnown) {
    const b = info.body, cls = info.cls;
    const known = (n) => b.names.has(n) || (cls && (n === "self" || !!findMember(cls, n))) || parentKnown(n);
    for (const ni of b.nested) if (ni.body) this.checkBody(ni, known);
    for (const v of b.vars) if (v.e) this.walk(v.e, known, 0);
    this.walk(b.stmts, known, 0);
  }

  walk(n, known, loops) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) { for (const x of n) this.walk(x, known, loops); return; }
    switch (n.k) {
      case "lit": return;
      case "id":
        if (!known(n.name)) throw fail(n.line, `"${n.raw}" has not been declared. Check the spelling.`);
        return;
      case "field": return this.walk(n.obj, known, loops);
      case "inherited": return this.walk(n.args, known, loops);
      case "for": case "while": case "repeat": loops++; break;
      case "try":
        if (n.handlers) {
          this.walk(n.body, known, loops);
          for (const h of n.handlers) this.walk(h.s, h.v ? (x) => x === h.v.name || known(x) : known, loops);
          this.walk(n.els, known, loops);
          return;
        }
        break;
      case "callstmt": {
        const c = n.e.k === "call" ? n.e.callee : n.e;
        if (c.k === "id" && (c.name === "break" || c.name === "continue") && loops === 0) throw fail(n.line, `${c.raw} can only be used inside a loop (for, while or repeat).`);
        break;
      }
    }
    for (const key of Object.keys(n)) if (key !== "ty") this.walk(n[key], known, loops);
  }

  // ------------------------------------------------ statements

  execList(list, sc) {
    for (const s of list) {
      const r = this.exec(s, sc);
      if (r) return r;
    }
    return 0;
  }

  exec(s, sc) {
    this.step(s.line);
    switch (s.k) {
      case "block": return this.execList(s.stmts, sc);
      case "assign": {
        const r = this.ref(s.target, sc);
        if (r.isConst) throw fail(s.line, `${describe(s.target)} is a constant, so its value cannot be changed.`);
        const v = this.eval(s.e, sc);
        r.v = this.coerce(r.ty, v, s.e.ty, s.line, describe(s.target));
        return 0;
      }
      case "callstmt": return this.execCall(s, sc);
      case "if": {
        const b = this.cond(s.cond, sc, "if") ? s.then : s.els;
        return b ? this.exec(b, sc) : 0;
      }
      case "while":
        for (;;) {
          this.step(s.line);
          if (!this.cond(s.cond, sc, "while")) return 0;
          const r = s.body ? this.exec(s.body, sc) : 0;
          if (r === BREAK) return 0;
          if (r === EXIT) return EXIT;
        }
      case "repeat":
        for (;;) {
          this.step(s.line);
          const r = this.execList(s.body, sc);
          if (r === BREAK) return 0;
          if (r === EXIT) return EXIT;
          if (this.cond(s.cond, sc, "until")) return 0;
        }
      case "for": return this.execFor(s, sc);
      case "case": return this.execCase(s, sc);
      case "try": return this.execTry(s, sc);
      case "raise": {
        if (!s.e) {
          if (this.lastErr) throw this.lastErr;
          throw fail(s.line, '"raise" on its own only works inside an except block.');
        }
        const obj = this.eval(s.e, sc), t = s.e.ty;
        if (t.k !== "class" || !obj || !isA(obj.cls, this.exBase)) throw fail(s.line, "Write it like this: raise Exception.Create('What went wrong');");
        const msg = obj.f.get("message").v;
        throw new PascalError(where(s.line, msg), s.line, { catchable: true, ex: obj.cls.raw, bare: msg, obj });
      }
    }
    throw fail(s.line, "I do not know how to run this statement.");
  }

  cond(e, sc, word) {
    const v = this.eval(e, sc);
    if (e.ty.k !== "bool") throw fail(e.line, `The condition after "${word}" must be True or False, but here it is ${kindWord(e.ty)}.`);
    return v;
  }

  execCall(s, sc) {
    const e = s.e, c = e.k === "call" ? e.callee : e;
    if (c.k === "id" && CONTROL.has(c.name) && !this.lookup(sc, c.name)) {
      const args = e.k === "call" ? e.args : [];
      if (c.name === "break") return BREAK;
      if (c.name === "continue") return CONTINUE;
      if (c.name === "halt") throw new HaltSignal();
      if (args.length) { // Exit(value)
        let f = sc;
        while (f && !f.fn) f = f.parent;
        if (!f || !f.fn.retTy) throw fail(s.line, "Exit(value) can only be used inside a function. In a procedure, just write Exit.");
        const r = f.map.get("result");
        r.v = this.coerce(r.ty, this.eval(args[0], sc), args[0].ty, s.line, "The result");
      }
      return EXIT;
    }
    if (e.k !== "id" && e.k !== "call" && e.k !== "field" && e.k !== "inherited") {
      throw fail(s.line, `${describe(e)} on its own does nothing. Did you mean to give it a value with := ?`);
    }
    this.eval(e, sc, true);
    return 0;
  }

  execFor(s, sc) {
    const r = this.ref(s.v, sc);
    if (r.ty.k !== "int" && r.ty.k !== "char") throw fail(s.line, `The loop counter ${s.v.raw} must be an Integer (or Char) variable.`);
    const a = this.eval(s.from, sc), b = this.eval(s.to, sc);
    for (const t of [s.from.ty, s.to.ty]) {
      if (t.k !== r.ty.k) {
        throw fail(s.line, `The start and end of this for loop must be ${r.ty.k === "int" ? "whole numbers" : "characters"}, but one of them is ${kindWord(t)}.` + (t.k === "real" ? " Use Round or Trunc." : ""));
      }
    }
    const isChar = r.ty.k === "char", lo = ordOf(a, s.from.ty), hi = ordOf(b, s.to.ty);
    for (let i = lo; s.dir > 0 ? i <= hi : i >= hi; i += s.dir) {
      this.step(s.line);
      r.v = isChar ? String.fromCharCode(i) : i;
      const res = s.body ? this.exec(s.body, sc) : 0;
      if (res === BREAK) break;
      if (res === EXIT) return EXIT;
    }
    return 0;
  }

  // Labels must be the same kind of value as the one being checked.
  sameKind(t, at, line, what) {
    if ((isText(t) && isText(at)) || t.k === at.k) return;
    throw fail(line, `${what} is ${kindWord(at)}, but the value being checked is ${kindWord(t)}.`);
  }

  execCase(s, sc) {
    const v = this.eval(s.sel, sc), t = s.sel.ty;
    if (!isOrd(t) && !isText(t)) throw fail(s.line, `case only works with whole numbers, characters or text, not ${kindWord(t)}.`);
    for (const br of s.branches) {
      for (const lab of br.labels) {
        const a = this.eval(lab.a, sc);
        this.sameKind(t, lab.a.ty, lab.a.line, "This case label");
        let hit;
        if (lab.b) {
          const b = this.eval(lab.b, sc);
          this.sameKind(t, lab.b.ty, lab.b.line, "This case label");
          hit = v >= a && v <= b;
        } else hit = v === a;
        if (hit) return br.s ? this.exec(br.s, sc) : 0;
      }
    }
    return s.els ? this.execList(s.els, sc) : 0;
  }

  execTry(s, sc) {
    if (s.fin) {
      let res;
      try {
        res = this.execList(s.body, sc);
      } catch (err) {
        if (err instanceof PascalError && err.catchable) this.execList(s.fin, sc);
        throw err;
      }
      return this.execList(s.fin, sc) || res;
    }
    try {
      return this.execList(s.body, sc);
    } catch (err) {
      if (!(err instanceof PascalError) || !err.catchable) throw err;
      const saved = this.lastErr;
      this.lastErr = err;
      try {
        if (s.handler) return this.execList(s.handler, sc);
        const obj = err.obj || this.exceptionFor(err);
        for (const h of s.handlers) {
          const ty = this.resolveType(h.type, sc);
          if (ty.k !== "class" || !isA(ty, this.exBase)) throw fail(h.type.line, `"${h.type.raw}" is not an exception class. Use Exception.`);
          if (!isA(obj.cls, ty)) continue;
          let inner = sc;
          if (h.v) {
            inner = new Scope(sc);
            inner.map.set(h.v.name, cell(ty, obj, true));
          }
          return h.s ? this.exec(h.s, inner) : 0;
        }
        if (s.els) return this.execList(s.els, sc);
        throw err;
      } finally {
        this.lastErr = saved;
      }
    }
  }

  exceptionFor(err) {
    const e = this.global.parent.map.get(err.ex.toLowerCase());
    const obj = this.newObject(e ? e.ty : this.exBase);
    obj.f.get("message").v = err.bare;
    return obj;
  }

  // ------------------------------------------------ variables (things you can assign to)

  ref(n, sc, notVar) {
    switch (n.k) {
      case "id": {
        const e = this.lookup(sc, n.name);
        if (!e) throw fail(n.line, notVar || `"${n.raw}" has not been declared. Check the spelling.`);
        if (e.kind === "var") return e;
        if (e.kind === "prop") return this.propRef(e.self, e.info, n.line);
        if (e.kind === "routine" || e.kind === "method") {
          if (e.info.retTy) for (let s = sc; s; s = s.parent) if (s.fn === e.info) return s.map.get("result"); // FunctionName := value
          throw fail(n.line, notVar || `"${n.raw}" is a ${e.info.kind}, not a variable, so you cannot give it a value.`);
        }
        throw fail(n.line, notVar || `"${n.raw}" is a type, not a variable.`);
      }
      case "index": {
        let r = this.ref(n.obj, sc, notVar);
        n.idx.forEach((ix, d) => { r = this.elemRef(r, this.eval(ix, sc), ix.ty, n, d); });
        return r;
      }
      case "field": {
        const obj = this.objectOf(n, sc);
        const m = findMember(obj.cls, n.name);
        if (!m) throw fail(n.line, `${obj.cls.raw} has no field or method called "${n.raw}".`);
        this.checkAccess(m.info, sc, n.line);
        if (m.what === "field") return obj.f.get(n.name);
        if (m.what === "prop") return this.propRef(obj, m.info, n.line);
        throw fail(n.line, notVar || `${m.info.short} is a method, not a field, so you cannot give it a value.`);
      }
    }
    throw fail(n.line, notVar || "You can only give a value to a variable.");
  }

  elemRef(r, i, ity, n, d) {
    const ty = r.ty;
    if (ty.k === "array") {
      const arr = r.v, k = this.arrayPos(arr, ty, i, ity, n, d);
      return { kind: "var", ty: ty.elem, isConst: r.isConst, get v() { return arr.items[k]; }, set v(x) { arr.items[k] = x; } };
    }
    if (ty.k === "str") {
      this.strPos(r.v, i, ity, n);
      return {
        kind: "var", ty: T.char, isConst: r.isConst,
        get v() { return r.v[i - 1]; },
        set v(x) { const s = r.v; r.v = s.slice(0, i - 1) + x + s.slice(i); },
      };
    }
    throw fail(n.line, `${describe(n.obj)} is ${kindWord(ty)}, not an array or a string, so it cannot use [ ].`);
  }

  arrayPos(arr, ty, i, ity, n, d = 0) {
    const name = d === 0 ? describe(n.obj) : `Each row of ${describe(n.obj)}`;
    const charIdx = ty.idx === T.char;
    if (!isOrd(ity) || ity.k === "bool" || (ity.k === "char" && !charIdx)) throw fail(n.line, `A position in ${describe(n.obj)} must be a whole number, but this one is ${kindWord(ity)}.`);
    const k = ordOf(i, ity) - arr.lo;
    if (k < 0 || k >= arr.items.length) {
      const shown = ity.k === "char" ? `'${i}'` : String(i);
      if (!arr.items.length) throw rt(n.line, `${name} is empty, so position ${shown} does not exist. Use SetLength to give it room first.`, "ERangeError");
      const b = (x) => (charIdx ? `'${String.fromCharCode(x)}'` : String(x));
      throw rt(n.line, `Index ${shown} is out of range. ${name} goes from ${b(arr.lo)} to ${b(arr.lo + arr.items.length - 1)}.`, "ERangeError");
    }
    return k;
  }

  strPos(s, i, ity, n) {
    if (ity.k !== "int") throw fail(n.line, `A position in text must be a whole number, but this one is ${kindWord(ity)}.`);
    if (i < 1 || i > s.length) {
      const shown = s.length > 30 ? s.slice(0, 30) + "..." : s;
      throw rt(n.line, `Position ${i} is outside the text '${shown}'. It has ${plural(s.length, "character")}, so use positions 1 to ${s.length}.`, "ERangeError");
    }
  }

  objectOf(f, sc) {
    return this.checkObject(this.eval(f.obj, sc), f.obj.ty, f);
  }

  checkObject(obj, bt, f) {
    if (bt.k !== "class" && bt.k !== "nil") throw fail(f.line, `${describe(f.obj)} is ${kindWord(bt)}, not an object, so it has no "${f.raw}" part.`);
    if (obj === null) throw rt(f.line, "This object was never created. Call Create first.", "EAccessViolation");
    return obj;
  }

  readProp(obj, p, line, out) {
    if (!p.read) throw fail(line, `The property ${p.raw} can only be written, not read.`);
    const m = findMember(obj.cls, p.read);
    out.ty = p.ty;
    if (m && m.what === "field") return obj.f.get(p.read).v;
    if (m && m.what === "method") return this.call(m.info, [], null, line, obj, this.global);
    throw fail(p.line, `The property ${p.raw} reads "${p.read}", but the class has no field or method with that name.`);
  }

  propRef(obj, p, line) {
    if (!p.write) throw fail(line, `The property ${p.raw} can only be read. It has no "write" part.`);
    const I = this;
    return {
      kind: "var", ty: p.ty, isConst: false,
      get v() { return I.readProp(obj, p, line, {}); },
      set v(x) {
        const m = findMember(obj.cls, p.write);
        if (m && m.what === "field") obj.f.get(p.write).v = x;
        else if (m && m.what === "method") I.call(m.info, [{ k: "lit", v: x, ty: p.ty, line }], null, line, obj, I.global);
        else throw fail(p.line, `The property ${p.raw} writes "${p.write}", but the class has no field or method with that name.`);
      },
    };
  }

  // ------------------------------------------------ calls

  call(info, args, sc, line, self, closure) {
    args = args || [];
    const ps = info.params;
    if (args.length !== ps.length) throw fail(line, `${info.raw} needs ${plural(ps.length, "value")} in brackets, but ${given(args.length)}.`);
    if (!info.body) {
      throw fail(line, info.abstract
        ? `${info.raw} is abstract, so it has no code of its own. Use a class that overrides it.`
        : `${info.raw} was declared, but its code was never written. Add its implementation.`);
    }
    const frame = new Scope(closure, self, self ? info.cls : null, info);
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i], a = args[i];
      if (a.k === "fmt") throw fail(a.line, 'The ":width" part only works inside Write and WriteLn.');
      if (p.mode === "var") {
        const r = this.ref(a, sc, `${info.raw} changes its "${p.raw}" parameter, so you must pass a variable there, not a value.`);
        if (r.isConst) throw fail(a.line, `${describe(a)} is a constant, but ${info.raw} would change it through its "${p.raw}" parameter.`);
        if (!compatible(p.ty, r.ty)) throw fail(a.line, `The "${p.raw}" parameter of ${info.raw} needs ${article(p.ty)} variable, but ${describe(a)} is ${article(r.ty)}.`);
        frame.map.set(p.name, p.ty.open ? cell(p.ty, { ty: p.ty, lo: 0, items: r.v.items }) : r);
      } else {
        const v = this.coerce(p.ty, this.eval(a, sc), a.ty, a.line, `The "${p.raw}" parameter of ${info.raw}`);
        frame.map.set(p.name, cell(p.ty, v, p.mode === "const"));
      }
    }
    if (info.retTy) frame.map.set("result", cell(info.retTy, this.defaultValue(info.retTy)));
    if (self) frame.map.set("self", cell(info.cls, self, true));
    const b = info.body;
    for (const [name, entry] of b.fixed) frame.map.set(name, entry);
    for (const v of b.vars) {
      let val = this.defaultValue(v.ty);
      if (v.e) val = v.e.k === "list" ? this.buildList(v.ty, v.e, frame) : this.coerce(v.ty, this.eval(v.e, frame), v.e.ty, v.line, `"${v.raw}"`);
      frame.map.set(v.name, cell(v.ty, val));
    }
    for (const ni of b.nested) frame.map.set(ni.name, { kind: "routine", info: ni, closure: frame });
    if (++this.depth > MAX_DEPTH) throw limit(MSG.depth, line);
    try {
      this.execList(b.stmts, frame);
    } finally {
      this.depth--;
    }
    return info.retTy ? frame.map.get("result").v : undefined;
  }

  invoke(info, args, sc, line, self, closure, out, asStmt) {
    if (!info.retTy && !asStmt) throw fail(line, `${info.raw} is a ${info.kind}, so it does not give back a value. It cannot be used inside an expression.`);
    const v = this.call(info, args, sc, line, self, closure);
    out.ty = info.retTy || T.none;
    return v;
  }

  evalName(id, sc, args, out, asStmt) {
    const e = this.lookup(sc, id.name);
    if (!e) {
      if (isBuiltin(id.name)) return this.builtin(id, args || [], sc, out, asStmt);
      if (CONTROL.has(id.name)) throw fail(id.line, `${id.raw} must be a statement on its own.`);
      throw fail(id.line, `"${id.raw}" has not been declared. Check the spelling.`);
    }
    switch (e.kind) {
      case "var":
        if (args) throw fail(id.line, `"${id.raw}" is a variable, not a procedure or function, so it cannot have ( ) after it.`);
        if (asStmt) throw fail(id.line, `"${id.raw}" on its own does nothing. Did you mean to give it a value with := ?`);
        out.ty = e.ty;
        return e.v;
      case "routine": return this.invoke(e.info, args, sc, id.line, null, e.closure, out, asStmt);
      case "method": return this.invoke(e.info, args, sc, id.line, e.self, this.global, out, asStmt);
      case "prop":
        if (args) throw fail(id.line, `${id.raw} is a property, so it cannot have ( ) after it.`);
        return this.readProp(e.self, e.info, id.line, out);
      default:
        if (args && args.length === 1) return this.cast(e.ty, args[0], sc, out, id);
        throw fail(id.line, `"${id.raw}" is a type, not a value.`);
    }
  }

  // Integer('A'), Char(65), TDog(objAnimal) ...
  cast(ty, a, sc, out, id) {
    const v = this.eval(a, sc), t = a.ty;
    out.ty = ty;
    if (ty.k === "int" && isOrd(t)) return ordOf(v, t);
    if (ty.k === "char" && t.k === "int") return String.fromCharCode(v);
    if (ty.k === "char" && t.k === "char") return v;
    if (ty.k === "real" && isNum(t)) return v;
    if (ty.k === "str" && isText(t)) return v;
    if (ty.k === "bool" && t.k === "bool") return v;
    if (ty.k === "bool" && t.k === "int") return v !== 0;
    if (ty.k === "class" && t.k === "nil") return null;
    if (ty.k === "class" && t.k === "class") {
      if (v && !isA(v.cls, ty)) throw rt(id.line, `This object is a ${v.cls.raw}, not a ${ty.raw}.`);
      return v;
    }
    const hint = ty.k === "int" && t.k === "real" ? " Use Round or Trunc." : ty.k === "str" && isNum(t) ? " Use IntToStr or FloatToStr." : "";
    throw fail(id.line, `${id.raw}( ) cannot turn ${kindWord(t)} into ${article(ty)}.${hint}`);
  }

  evalMember(f, sc, args, out, asStmt) {
    if (f.obj.k === "id") { // TLearner.Create(...)
      const e = this.lookup(sc, f.obj.name);
      if (e && e.kind === "type") {
        if (e.ty.k !== "class") throw fail(f.line, `${f.obj.raw} is not a class, so it has no "${f.raw}".`);
        return this.construct(e.ty, f, args, sc, out);
      }
    }
    const obj = this.eval(f.obj, sc), bt = f.obj.ty;
    if (obj === null && (f.name === "free" || f.name === "destroy") && bt.k === "class") { out.ty = T.none; return undefined; } // Free on nil is safe
    return this.memberOf(this.checkObject(obj, bt, f), f, sc, args, out, asStmt, bt);
  }

  memberOf(obj, f, sc, args, out, asStmt, bt) {
    const m = findMember(obj.cls, f.name);
    if (!m) {
      if (f.name === "free") {
        const d = findMember(obj.cls, "destroy");
        if (d && d.what === "method") this.call(d.info, [], sc, f.line, obj, this.global);
        out.ty = T.none;
        return undefined;
      }
      if (f.name === "classname") { out.ty = T.str; return obj.cls.raw; }
      throw fail(f.line, `${obj.cls.raw} has no field or method called "${f.raw}".`);
    }
    this.checkAccess(m.info, sc, f.line);
    if (m.what === "field") {
      if (args) throw fail(f.line, `${f.raw} is a field, not a method, so it cannot have ( ) after it.`);
      if (asStmt) throw fail(f.line, `${describe(f)} on its own does nothing. Did you mean to give it a value with := ?`);
      const c = obj.f.get(f.name);
      out.ty = c.ty;
      return c.v;
    }
    if (m.what === "prop") return this.readProp(obj, m.info, f.line, out);
    if (m.info.kind === "constructor") {
      this.call(m.info, args, sc, f.line, obj, this.global);
      out.ty = bt.k === "class" ? bt : obj.cls;
      return obj;
    }
    return this.invoke(m.info, args, sc, f.line, obj, this.global, out, asStmt);
  }

  construct(cls, f, args, sc, out) {
    const m = findMember(cls, f.name);
    out.ty = cls;
    if (!m) {
      if (f.name !== "create") throw fail(f.line, `${cls.raw} has no constructor called "${f.raw}".`);
      const obj = this.newObject(cls);
      if (isA(cls, this.exBase)) { // Exception.Create('message')
        if (!args || args.length !== 1) throw fail(f.line, `${cls.raw}.Create needs 1 value in brackets: the message.`);
        const msg = this.eval(args[0], sc);
        if (!isText(args[0].ty)) throw fail(f.line, `The message for ${cls.raw}.Create must be text.`);
        obj.f.get("message").v = msg;
        return obj;
      }
      if (args && args.length) throw fail(f.line, `${cls.raw} does not have a constructor that takes values. Add "constructor Create(...)" to the class.`);
      return obj;
    }
    if (m.what !== "method" || m.info.kind !== "constructor") throw fail(f.line, `${f.raw} is not a constructor. Create the object first with ${cls.raw}.Create, then call ${f.raw} on it.`);
    const obj = this.newObject(cls);
    this.call(m.info, args, sc, f.line, obj, this.global);
    return obj;
  }

  evalInherited(n, sc, asStmt) {
    let f = sc;
    while (f && !(f.fn && f.self)) f = f.parent;
    if (!f) throw fail(n.line, '"inherited" can only be used inside a method of a class.');
    const name = n.name || f.fn.name, parent = f.fn.cls.parent;
    const m = parent && findMember(parent, name);
    if (!m || m.what !== "method") {
      if (!parent || name === "create" || name === "destroy") { n.ty = T.none; return undefined; } // TObject's do nothing
      throw fail(n.line, `${parent.raw} has no method called "${n.raw || f.fn.short}".`);
    }
    const args = n.args || f.fn.params.map((p) => ({ k: "id", name: p.name, raw: p.raw, line: n.line }));
    if (m.info.kind === "constructor" || m.info.kind === "destructor") {
      this.call(m.info, args, sc, n.line, f.self, this.global);
      n.ty = T.none;
      return undefined;
    }
    return this.invoke(m.info, args, sc, n.line, f.self, this.global, n, asStmt);
  }

  // ------------------------------------------------ expressions

  eval(n, sc, asStmt = false) {
    switch (n.k) {
      case "lit": return n.v;
      case "id": return this.evalName(n, sc, null, n, asStmt);
      case "call":
        if (n.callee.k === "id") return this.evalName(n.callee, sc, n.args, n, asStmt);
        if (n.callee.k === "field") return this.evalMember(n.callee, sc, n.args, n, asStmt);
        throw fail(n.line, `${describe(n.callee)} cannot be called like a procedure or function.`);
      case "field": return this.evalMember(n, sc, null, n, asStmt);
      case "index": return this.evalIndex(n, sc);
      case "un": return this.evalUnary(n, sc);
      case "bin": return this.evalBinary(n, sc);
      case "inherited": return this.evalInherited(n, sc, asStmt);
      case "set": throw fail(n.line, 'A list in [ ] can only be used after "in" or inside Format.');
      case "fmt": throw fail(n.line, 'The ":width" part only works inside Write and WriteLn.');
      case "list": throw fail(n.line, "A list in ( ) can only be used to fill a fixed-size array constant.");
    }
    throw fail(n.line, "I could not work out the value here.");
  }

  evalIndex(n, sc) {
    let v = this.eval(n.obj, sc), ty = n.obj.ty;
    n.idx.forEach((ix, d) => {
      const i = this.eval(ix, sc);
      if (ty.k === "array") {
        v = v.items[this.arrayPos(v, ty, i, ix.ty, n, d)];
        ty = ty.elem;
      } else if (isText(ty)) {
        this.strPos(v, i, ix.ty, n);
        v = v[i - 1];
        ty = T.char;
      } else throw fail(n.line, `${describe(n.obj)} is ${kindWord(ty)}, not an array or a string, so it cannot use [ ].`);
    });
    n.ty = ty;
    return v;
  }

  evalUnary(n, sc) {
    const v = this.eval(n.e, sc), t = n.e.ty;
    if (n.op === "not") {
      if (t.k === "bool") { n.ty = T.bool; return !v; }
      if (t.k === "int") { n.ty = T.int; return ~v; }
      throw fail(n.line, `"not" works on True/False values, but this is ${kindWord(t)}.`);
    }
    if (!isNum(t)) throw fail(n.line, `A ${n.op === "-" ? "minus" : "plus"} sign needs a number, but this is ${kindWord(t)}.`);
    n.ty = t;
    return n.op === "-" ? -v : v;
  }

  joinError(op, line) {
    return fail(line, `"${op}" joins two True/False values. If you are comparing, put brackets around each comparison, like (x > 0) ${op} (x < 10).`);
  }

  evalBinary(n, sc) {
    const op = n.op, line = n.line;
    if (op === "and" || op === "or") { // short-circuit, like Delphi
      const a = this.eval(n.l, sc), lt = n.l.ty;
      if (lt.k === "bool") {
        n.ty = T.bool;
        if (op === "and" ? !a : a) return a;
        const b = this.eval(n.r, sc);
        if (n.r.ty.k !== "bool") throw this.joinError(op, line);
        return b;
      }
      const b = this.eval(n.r, sc);
      if (lt.k === "int" && n.r.ty.k === "int") { n.ty = T.int; return op === "and" ? a & b : a | b; }
      throw this.joinError(op, line);
    }
    if (op === "in") return this.evalIn(n, sc);
    const a = this.eval(n.l, sc), b = this.eval(n.r, sc), lt = n.l.ty, rt_ = n.r.ty;
    const nums = isNum(lt) && isNum(rt_);
    switch (op) {
      case "+":
        if (nums) { n.ty = numTy(lt, rt_); return a + b; }
        if (isText(lt) && isText(rt_)) { n.ty = T.str; return this.text(a + b, line); }
        if ((isText(lt) && isNum(rt_)) || (isNum(lt) && isText(rt_))) throw fail(line, "You cannot add a number and text together. Use IntToStr (or FloatToStr) to turn the number into text first.");
        break;
      case "-": case "*":
        if (nums) { n.ty = numTy(lt, rt_); return op === "-" ? a - b : a * b; }
        break;
      case "/":
        if (nums) {
          if (b === 0) throw rt(line, "You divided by zero. Check the number you are dividing by.", "EZeroDivide");
          n.ty = T.real;
          return a / b;
        }
        break;
      case "div": case "mod":
        if (lt.k === "int" && rt_.k === "int") {
          if (b === 0) throw rt(line, `You used ${op} with zero, which means dividing by zero. Check the number after "${op}".`, "EDivByZero");
          n.ty = T.int;
          return op === "div" ? Math.trunc(a / b) : a % b;
        }
        if (nums) throw fail(line, `"${op}" only works with whole numbers. Use / to divide real numbers.`);
        break;
      case "shl": case "shr":
        if (lt.k === "int" && rt_.k === "int") { n.ty = T.int; return op === "shl" ? a << b : a >> b; }
        break;
      case "xor":
        if (lt.k === "bool" && rt_.k === "bool") { n.ty = T.bool; return a !== b; }
        if (lt.k === "int" && rt_.k === "int") { n.ty = T.int; return a ^ b; }
        throw this.joinError(op, line);
      default:
        n.ty = T.bool;
        return this.compare(op, a, b, lt, rt_, line);
    }
    throw fail(line, `"${op}" cannot be used with ${kindWord(lt)} and ${kindWord(rt_)}.`);
  }

  compare(op, a, b, lt, rt_, line) {
    let ok = (isNum(lt) && isNum(rt_)) || (isText(lt) && isText(rt_)) || (lt.k === "bool" && rt_.k === "bool");
    const objs = (t) => t.k === "class" || t.k === "nil";
    if (!ok && (op === "=" || op === "<>") && objs(lt) && objs(rt_)) ok = true;
    if (!ok) {
      const mixed = (isNum(lt) && isText(rt_)) || (isText(lt) && isNum(rt_));
      throw fail(line, `You cannot compare ${kindWord(lt)} with ${kindWord(rt_)}.` + (mixed ? " Use StrToInt or IntToStr so both sides are the same type." : ""));
    }
    switch (op) {
      case "=": return a === b;
      case "<>": return a !== b;
      case "<": return a < b;
      case ">": return a > b;
      case "<=": return a <= b;
      default: return a >= b;
    }
  }

  evalIn(n, sc) {
    const v = this.eval(n.l, sc), t = n.l.ty;
    n.ty = T.bool;
    if (n.r.k !== "set") throw fail(n.line, '"in" needs a list in square brackets, like x in [1, 2, 3].');
    for (const it of n.r.items) {
      const a = this.eval(it.a, sc);
      this.sameKind(t, it.a.ty, n.line, "This item in the [ ] list");
      if (!it.b) { if (v === a) return true; continue; }
      const b = this.eval(it.b, sc);
      this.sameKind(t, it.b.ty, n.line, "This item in the [ ] list");
      if (v >= a && v <= b) return true;
    }
    return false;
  }

  // ------------------------------------------------ built-ins

  builtin(id, args, sc, out, asStmt) {
    const name = id.name, line = id.line;
    if (!asStmt && PROCS.has(name)) throw fail(line, `${id.raw} is a procedure, so it does not give back a value. It cannot be used inside an expression.`);
    let res;
    if (SPECIAL.has(name)) res = this.special(name, id, args, sc, line);
    else {
      const [spec, fn] = BUILTIN[name];
      const { vals, tys } = this.builtinArgs(id, spec, args, sc);
      res = fn(vals, tys, line, this);
    }
    const [v, ty] = res || [undefined, T.none];
    out.ty = ty;
    return v;
  }

  builtinArgs(id, spec, args, sc) {
    const opt = spec.indexOf("?"), letters = spec.replace("?", ""), min = opt < 0 ? letters.length : opt;
    if (args.length < min || args.length > letters.length) {
      const want = min === letters.length ? plural(min, "value") : `${min} to ${letters.length} values`;
      throw fail(id.line, `${id.raw} needs ${want} in brackets, but ${given(args.length)}.`);
    }
    const vals = [], tys = [];
    args.forEach((a, i) => {
      if (a.k === "fmt") throw fail(a.line, 'The ":width" part only works inside Write and WriteLn.');
      const v = this.eval(a, sc), t = a.ty, w = letters[i];
      const ok = w === "x" || (w === "n" && isNum(t)) || (w === "i" && t.k === "int") || (w === "s" && isText(t)) ||
        (w === "c" && t.k === "char") || (w === "b" && t.k === "bool") || (w === "o" && isOrd(t));
      if (!ok) {
        const hint = HINTS[`${id.name}:${t.k}`];
        throw fail(a.line, `${id.raw} needs ${WANT[w]} here, but this is ${kindWord(t)}.${hint ? " " + hint : ""}`);
      }
      vals.push(v);
      tys.push(t);
    });
    return { vals, tys };
  }

  argCount(id, args, n, example) {
    if (args.length !== n) throw fail(id.line, `${id.raw} needs ${plural(n, "value")} in brackets, like ${example}.`);
  }

  wholeArg(a, sc, what) {
    const v = this.eval(a, sc);
    if (a.ty.k !== "int") throw fail(a.line, `${what} must be a whole number, but this is ${kindWord(a.ty)}.`);
    return v;
  }

  stringRef(a, sc, id) {
    const r = this.ref(a, sc, `${id.raw} needs a String variable here.`);
    if (r.ty.k !== "str") throw fail(a.line, `${id.raw} needs a String variable here, but ${describe(a)} is ${article(r.ty)}.`);
    if (r.isConst) throw fail(a.line, `${describe(a)} is a constant, so ${id.raw} cannot change it.`);
    return r;
  }

  special(name, id, args, sc, line) {
    switch (name) {
      case "write": case "writeln": {
        let s = "";
        for (const a of args) s += a.k === "fmt" ? this.fmtArg(a, sc) : this.toText(this.eval(a, sc), a.ty, a.line);
        this.out(name === "writeln" ? s + "\n" : s);
        return null;
      }
      case "readln": case "read": {
        if (!args.length) { // ReadLn; just waits for Enter
          if (this.inPos < this.lines.length) this.out(this.lines[this.inPos++] + "\n");
          return null;
        }
        for (const a of args) {
          const r = this.ref(a, sc, `${id.raw} needs a variable to store what is typed, like ${id.raw}(sName).`);
          if (r.isConst) throw fail(a.line, `${describe(a)} is a constant, so ${id.raw} cannot store anything in it.`);
          if (this.inPos >= this.lines.length) throw limit(MSG.input, line);
          const text = this.lines[this.inPos++];
          this.out(text + "\n");
          r.v = this.fromInput(text, r.ty, a.line);
        }
        return null;
      }
      case "inc": case "dec": {
        if (args.length < 1 || args.length > 2) throw fail(line, `${id.raw} needs 1 or 2 values in brackets, like ${id.raw}(iCount) or ${id.raw}(iCount, 5).`);
        const r = this.ref(args[0], sc, `${id.raw} needs a variable, like ${id.raw}(iCount).`);
        if (r.isConst) throw fail(line, `${describe(args[0])} is a constant, so its value cannot be changed.`);
        let by = args[1] ? this.wholeArg(args[1], sc, `The amount in ${id.raw}`) : 1;
        if (name === "dec") by = -by;
        if (r.ty.k === "int") r.v = r.v + by;
        else if (r.ty.k === "char") r.v = String.fromCharCode(r.v.charCodeAt(0) + by);
        else throw fail(line, `${id.raw} only works on Integer (or Char) variables, but ${describe(args[0])} is ${article(r.ty)}.`);
        return null;
      }
      case "setlength": {
        if (args.length < 2) throw fail(line, "SetLength needs a variable and a new length, like SetLength(arrNames, 10).");
        const r = this.ref(args[0], sc, "SetLength needs an array variable, like SetLength(arrNames, 10).");
        const dims = args.slice(1).map((a) => this.wholeArg(a, sc, "The new length in SetLength"));
        if (r.ty.k === "str") {
          const n = dims[0];
          if (n < 0 || n > MAX_TEXT) throw fail(line, `SetLength cannot make text ${n} characters long.`);
          r.v = r.v.slice(0, n).padEnd(n, " ");
          return null;
        }
        if (r.ty.k !== "array" || !r.ty.dyn || r.ty.open) throw fail(line, "SetLength only works on a dynamic array (declared as array of ...) or a String.");
        r.v = this.resize(r.v, r.ty, dims, line);
        return null;
      }
      case "delete": {
        this.argCount(id, args, 3, "Delete(sText, 1, 3)");
        const r = this.stringRef(args[0], sc, id);
        const i = this.wholeArg(args[1], sc, "The position in Delete"), n = this.wholeArg(args[2], sc, "The count in Delete");
        const s = r.v;
        if (i >= 1 && i <= s.length && n > 0) r.v = s.slice(0, i - 1) + s.slice(i - 1 + n);
        return null;
      }
      case "insert": {
        this.argCount(id, args, 3, "Insert('abc', sText, 2)");
        const src = this.eval(args[0], sc);
        if (!isText(args[0].ty)) throw fail(args[0].line, `Insert needs text to insert, but this is ${kindWord(args[0].ty)}.`);
        const r = this.stringRef(args[1], sc, id);
        const i = this.wholeArg(args[2], sc, "The position in Insert"), s = r.v;
        const k = Math.min(Math.max(i, 1), s.length + 1);
        r.v = this.text(s.slice(0, k - 1) + src + s.slice(k - 1), line);
        return null;
      }
      case "format": {
        if (args.length !== 2 || args[1].k !== "set") throw fail(line, "Format needs text and a list in square brackets, like Format('%d apples', [iCount]).");
        const f = this.eval(args[0], sc);
        if (!isText(args[0].ty)) throw fail(line, `The first value of Format must be text, but this is ${kindWord(args[0].ty)}.`);
        const vals = [], tys = [];
        for (const it of args[1].items) {
          if (it.b) throw fail(line, "Format's list cannot contain a range like 1..5.");
          vals.push(this.eval(it.a, sc));
          tys.push(it.a.ty);
        }
        return [formatText(f, vals, tys, line, this), T.str];
      }
      case "high": case "low": {
        this.argCount(id, args, 1, `${id.raw}(arrMarks)`);
        const a = args[0], hi = name === "high";
        if (a.k === "id") {
          const e = this.lookup(sc, a.name);
          if (e && e.kind === "type") return this.typeBound(hi, e.ty, line, id);
        }
        const v = this.eval(a, sc), t = a.ty;
        if (t.k === "array") {
          const b = hi ? v.lo + v.items.length - 1 : v.lo;
          return t.idx === T.char ? [String.fromCharCode(b), T.char] : [b, T.int];
        }
        if (isText(t)) return [hi ? v.length : 1, T.int];
        return this.typeBound(hi, t, line, id);
      }
      case "freeandnil": {
        this.argCount(id, args, 1, "FreeAndNil(objLearner)");
        const r = this.ref(args[0], sc, "FreeAndNil needs an object variable.");
        if (r.ty.k !== "class") throw fail(line, "FreeAndNil needs an object variable.");
        r.v = null;
        return null;
      }
    }
    return null;
  }

  typeBound(hi, ty, line, id) {
    switch (ty.k) {
      case "int": return [hi ? 2147483647 : -2147483648, T.int];
      case "char": return [hi ? "\xFF" : "\0", T.char];
      case "bool": return [hi, T.bool];
      case "array":
        if (!ty.dyn) return ty.idx === T.char ? [String.fromCharCode(hi ? ty.hi : ty.lo), T.char] : [hi ? ty.hi : ty.lo, T.int];
    }
    throw fail(line, `${id.raw} needs an array, text or an ordinal type like Integer.`);
  }

  resize(old, ty, dims, line) {
    const n = dims[0];
    if (n < 0 || n > MAX_ITEMS) throw rt(line, `SetLength cannot make an array with ${n} items.`, "ERangeError");
    this.charge(n);
    const items = new Array(n);
    for (let k = 0; k < n; k++) {
      let v = old && k < old.items.length ? old.items[k] : this.defaultValue(ty.elem);
      if (dims.length > 1) {
        if (ty.elem.k !== "array" || !ty.elem.dyn) throw fail(line, "SetLength was given more sizes than this array has dimensions.");
        v = this.resize(v, ty.elem, dims.slice(1), line);
      }
      items[k] = v;
    }
    return { ty, lo: 0, items };
  }

  fmtArg(a, sc) {
    const v = this.eval(a.e, sc), t = a.e.ty;
    const w = this.wholeArg(a.w, sc, "The width after :");
    let s;
    if (a.p) {
      const p = this.wholeArg(a.p, sc, "The number of decimals after the second :");
      if (!isNum(t)) throw fail(a.line, "Only numbers can have a second :decimals part, like x:8:2.");
      s = fixed(v, p);
    } else s = this.toText(v, t, a.line);
    return s.padStart(w, " ");
  }

  toText(v, t, line) {
    switch (t.k) {
      case "int": return String(v);
      case "real": return fmtReal(v);
      case "str": case "char": return v;
      case "bool": return v ? "TRUE" : "FALSE";
      case "array": throw fail(line, "Write cannot show a whole array at once. Use a loop to write each item.");
      case "class": case "nil": throw fail(line, "Write cannot show an object. Write one of its fields, or call a method like ToString.");
    }
    throw fail(line, "There is nothing here to write.");
  }

  fromInput(text, ty, line) {
    switch (ty.k) {
      case "int": return toWhole(text, line, "EInOutError");
      case "real": return toReal(text, line, "EInOutError");
      case "str": return text;
      case "char": return text.length ? text[0] : "\0";
    }
    throw fail(line, `ReadLn cannot read straight into ${article(ty)}. Read into a String first.`);
  }
}

// ---------------------------------------------------------------- entry point

export function runPascal(source, options) {
  let I = null;
  try {
    const { stdin = "", maxSteps = 300000, maxOutput = 20000 } = options || {};
    I = new Interp(String(source ?? ""), { stdin: String(stdin ?? ""), maxSteps, maxOutput });
    I.run();
    return { stdout: I.buf.join(""), error: null };
  } catch (e) {
    const stdout = I ? I.buf.join("") : "";
    const line = I ? I.line : null;
    if (e instanceof HaltSignal) return { stdout, error: null };
    if (e instanceof PascalError) return { stdout, error: { message: e.message, line: e.line } };
    if (e instanceof RangeError && /call stack/i.test(e.message)) return { stdout, error: { message: MSG.depth, line } };
    return { stdout, error: { message: where(line, "Something went wrong while running this line, and the runner could not explain it. Try writing it in a simpler way."), line } };
  }
}
