// Builds the showcase courses: Backend/LearnOnline/Data/showcase-courses.json.
//
//   npm run build:showcase                                  build every course and write the file
//   node scripts/build-showcase.mjs --check grade05.mjs     check one course, write nothing
//
// Each course is written as a short "draft" in scripts/showcase/*.mjs. This script turns the
// drafts into the page format the server stores, runs every model answer to fill in what a
// correct program prints, and records one passing answer per activity so a server test can
// prove that every activity in the showcase can actually be passed.
//
// Needs Python 3 on the PATH (only here, to run the Python model answers).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import initSqlJs from "sql.js";
import { draftToNodes } from "../src/components/editor/draft.js";
import { blocksToCode } from "../src/components/editor/runtime/blocksCode.js";
import { runJs } from "../src/components/editor/runtime/jsRun.js";
import { runPascal } from "../src/components/editor/runtime/pascal.js";
import { RUNNER, TURTLE_MODULE } from "../src/components/editor/runtime/pythonSource.js";
import { tableText } from "../src/components/editor/runtime/sqlText.js";
import coursework from "./showcase/coursework.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(here, "showcase");
const outFile = path.resolve(here, "../../Backend/LearnOnline/Data/showcase-courses.json");

// ---------- running model answers ----------

const sqlite = await initSqlJs();
const pythonDir = fs.mkdtempSync(path.join(os.tmpdir(), "koru-showcase-"));
fs.writeFileSync(path.join(pythonDir, "turtle.py"), TURTLE_MODULE);
fs.writeFileSync(path.join(pythonDir, "harness.py"), `${RUNNER}\nimport sys, json\njob = json.load(sys.stdin)\nsys.stdout.write(_koru_run(job["code"], job["stdin"]))\n`);

function runPython(code, stdin) {
    const result = spawnSync("python", ["harness.py"], { cwd: pythonDir, input: JSON.stringify({ code, stdin }), encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
    if (result.status !== 0) throw new Error(`Python couldn't be run: ${result.stderr || result.error}`);
    return JSON.parse(result.stdout);
}

function runSql(code, setup, ordered) {
    const db = new sqlite.Database();
    try {
        if (setup.trim()) db.run(setup);
        return { stdout: tableText(db.exec(code).at(-1), ordered), error: null };
    } catch (err) {
        return { stdout: "", error: { message: `SQL error: ${err.message}` } };
    } finally {
        db.close();
    }
}

// Must match runtime/index.js, because the server compares these strings.
const outputOf = (run) => (run.error ? `${run.stdout}${run.stdout && !run.stdout.endsWith("\n") ? "\n" : ""}Error: ${run.error.message}` : run.stdout);

function run(attrs, code, test = {}) {
    const stdin = test.stdin ?? "";
    const append = test.append ? `\n${test.append}` : "";
    switch (attrs.language) {
        case "python": return runPython(code + append, stdin);
        case "javascript": return runJs(code + append, stdin);
        case "blocks": return runJs(blocksToCode(code) + append, stdin);
        case "pascal": return runPascal(code + append, { stdin });
        case "sql": return runSql(code + append, attrs.setup, attrs.ordered);
        default: throw new Error(`Can't run ${attrs.language}`);
    }
}

// ---------- one passing answer per activity ----------

const toBits = (value, bits) => value.toString(2).padStart(bits, "0").split("").map(Number);

const ANSWERS = {
    quizBlock: (a) => ({ answers: a.questions.map((q) => q.correctAnswer) }),
    squaresBlock: (a) => ({ cells: a.exactly === null ? a.correct : a.correct.slice(0, a.exactly) }),
    moveBlock: (a, draft) => {
        if (!draft.solution) throw new Error("a robot puzzle needs a `solution` program");
        return { program: draft.solution };
    },
    patternBlock: (a) => ({ picks: [...a.blanks].sort((x, y) => x - y).map((i) => a.tokens[i]) }),
    orderBlock: (a) => ({ order: a.items.map((i) => i.id) }),
    sortBlock: (a) => ({ placements: Object.fromEntries(a.items.map((i) => [i.id, i.group])) }),
    blanksBlock: (a) => ({ blanks: [...a.text.matchAll(/\{\{(.*?)\}\}/gs)].map((m) => m[1].split("|")[0]) }),
    fillTableBlock: (a) => ({ cells: Object.fromEntries(a.answers.map(([r, c]) => [`${r},${c}`, a.rows[r][c]])) }),
    bitsBlock: (a) => (a.target === null ? null : { bits: toBits(a.target, a.bits) }),
    codeLab: (a) => (a.tests.length && a.language !== "web" ? { code: a.solution, outputs: a.tests.map((t) => t.expected) } : null),
};

/** Runs the model answer for each test that has no expected output written by hand. */
function fillExpected(attrs, where) {
    if (attrs.language === "web") return;
    if (attrs.tests.length === 0) {
        // Nothing to mark, but the code students start with should at least run.
        const first = run(attrs, attrs.starter, { stdin: "1\n2\n3\n4\n5" });
        if (first.error && !/nothing left to read/.test(first.error.message)) console.warn(`  note: ${where}: the starter code stops with "${first.error.message}"`);
        return;
    }
    if (!attrs.solution.trim()) throw new Error(`${where}: a marked code block needs a \`solution\``);
    for (const test of attrs.tests) {
        const result = run(attrs, attrs.solution, test);
        if (result.error) throw new Error(`${where}: the model answer fails "${test.name}": ${result.error.message}`);
        const printed = outputOf(result);
        if (test.expected && test.expected.trim() !== printed.trim()) throw new Error(`${where}: "${test.name}" expects ${JSON.stringify(test.expected)} but the model answer prints ${JSON.stringify(printed)}`);
        test.expected = printed;
        if (!printed.trim()) throw new Error(`${where}: "${test.name}" prints nothing, so it can't tell right from wrong`);
    }
}

// ---------- building ----------

function buildPage(blocks, idPrefix, where, checks, pageIndex) {
    const nodes = draftToNodes(blocks, idPrefix, (node, draft) => {
        const label = `${where}, ${node.type} ${node.attrs.blockId}`;
        if (node.type === "codeLab") fillExpected(node.attrs, label);
        const answer = ANSWERS[node.type]?.(node.attrs, draft);
        if (answer && pageIndex !== null) checks.push({ page: pageIndex, blockId: node.attrs.blockId, answer });
    });
    return [{ id: "main", type: "text", content: { type: "doc", content: nodes } }];
}

// "--check grade05.mjs" checks just that course and writes nothing.
const checkOnly = process.argv.includes("--check");
const named = process.argv.slice(2).filter((arg) => arg.endsWith(".mjs"));
// Grades in order, then college.
const files = named.length ? named : fs.readdirSync(sourceDir).filter((f) => f.endsWith(".mjs") && f !== "coursework.mjs").sort((a, b) => b.startsWith("grade") - a.startsWith("grade") || a.localeCompare(b));
const courses = [];
for (const file of files) {
    const { default: course } = await import(pathToFileURL(path.join(sourceDir, file)).href);
    if (course.pages.length > 5) throw new Error(`${file}: a showcase module has at most 5 pages`);
    const assignments = coursework[course.code];
    if (assignments?.length !== 4) throw new Error(`${file}: coursework.mjs needs 4 assignments for ${course.code}`);
    const checks = [];
    const items = course.pages.map((page, i) => ({
        label: page.title,
        content: { title: page.title, sections: buildPage(page.blocks, `${course.code}-p${i + 1}`.toLowerCase(), `${file} page ${i + 1}`, checks, i) },
    }));
    courses.push({
        code: course.code,
        name: course.name,
        description: course.description,
        term: course.term ?? "Term 1",
        home: { sections: buildPage(course.home, `${course.code}-home`.toLowerCase(), `${file} home`, checks, null), settings: { showCoverImage: true, coverImageUrl: "" } },
        module: course.module,
        items,
        checks,
        assignments: assignments.map(([title, points, description]) => ({ title, points, description })),
    });
    console.log(`${course.code.padEnd(8)} ${course.name}: ${items.length} pages, ${checks.length} marked activities`);
}

fs.rmSync(pythonDir, { recursive: true, force: true });
if (checkOnly) {
    console.log("Checked. Nothing was written.");
} else {
    fs.writeFileSync(outFile, `${JSON.stringify({ courses }, null, 1)}\n`);
    console.log(`Wrote ${courses.length} courses to ${path.relative(process.cwd(), outFile)}`);
}
