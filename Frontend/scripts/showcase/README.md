# Showcase courses

One file per course (`grade01.mjs` … `grade12.mjs`, `college.mjs`). Each exports a plain object.
`npm run build:showcase` turns them into `Backend/LearnOnline/Data/showcase-courses.json`, which
the backend seeds when `SEED_DEMO_COURSE` is `true` or `refresh`.

Check one file without writing anything (do this often while writing):

    node scripts/build-showcase.mjs --check grade05.mjs

The check runs every model answer, so a wrong solution or an impossible activity fails loudly.

## Shape of a course file

```js
export default {
    code: "CR-G05",                 // unique. CR-Gnn for Coding and Robotics, IT-Gnn for Information Technology, CS-101 for college
    name: "Coding and Robotics: Grade 5",
    description: "One sentence.",
    module: "Decisions and forever loops",   // the module's title
    home: [ /* blocks for the course home page: no marked activities here */ ],
    pages: [ { title: "If… else", blocks: [ /* blocks */ ] }, /* 3 to 5 pages */ ],
};
```

## Coursework

`coursework.mjs` holds four assignments per course (two already marked, one due in a few days,
one coming up). The seeder builds the rest from them: submissions, marks and comments,
announcements, attendance, a weekly class on the calendar and the teacher's to-dos, all dated
relative to the day it runs. Everything belongs to the dev accounts (devteacher, devstudent, devadmin).

## Blocks

A block is an object with `t`, or just a string (a paragraph). Paragraphs, headings, lists,
callouts, reveals and tables support `**bold**`, `*italic*`, `` `code` `` and `[links](https://…)`.
Text inside activities (prompts, questions, flashcards) is plain: write "quotes" instead of marks.

### Words and layout

```js
"A plain paragraph with **bold**."
{ t: "h1", text: "…" }  { t: "h2", text: "…" }  { t: "h3", text: "…" }
{ t: "bullets", items: ["…", "…"] }   { t: "steps", items: [...] }   { t: "checklist", items: [...] }
{ t: "quote", text: "…" }   { t: "divider" }
{ t: "callout", variant: "info" | "success" | "warning" | "error", text: "…" }    // or blocks: [...]
{ t: "table", header: ["A", "B"], rows: [["1", "2"]] }
{ t: "code", lang: "delphi" | "python" | "javascript" | "sql" | "xml", code: "…" }   // code to READ (not run)
{ t: "hero", title: "…", subtitle: "…", emoji: "🐝", theme: "purple" | "ocean" | "forest" | "sunset" | "night" }
{ t: "columns", layout: "equal" | "wide-left" | "wide-right", cols: [[blocks], [blocks]] }   // 2 to 4 columns
{ t: "reveal", title: "Hint", text: "…" }      // or blocks: [...]; opens when clicked
{ t: "diagram", code: "flowchart TD\n  A([Start]) --> B[Do it]", caption: "…" }   // Mermaid
{ t: "embed", url: "https://www.youtube.com/watch?v=…" }    // only if you are sure the link exists
```

### Things to explore (not marked)

```js
{ t: "flashcards", title: "Words to know", cards: [["Algorithm", "A list of steps that solves a problem."], ...] }
{ t: "logic", prompt: "…", expression: "(A AND B) OR NOT C", showTable: true }   // AND OR NOT XOR NAND NOR, letters A-Z, max 4 letters
{ t: "algo", prompt: "…", algorithm: "bubble" | "selection" | "insertion" | "linear" | "binary", data: [5, 2, 8, 1], target: 8 }
```

### Marked activities (the server marks them; results per student)

```js
{ t: "quiz", pass: 50, questions: [{ q: "…", options: ["a", "b", "c"], answer: 1 }] }   // answer is the index; pass is a percentage

{ t: "robot", prompt: "…", theme: "robot" | "bee" | "rocket" | "taxi" | "dog",
  mode: "arrows" | "blocks" | "turns",       // arrows: one tap one step (Grade 1-2). blocks: "move right 3" + repeat. turns: forward / turn left / turn right + repeat
  facing: "up" | "right" | "down" | "left",  // turns mode: which way it starts
  map: ["S..#", "..*T"],                     // S start, T target, # blocked, * must be collected, . empty. All rows the same length, max 10x10
  maxBlocks: 4,                              // optional: forces repeats
  starter: "right\nright",                   // optional program to start from (for "find the bug")
  solution: "repeat 3\n  move right 1\n  move up 1\nend" }   // REQUIRED: a program that passes
// Program lines: "up|down|left|right [n]" or "move right 3"; "forward [n]" (also "fwd"); "turn left|right|around" (also "tl", "tr");
// "repeat 4" … "end". Rows count from the top: "up" goes towards row 0.

{ t: "pattern", prompt: "…", tokens: ["circle:red", "square:blue", ...], blanks: [4, 5], distractors: ["triangle:green"] }
// tokens: "<shape>:<colour>" shapes circle square triangle star diamond heart hexagon arrow-up arrow-right arrow-down arrow-left;
// colours red orange yellow green blue purple pink gray. Or "=text" for numbers, letters, emoji: "=8", "=🐝".

{ t: "order", prompt: "…", items: ["first", "second", "third"], code: false }   // written in the RIGHT order; students get them shuffled. code: true = lines of code
{ t: "sort", prompt: "…", groups: { "Input": ["keyboard", "mouse"], "Output": ["screen"] } }   // 2 to 4 groups
{ t: "blanks", prompt: "…", text: "The {{CPU}} is the brain. Accept {{colour|color}}.", bank: true, distractors: ["RAM"], code: false, caseSensitive: false }
{ t: "fillTable", prompt: "…", headers: ["i", "total"], rows: [["1", "?1"], ["2", "?3"]] }   // a cell starting with "?" is one the student fills in
{ t: "squares", prompt: "…", rows: 5, cols: 5, correct: [1, 3, 5], exactly: null }   // cells count from 0, left to right, top to bottom
{ t: "bits", prompt: "…", bits: 8, target: 37 }
```

### Code that runs

```js
{ t: "codelab", language: "python" | "pascal" | "sql" | "javascript" | "blocks" | "web",
  prompt: "What to do.",
  starter: "…",            // what students begin with
  solution: "…",           // REQUIRED when there are tests: a full correct program. Never shown to students.
  setup: "…",              // sql only: CREATE TABLE / INSERT statements that build the database
  ordered: false,          // sql only: true when the task asks for ORDER BY
  toolbox: ["say", "loops"],   // blocks only: say, draw, loops, logic, math, text, variables, lists, functions
  tests: [{ name: "What it checks", stdin: "7\n3", append: "", hidden: false }] }
```

- No `tests` means free practice: students run it, nothing is marked. Good for drawing and exploring.
- With tests, the build runs `solution` once per test and stores what it prints as the expected
  output. You never write `expected` yourself. Each test must print something.
- `stdin` is what the user types, one answer per line. When a program reads input, the prompt and
  the typed answer both appear in the output, like a real terminal.
- `append` is code run after the student's code, for testing a function: `append: "print(double(4))"`.
  For SQL it is a query run afterwards (use it to check INSERT/UPDATE/DELETE: `append: "SELECT * FROM tblLearners"`).
- Output is compared exactly (apart from trailing spaces), so say precisely what to print in the prompt.
- `hidden: true` hides the expected output from students. Use a mix: one visible example, the rest hidden.
- **python**: real Python 3. `import turtle` draws on a canvas (forward, right, left, penup, pendown,
  color, begin_fill/end_fill, circle, goto, pensize, speed, bgcolor…). Drawing can't be marked.
- **pascal**: Delphi-style console Pascal. `WriteLn`, `ReadLn`, `var` sections, `Integer/Real/String/Boolean/Char`,
  `if/case/for/while/repeat`, arrays (1-D and 2-D), procedures and functions (`Result :=`), string
  functions (`Length, Copy, Pos, UpperCase, IntToStr, StrToInt, FloatToStrF`…), `div`, `mod`, and classes
  (`type TLearner = class … end;` with `constructor Create`, methods, `obj := TLearner.Create(...)`).
  No forms or components: use `WriteLn` where school code uses `redOutput.Lines.Add`.
- **sql**: SQLite. Tables are named the South African way: `tblLearners`, with fields like `LearnerID`, `Surname`.
- **blocks**: `starter` and `solution` are block workspaces. Build them with the helpers in
  `src/components/editor/runtime/blockJson.js`:

```js
import { workspace, say, ask, askNumber, join, repeat, forever, stopLoop, whileLoop, forLoop, forEach, when, whenElse, compare, both, not,
         maths, remainder, randomInt, setVar, getVar, changeVar, list, listLength, listGet, listSet, listAdd, listRemove,
         define, call, forward, back, right, left, pen, colour, penWidth, goTo, fill } from "../../src/components/editor/runtime/blockJson.js";

starter: workspace([say("Hello!")]),
solution: workspace([setVar("iTotal", 0), forLoop("i", 1, 5, [changeVar("iTotal", getVar("i"))]), say(join("Total: ", getVar("iTotal")))]),
// compare(a, "EQ"|"NEQ"|"LT"|"LTE"|"GT"|"GTE", b)   maths(a, "ADD"|"MINUS"|"MULTIPLY"|"DIVIDE", b)   both(a, "AND"|"OR", b)
// whenElse(condition, [then…], [otherwise…])   define("drawSquare", [...]) + call("drawSquare")   list positions count from 1
// workspace([...main], [define(...)]) takes one array per separate pile of blocks.
```
  `toolbox` decides which groups of blocks students see. Give them only what the lesson needs.

## Writing rules

- Write for the learner in that grade. Grade 1: five-word sentences, emoji, almost no reading.
  Grade 12 and college: precise and adult, still plain.
- South African context where it is natural: rands, taxis, braai, load-shedding, names like Thabo,
  Lerato, Aisha, Sipho, Naledi, Pieter. British/South African spelling (colour, practise as a verb).
- Follow the curriculum notes for the grade. Use its words (Grade 3 says "Fwd, TL, TR"; Grade 6 names
  variables `iScore`, `tName`; Grades 10 to 12 write Delphi with `i`, `s`, `r`, `b` prefixes and `tbl` tables).
- Teach, then do. Every page: a little explanation, then activities, most of them marked. Vary the
  block types: a page should not be three quizzes. Show off what the editor can do, with purpose.
- Keep pages short: roughly 6 to 12 blocks. No walls of text. Use columns, callouts and reveals.
- Every claim, piece of code and expected answer must be correct. Trace your own code.
- No em dashes. No filler ("Let's dive in"). No marked activities on the home page.
- Robot maps: check your `solution` by hand, square by square.
