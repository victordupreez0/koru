# Koru page editor: activity blocks and the Grade 1 to college showcase

Date: 2026-11-10. Branch: `vic/editor-showcase` (from `vic/editor-demo-seed`).

## Goal

Make the page editor something a teacher can build remarkable lessons with, and prove it with
13 showcase courses (Grade 1 to Grade 12, plus first-year college), one module each, at most
5 pages per module, based on what South African learners are actually taught.

Feedback this design answers: the editor is "too simple and still confusing to use"; the AI
help is liked; teachers need far more freedom.

## What changes

1. **More blocks.** Runnable code (Python, JavaScript, SQL, web pages), turtle drawing, a richer
   robot puzzle, six new auto-marked activities, three things to explore, and layout blocks.
2. **A clearer editor.** A block gallery with categories and search replaces the flat Insert
   list. Every activity has "Set up" and "Try it" tabs, so a teacher tries it exactly as a
   student will, without leaving the editor.
3. **More AI (not built yet).** "Draft with AI" would write a first version of a page from a topic,
   in the same draft format the showcase uses (`editor/draft.js`). Deferred: it needs an AI key to test.
4. **Showcase content.** 13 courses seeded from one JSON file built from readable source files.

## Architecture

### Server: one class per activity

`Services/Marking/BlockKind.cs` is the base class. Every auto-marked block is one subclass in
`Services/Marking/Kinds/`, discovered by reflection (`BlockKind.All`):

```csharp
public abstract class BlockKind {
    public abstract string Type { get; }                                  // Tiptap node name
    public abstract MarkResult Mark(JsonObject attrs, JsonElement answer); // throws MarkingException on a malformed answer
    public virtual void Strip(JsonObject attrs) { }                       // hide the answer key from students
}
```

`MarkingJson` has the shared helpers (`Int`, `Bool`, `Str`, `Strings`, `Objects`, `Array`,
`Object`, `Text`, `SameText`, `Shuffle`, `Bad`). `Shuffle(items, seed)` is deterministic; seed it
with the block's `blockId` so a reload shows the same order.

The rule that must never break: **a student's browser never receives an answer key and never
decides a result.** `PageBlocks.StripAnswers` runs every kind's `Strip` on every page a
student loads. Answers go to `POST /api/Attempt/pages/{pageId}/blocks/{blockId}` and the server
marks them against the stored block.

Two staff-only endpoints let a lecturer try an unsaved block: `POST /api/Attempt/preview/student-view`
(returns the stripped attrs) and `POST /api/Attempt/preview/mark`.

### Client: one file per block

`blocks/activity.jsx` exports `makeActivityBlock({ name, label, icon, attributes, Author, Play, marked })`:

- `Author({ attrs, update })` is the lecturer's settings form. `update(patch)` merges attributes.
- `Play({ attrs })` is what a student does. `attrs` is the stripped version. It renders only the
  body: the frame (`BlockShell`), the Set up / Try it tabs and the progress badge are added for it.
- Marked activities call `const { submit, busy, error, progress } = useBlockAttempt(attrs.blockId)`
  from `blocks/interactive.js`. `submit(answer)` resolves to `{ passed, score, maxScore, message, details }`
  or `null` on a network error (then `error` holds the message). `progress.lastAnswer` is the
  student's previous answer and should be shown when they come back.
- `marked: false` is for blocks with nothing to mark.
- Structured attributes use `jsonAttribute(name, fallback)` from `behaviours.js`.

### Conventions for every block

- Design tokens only: Tailwind classes such as `bg-koru-surface-container-high`, `text-koru-on-surface`,
  `rounded-koru-md`, text sizes `text-koru-body|label|caption`. UI kit from `components/UI`
  (`Alert, Badge, Button, Card, Input, Select, Modal, Skeleton`). Icons from `lucide-react`.
- After marking: `<Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert>`,
  `celebrate()` on a pass, the `koru-shake` class on the thing that was wrong, `koru-pop` on what was right.
- Everything works by tap and by keyboard. Drag and drop is an extra, never the only way.
- Respect `prefers-reduced-motion`.
- Plain language a child can read. No jargon in messages.

## Blocks

### Auto-marked

| Node name | Label | Attributes | Student answer |
|---|---|---|---|
| `squaresBlock` | Pick the right squares | existing | `{ cells }` |
| `quizBlock` | Quiz | existing | `{ answers }` |
| `moveBlock` | Robot puzzle | existing + `stars`, `maxBlocks`, `theme`, `mode` | `{ program }` |
| `patternBlock` | Complete the pattern | `prompt, tokens[], blanks[], distractors[]` | `{ picks[] }` |
| `orderBlock` | Put in order | `prompt, items[{id,text}], code` | `{ order[] }` |
| `sortBlock` | Sort into groups | `prompt, groups[{id,label}], items[{id,text,group}]` | `{ placements{} }` |
| `blanksBlock` | Fill in the blanks | `prompt, text, code, bank, distractors[], caseSensitive` | `{ blanks[] }` |
| `fillTableBlock` | Fill in the table | `prompt, headers[], rows[][], answers[[r,c]], caseSensitive` | `{ cells{} }` |
| `bitsBlock` | Binary switches | `prompt, bits, target` | `{ bits[] }` |
| `codeLab` | Code | `language, prompt, starter, setup, solution, tests[], ordered, toolbox` | `{ code, outputs[] }` |

Details for each new one:

**patternBlock.** `tokens` is the whole sequence. A token is a string: `"<shape>:<colour>"`
(shapes: circle, square, triangle, star, diamond, heart, hexagon, arrow-up, arrow-right,
arrow-down, arrow-left; colours: red, orange, yellow, green, blue, purple, pink, gray) or
`"=<text>"` for a number, letter or emoji (`"=7"`, `"=🐝"`). `blanks` holds the indexes students
must fill. Strip: set `tokens[i] = null` for each blank, add `options` (the distinct answers plus
`distractors`, shuffled), remove `distractors`. Answer: `picks`, one token per blank in ascending
index order. Score is the number of right picks; pass needs all of them. Details `{ perBlank: bool[] }`.
Messages: "You completed the pattern!" / "{score} out of {max} are right. Look at the pattern again."

**orderBlock.** `items` is stored in the right order. Strip: shuffle (rotate by one if the shuffle
happens to equal the right order and there is more than one item). Answer: `order`, the item ids.
Mark by comparing the *text* in each position, so two identical lines are interchangeable.
Details `{ perItem: bool[] }` in the submitted order. Messages: "Spot on! That's the right order." /
"{score} of {max} are in the right place. Keep going!" `code: true` shows items as monospace lines.

**sortBlock.** Two to four groups. Strip: remove `group` from each item and shuffle the items.
Answer: `placements`, item id to group id. Details `{ perItem: { id: bool } }`. Messages:
"Everything is in the right group!" / "{score} of {max} are in the right group. Have another look."

**blanksBlock.** `text` marks answers with double braces: `The {{CPU}} is the brain`. Alternatives
are separated by `|`: `{{colour|color}}`. Strip: empty every marker to `{{}}`; when `bank` is true add
`options` (first alternative of each blank plus `distractors`, de-duplicated, shuffled); remove
`distractors`. Answer: `blanks`, one string per marker. Compare with `SameText` (case-insensitive
unless `caseSensitive`). Details `{ perBlank: bool[] }`. Messages: "All correct!" /
"{score} of {max} blanks are right. Check the others." `code: true` renders monospace with whitespace kept.

**fillTableBlock.** For trace tables and truth tables. `answers` lists the `[row, col]` cells students
fill in. Strip: blank those cells. Answer: `cells`, `"row,col"` to text. Details
`{ perCell: { "r,c": bool } }`. Messages: "Every cell is right!" / "{score} of {max} cells are right."

**bitsBlock.** `bits` is 4 or 8. `target` null means free play (no Check button; marking throws
"Nothing to check here: just explore."). Answer: `bits`, most significant first. Messages:
"Yes! {binary} is {target}." / "That makes {value}. You need {target}."

**codeLab.** The browser runs the code; the server compares what it printed. `tests` is
`[{ name, stdin, append, expected, hidden }]`: each test runs the student's code followed by
`append`, with `stdin` as typed input. Strip removes `solution` and the `expected` of hidden tests.
Output is compared after trimming trailing spaces and blank lines. `language` is `python`
(Pyodide in a worker, with a `turtle` module that draws on a canvas), `blocks` (Blockly, run as
JavaScript), `pascal` (a Delphi-style interpreter, `runtime/pascal.js`), `javascript` (worker),
`sql` (sql.js; `setup` builds the tables; `ordered: false` ignores row order) or `web`
(HTML/CSS/JS preview, never marked).

**moveBlock.** Program lines: `move right 3`, `up`, `repeat 4` ... `end` (nested up to 3 deep).
`stars` must all be collected. `maxBlocks` caps the number of commands (a repeat is one command).
`theme` picks the characters (robot, bee, rocket, taxi, dog). `mode: "arrows"` is the version for
young children: one tap, one step, no numbers.

### To explore (not marked)

| Node name | Label | Attributes |
|---|---|---|
| `logicBlock` | Logic gates | `prompt, expression, showTable` |
| `algoBlock` | Algorithm animation | `prompt, algorithm, data[], target` |
| `flashcardsBlock` | Flashcards | `title, cards[{front, back}]` |
| `diagram` | Diagram | `code` (Mermaid), `caption` |

### Layout

`hero` (title, subtitle, emoji, theme), `columns` > `column` (any blocks side by side),
`details` (a title that opens to reveal a hint or solution), plus the existing callout, table,
image, embed, file and drawing.

## Editor experience

- **Block gallery**: one "Add" button opens a searchable panel grouped into Basics, Layout,
  Media, Code and diagrams, Activities, Explore. The slash menu uses the same catalog.
- **Set up / Try it** on every activity.
- **Templates** gain lesson shapes that use the new blocks.
- **Draft with AI** (deferred): topic and level in, a reviewable list of blocks out, in the draft format.

## Showcase content

Source lives in `Frontend/scripts/showcase/` as plain JS data (the "draft" format, converted by
`editor/draft.js`). `npm run build:showcase` converts it to Tiptap JSON, runs every model solution
to fill in expected outputs, and writes `Backend/LearnOnline/Data/showcase-courses.json`.
`ShowcaseSeeder` creates the 13 courses for the dev teacher, enrols the dev student with classmates,
and seeds a term of coursework around each one (assignments from `coursework.mjs`, submissions, marks,
announcements, attendance, weekly classes, to-dos).
`SEED_DEMO_COURSE=true` seeds what is missing; `SEED_DEMO_COURSE=refresh` rebuilds the showcase.

## Testing

- xUnit per kind: correct, partly right, wrong, malformed answer, and that `Strip` leaves no key.
- Jest: every block round-trips through the schema; pure logic (parsers, step builders) is unit
  tested; the showcase JSON is loaded into the real schema.
- Every block is tried by hand in the browser as lecturer and as student.
