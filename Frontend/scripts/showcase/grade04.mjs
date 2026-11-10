// Grade 4, Coding and Robotics (CAPS Intermediate Phase): first block programs, like Scratch.
// Single commands, an event that starts the program, ask and its answer as an input placeholder
// (not called a variable), repeat with a fixed count, one IF that checks the answer, and
// fixed-value sums. Unplugged sequencing, patterns, tracing and debugging carry on alongside.

import { workspace, say, ask, join, repeat, when, compare, maths, forward, right } from "../../src/components/editor/runtime/blockJson.js";

export default {
    code: "CR-G04",
    name: "Coding and Robotics: Grade 4",
    description: "First block programs: say, ask, repeat and one IF decision.",
    module: "My first block programs",

    home: [
        { t: "h1", text: "Welcome to block coding! 🧩" },
        "This term you build real programs by snapping **blocks** together, like in Scratch.",
        { t: "callout", variant: "success", text: "Open **Modules** and work through the pages in order. Press **Run** often to test your program." },
        { t: "h2", text: "What we will do" },
        { t: "bullets", items: ["Make the computer say things", "Ask a question and use the answer", "Repeat a command without copying it", "Make one decision with IF", "Trace programs and fix bugs"] },
    ],

    pages: [
        {
            title: "Say it with blocks",
            blocks: [
                { t: "hero", title: "Programs made of blocks 🧩", subtitle: "Snap blocks together like a puzzle to make a program.", emoji: "🧩", theme: "sunset" },
                "Each block is one **command**: one thing for the computer to do. The computer runs the blocks from **top to bottom**, one at a time. That order is the **sequence**.",
                {
                    t: "flashcards",
                    title: "Words to know",
                    cards: [
                        ["Command", "One instruction, like say \"Hello!\"."],
                        ["Program", "Commands joined together to do a job."],
                        ["Sequence", "The order the commands run in: top to bottom."],
                        ["Event", "Something that happens and starts the code, like pressing Run. It is also called a trigger."],
                        ["Bug", "A mistake that stops a program doing what you want."],
                    ],
                },
                { t: "h2", text: "Free play" },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Change the words in the **say** block, then press **Run**. Drag in more say blocks. What happens?",
                    toolbox: ["say"],
                    starter: workspace([say("Hello!")]),
                },
                { t: "h2", text: "Your turn" },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Make the program say these three lines, in this order, spelt exactly like this:\n\n`Sawubona!`\n`My name is Koru.`\n`I love coding.`",
                    toolbox: ["say"],
                    starter: workspace([say("Sawubona!")]),
                    solution: workspace([say("Sawubona!"), say("My name is Koru."), say("I love coding.")]),
                    tests: [{ name: "Says the three lines in order" }],
                },
                { t: "callout", variant: "info", text: "The order matters. Swap two say blocks and press Run again. 🔀" },
            ],
        },
        {
            title: "Ask and answer",
            blocks: [
                "The **ask** block asks a question and waits for you to type. What you type is the **answer**.",
                "Put the ask block inside another block, and the answer goes into that gap. It is a **placeholder**: it holds whatever was typed, so the program works for every name.",
                "The **join** block sticks words together. Join `Hello, ` + the answer + `!` and the program greets anyone.",
                {
                    t: "table",
                    header: ["You type", "The program says"],
                    rows: [["Thabo", "Hello, Thabo!"], ["Aisha", "Hello, Aisha!"]],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Drag an **ask** block into the middle gap of the join block (where the `?` is). Make it ask `What is your name?`. The program must then say `Hello, ` + the answer + `!`, for example `Hello, Thabo!`.",
                    toolbox: ["say"],
                    starter: workspace([say(join("Hello, ", "?", "!"))]),
                    solution: workspace([say(join("Hello, ", ask("What is your name?"), "!"))]),
                    tests: [
                        { name: "Greets Thabo", stdin: "Thabo" },
                        { name: "Greets Naledi", stdin: "Naledi", hidden: true },
                    ],
                },
                {
                    t: "blanks",
                    prompt: "Fill in the block names.",
                    text: "The {{ask}} block asks a question. What you type is the {{answer}}. The {{join}} block sticks words together. The {{say}} block shows them.",
                    bank: true,
                    distractors: ["repeat"],
                },
            ],
        },
        {
            title: "Repeat",
            blocks: [
                "To run the same command many times, don't copy it. Put it inside a **repeat** block. **repeat 3** runs the blocks inside it 3 times.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Use a **repeat** block so the program says `Hip hip hooray!` exactly **3** times.",
                    toolbox: ["say", "loops"],
                    starter: workspace([say("Hip hip hooray!")]),
                    solution: workspace([repeat(3, [say("Hip hip hooray!")])]),
                    tests: [{ name: "Cheers 3 times" }],
                },
                { t: "h2", text: "Draw with repeat ✏️" },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Press **Run**: forward 100, turn right 90, four times, makes a square. Now change 4 to **3** and 90 to **120**. What shape do you get?",
                    toolbox: ["draw", "loops"],
                    starter: workspace([repeat(4, [forward(100), right(90)])]),
                },
                { t: "reveal", title: "Answer and a challenge", text: "A triangle! 3 turns of 120 make a full turn (360). Try **6** and **60** for a hexagon." },
                {
                    t: "fillTable",
                    prompt: "Trace this program: **repeat 3** { say `Clap!`, say `Stamp!` }. Fill in the totals after each round.",
                    headers: ["After round", "Claps", "Stamps", "Lines said"],
                    rows: [["1", "1", "1", "2"], ["2", "?2", "?2", "?4"], ["3", "?3", "?3", "?6"]],
                },
            ],
        },
        {
            title: "IF: one decision",
            blocks: [
                "An **IF** block checks something. If it is true, the blocks inside it run. If it is not true, they are skipped.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "In words" }, { t: "quote", text: "IF the answer is koru, THEN say Welcome in!" }],
                        [{ t: "h3", text: "In blocks" }, { t: "bullets", items: ["**if** (ask ‘What is the password?’) **=** ‘koru’", "**do** say ‘Welcome in!’"] }],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Make a secret door. Drag an **ask** block into the empty left gap of the `=` block and make it ask `What is the password?`. IF the answer is `koru`, the program says `Welcome in!`. Any other answer: it says nothing.",
                    toolbox: ["say", "logic"],
                    starter: workspace([when(compare("", "EQ", "koru"), [say("Welcome in!")])]),
                    solution: workspace([when(compare(ask("What is the password?"), "EQ", "koru"), [say("Welcome in!")])]),
                    tests: [
                        { name: "The right password opens the door", stdin: "koru" },
                        { name: "A wrong password does not", stdin: "banana" },
                    ],
                },
                {
                    t: "sort",
                    prompt: "Trace the program. Which answers make it say Welcome in? Capital letters count!",
                    groups: {
                        "Says Welcome in!": ["koru"],
                        "Says nothing": ["Koru", "banana", "koru123"],
                    },
                },
                {
                    t: "order",
                    prompt: "Put this pseudocode for the secret door in order.",
                    items: ["START", "ASK \"What is the password?\"", "IF answer = \"koru\" THEN", "SAY \"Welcome in!\"", "END IF", "STOP"],
                    code: true,
                },
            ],
        },
        {
            title: "Trace and debug",
            blocks: [
                { t: "callout", variant: "warning", text: "To **debug**: run the program, compare what it does with what it should do, then find and fix the block that is wrong. 🐞" },
                "Blocks can work out sums with fixed numbers. Lerato wants to know how many legs 3 dogs have. Each dog has 4 legs.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Run it: it says `3 dogs have 7 legs.` That's a bug! Fix the sum so it says `3 dogs have 12 legs.`",
                    toolbox: ["say", "math"],
                    starter: workspace([say(join("3 dogs have ", maths(3, "ADD", 4), " legs."))]),
                    solution: workspace([say(join("3 dogs have ", maths(3, "MULTIPLY", 4), " legs."))]),
                    tests: [{ name: "Says the right number of legs" }],
                },
                { t: "pattern", prompt: "Legs for 1, 2, 3, 4, 5 and 6 dogs. Fill in the gaps.", tokens: ["=4", "=8", "=12", "=16", "=20", "=24"], blanks: [3, 5], distractors: ["=18", "=22"] },
                {
                    t: "order",
                    prompt: "An algorithm is a set of steps in order. Put the steps for planting a seed in order.",
                    items: ["Dig a small hole", "Drop the seed into the hole", "Cover the seed with soil", "Water the soil", "Wait for it to grow 🌱"],
                },
                {
                    t: "quiz",
                    pass: 75,
                    questions: [
                        { q: "Which block asks a question and waits for you to type?", options: ["say", "ask", "repeat"], answer: 1 },
                        { q: "**repeat 4** { say `Hi` }. How many times does it say Hi?", options: ["1", "4", "5"], answer: 1 },
                        { q: "IF answer = `koru` THEN say `Welcome in!`. You type `banana`. What happens?", options: ["It says Welcome in!", "The blocks inside the IF are skipped", "It asks again"], answer: 1 },
                        { q: "What does **say** (5 + 3) say?", options: ["53", "8", "5 + 3"], answer: 1 },
                    ],
                },
                { t: "callout", variant: "success", text: "You built programs that say, ask, repeat and decide. You are a block coder! 🏆" },
            ],
        },
    ],
};
