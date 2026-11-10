// Grade 9, Coding and Robotics (CAPS Senior Phase, block-based): procedures as user-defined
// blocks, list operations (access, modify, add, delete), at most two nested structures, motors
// and a motor driver, a first look at typed Python, and a linear search. This is the bridge to
// Grade 10, where code is typed.

import { workspace, say, ask, askNumber, join, repeat, forLoop, forEach, when, whenElse, compare, setVar, getVar, list, listGet, listSet, listAdd, listRemove, define, call, forward, right, colour } from "../../src/components/editor/runtime/blockJson.js";

const TRUE = { type: "logic_boolean", fields: { BOOL: "TRUE" } };
const FALSE = { type: "logic_boolean", fields: { BOOL: "FALSE" } };
// blockJson's listRemove leaves out the extra state that makes "remove" a statement block, and
// Blockly then refuses to stack it. This adds it.
const removeItem = (l, position) => ({ ...listRemove(l, position), extraState: { isStatement: true } });

export default {
    code: "CR-G09",
    name: "Coding and Robotics: Grade 9",
    description: "Procedures, list operations and searching, and the step from blocks to typed code.",
    module: "Procedures and list operations",

    home: [
        { t: "h1", text: "Coding and Robotics: Grade 9" },
        "Big programs are built from small, named pieces. This term you make **your own blocks** (procedures), work with **lists** like a real app does, and see what your blocks look like as **typed code**.",
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "Coding" }, { t: "bullets", items: ["Procedures: name a group of steps", "List operations: access, modify, add, delete", "Searching a list", "From blocks to Python"] }],
                [{ t: "h3", text: "Robotics" }, { t: "bullets", items: ["DC motors make a robot move", "A motor driver lets a micro:bit control them", "Procedures like `driveForward` and `turnLeft`"] }],
            ],
        },
        { t: "callout", variant: "info", text: "A rule for this term: keep it to **two nested structures** at most, like a loop inside a procedure. If you need a third, make another procedure." },
        { t: "callout", variant: "success", text: "Open **Modules** and start with *My blocks: procedures*." },
    ],

    pages: [
        {
            title: "My blocks: procedures",
            blocks: [
                { t: "hero", title: "Make your own blocks", subtitle: "Name it once. Use it everywhere.", emoji: "🧩", theme: "purple" },
                "A **procedure** is a group of steps with a name. You **define** it once (say what the steps are) and **call** it whenever you need it (use its name). In blocks, procedures live in **My blocks**.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Why bother?" }, { t: "bullets", items: ["Shorter programs: no copy and paste", "Easier to read: `drawSquare` says what it does", "Fix a bug once and it is fixed everywhere"] }],
                        [{ t: "h3", text: "Robots do this" }, "A robot car has two motors and a **motor driver** board, because a micro:bit pin is far too weak to power a motor. Programmers wrap the motor blocks in procedures like `driveForward` and `turnLeft`, then build routes from them."],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "`drawSquare` is defined once and called four times. Run it. Then make a windmill: call it 8 times with a turn of 45 between calls. Last, add a `drawTriangle` procedure of your own and use it.",
                    toolbox: ["draw", "loops", "functions", "math"],
                    starter: workspace(
                        [define("drawSquare", [repeat(4, [forward(70), right(90)])])],
                        [colour("green"), call("drawSquare"), right(90), call("drawSquare"), right(90), call("drawSquare"), right(90), call("drawSquare")],
                    ),
                },
                { t: "reveal", title: "Your main program is long. Can it be shorter?", text: "Yes: put **call drawSquare** and **turn right** inside a **repeat** block. That is two nested structures (a repeat and the repeat inside drawSquare), which is still within our rule." },
                {
                    t: "quiz",
                    pass: 67,
                    questions: [
                        { q: "You define a procedure but never call it. What happens when you run the program?", options: ["Its steps run once at the start", "Nothing: its steps never run", "The program crashes"], answer: 1 },
                        { q: "Which is the best name for a procedure that makes a robot reverse and turn away from a wall?", options: ["doStuff", "procedure1", "avoidWall"], answer: 2 },
                        { q: "Why does a robot car need a motor driver between the micro:bit and the motors?", options: ["The micro:bit cannot supply enough power to run a motor", "Motors only understand Python", "It makes the robot lighter"], answer: 0 },
                    ],
                },
            ],
        },
        {
            title: "A procedure that does a job",
            blocks: [
                "The science club is launching a water rocket on the field. The launch program needs a countdown, and a line to make the output neat. Each job gets its own procedure.",
                {
                    t: "blanks",
                    prompt: "Complete the sentences.",
                    text: "We {{define}} a procedure once to say what its steps are. We {{call}} it each time we want those steps to run. A procedure can be called {{many}} times.",
                    bank: true,
                    distractors: ["delete", "once"],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "`printLine` is done. Define a new procedure `countdown` that counts from `iStart` down to 1, saying each number. Then make the main program: ask, `printLine`, `countdown`, say `Lift off!`, `printLine`.",
                    toolbox: ["say", "functions", "loops", "variables"],
                    starter: workspace(
                        [define("printLine", [say("----------")])],
                        [setVar("iStart", askNumber("Count down from: ")), call("printLine"), say("Lift off!")],
                    ),
                    solution: workspace(
                        [define("printLine", [say("----------")])],
                        [define("countdown", [forLoop("iCount", getVar("iStart"), 1, [say(getVar("iCount"))])])],
                        [setVar("iStart", askNumber("Count down from: ")), call("printLine"), call("countdown"), say("Lift off!"), call("printLine")],
                    ),
                    tests: [
                        { name: "Count down from 3", stdin: "3" },
                        { name: "Count down from 5", stdin: "5", hidden: true },
                        { name: "Count down from 1", stdin: "1", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint", text: "A **count with** loop can count down: count with iCount from iStart to 1. When the start is bigger than the end, it goes down by 1 each time." },
                { t: "callout", variant: "info", text: "Notice the nesting: the loop is inside the procedure. That is two structures. The main program has none, because the procedures do the work." },
            ],
        },
        {
            title: "List operations",
            blocks: [
                "Every app with a contact list or a playlist does four things to lists. Learn their names: you will meet them again in every language.",
                {
                    t: "table",
                    header: ["Operation", "Block", "Example"],
                    rows: [
                        ["Access", "in list … get #", "get item 1 of lstTeam"],
                        ["Modify", "in list … set # … as", "set item 2 to Naledi"],
                        ["Add", "in list … insert at last … as", "add Pieter at the end"],
                        ["Delete", "in list … remove #", "remove item 1"],
                    ],
                },
                {
                    t: "fillTable",
                    prompt: "`lstTeam` starts as Thabo, Lerato, Sipho. Fill in the list after each operation. Leave no gaps: when an item is deleted, the items after it move up.",
                    headers: ["After", "Item 1", "Item 2", "Item 3", "Item 4"],
                    rows: [
                        ["Start", "Thabo", "Lerato", "Sipho", ""],
                        ["Set item 2 to Naledi", "Thabo", "?Naledi", "Sipho", ""],
                        ["Add Pieter", "?Thabo", "?Naledi", "?Sipho", "?Pieter"],
                        ["Remove item 1", "?Naledi", "?Sipho", "?Pieter", ""],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Do all four operations on `lstTeam`, in this order. **Access:** say `Captain: ` joined to item 1. **Modify:** ask `New name for position 2: ` and set item 2 to the answer. **Add:** add `Pieter` at the end. **Delete:** remove item 1. Then say each name in the list on its own line.",
                    toolbox: ["say", "lists", "variables", "loops"],
                    starter: workspace([setVar("lstTeam", list("Thabo", "Lerato", "Sipho"))]),
                    solution: workspace([
                        setVar("lstTeam", list("Thabo", "Lerato", "Sipho")),
                        say(join("Captain: ", listGet(getVar("lstTeam"), 1))),
                        listSet(getVar("lstTeam"), 2, ask("New name for position 2: ")),
                        listAdd(getVar("lstTeam"), "Pieter"),
                        removeItem(getVar("lstTeam"), 1),
                        forEach("tName", getVar("lstTeam"), [say(getVar("tName"))]),
                    ]),
                    tests: [
                        { name: "Naledi joins the team", stdin: "Naledi" },
                        { name: "Aisha joins the team", stdin: "Aisha", hidden: true },
                    ],
                },
                { t: "callout", variant: "warning", text: "Blocks count list positions from **1**. Python and most typed languages count from **0**. Keep that in mind next year." },
            ],
        },
        {
            title: "From blocks to text",
            blocks: [
                "Every block program is real code underneath. In Grade 10 you stop dragging and start **typing**, in Delphi or Python. The ideas stay the same: only the way you write them changes.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "This program says the numbers 1 to 5. Run it, then press **Show as Python** and read the code the blocks make.",
                    toolbox: ["say", "loops", "variables"],
                    starter: workspace([forLoop("iNumber", 1, 5, [say(getVar("iNumber"))])]),
                },
                {
                    t: "table",
                    header: ["Blocks", "Python"],
                    rows: [
                        ["say Hello!", "`print(\"Hello!\")`"],
                        ["set iScore to 0", "`iScore = 0`"],
                        ["repeat 4 times", "`for i in range(4):`"],
                        ["count with i from 1 to 5", "`for i in range(1, 6):`"],
                        ["if … else", "`if …:` and `else:`"],
                    ],
                },
                { t: "callout", variant: "warning", text: "`range(1, 6)` stops **before** 6. And Python uses **indentation** (spaces at the start of a line) to show which lines are inside the loop, where blocks use the C-shaped slot." },
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Now type it yourself. Use a `for` loop to print the numbers 1 to 5, one per line.",
                    starter: "# Print the numbers 1 to 5, one per line\n",
                    solution: "for i in range(1, 6):\n    print(i)\n",
                    tests: [{ name: "Prints 1 to 5" }],
                },
                "Typed code can draw too. This star turns 144 degrees at each point, because the turtle goes round **twice** while drawing it: 5 × 144 = 720.",
                {
                    t: "codelab",
                    language: "python",
                    prompt: "Run the star. Then change the colour, and try 7 points with a turn of `720 / 7`... does it work? Why?",
                    starter: "import turtle\n\nturtle.color(\"gold\")\nturtle.begin_fill()\nfor i in range(5):\n    turtle.forward(150)\n    turtle.right(144)\nturtle.end_fill()\n",
                },
            ],
        },
        {
            title: "Searching a list",
            blocks: [
                "How does your phone find a contact? The simplest way is a **linear search**: start at item 1 and check each item in turn until you find the one you want, or run out of items.",
                { t: "algo", prompt: "Watch a linear search look for 9. Count how many items it checks.", algorithm: "linear", data: [14, 7, 22, 9, 31, 5], target: 9 },
                {
                    t: "quiz",
                    pass: 67,
                    questions: [
                        { q: "The list has 6 items and the target is 9, in position 4. How many items does the search check?", options: ["1", "4", "6"], answer: 1 },
                        { q: "The target is not in the list at all. How many of the 6 items are checked?", options: ["None", "3", "All 6"], answer: 2 },
                        { q: "When is a linear search fastest?", options: ["When the target is the first item", "When the target is the last item", "When the list is long"], answer: 0 },
                    ],
                },
                "Now write one. A **Boolean** variable `bFound` starts as **false** and becomes **true** when the name turns up. After the loop, it tells you the answer.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Ask `Name to find: `. Search `lstClass` with a **for each** loop. If an item equals the name, set `bFound` to true. After the loop, say `Sipho is in the class` or `Sipho is not in the class` (with the name that was typed). Names must match exactly, capital letters too.",
                    toolbox: ["say", "lists", "loops", "logic", "variables"],
                    starter: workspace([setVar("lstClass", list("Thabo", "Lerato", "Aisha", "Sipho", "Naledi")), setVar("tTarget", ask("Name to find: ")), setVar("bFound", FALSE)]),
                    solution: workspace([
                        setVar("lstClass", list("Thabo", "Lerato", "Aisha", "Sipho", "Naledi")),
                        setVar("tTarget", ask("Name to find: ")),
                        setVar("bFound", FALSE),
                        forEach("tName", getVar("lstClass"), [when(compare(getVar("tName"), "EQ", getVar("tTarget")), [setVar("bFound", TRUE)])]),
                        whenElse(getVar("bFound"), [say(join(getVar("tTarget"), " is in the class"))], [say(join(getVar("tTarget"), " is not in the class"))]),
                    ]),
                    tests: [
                        { name: "Finds Sipho", stdin: "Sipho" },
                        { name: "Pieter is not there", stdin: "Pieter", hidden: true },
                        { name: "First name in the list", stdin: "Thabo", hidden: true },
                        { name: "Last name in the list", stdin: "Naledi", hidden: true },
                    ],
                },
                { t: "reveal", title: "Why not say the answer inside the loop?", text: "Inside the loop you would say \"not in the class\" for every name that does not match: four times for Sipho. Only after checking every item do you know the name is missing. That is what `bFound` is for." },
            ],
        },
    ],
};
