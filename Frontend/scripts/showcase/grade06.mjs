// Grade 6, Coding and Robotics (CAPS Intermediate Phase): variables (at most two per program,
// named with a type prefix: iScore for a number, tName for text), stacking blocks to calculate
// and join text, drawing shapes with loops, modelling a traffic light ("robot") and a loop with
// one decision inside. Robotics: a real micro:bit with one extra component.

import { workspace, say, ask, askNumber, join, repeat, forLoop, when, compare, maths, remainder, setVar, getVar, changeVar, forward, right } from "../../src/components/editor/runtime/blockJson.js";

export default {
    code: "CR-G06",
    name: "Coding and Robotics: Grade 6",
    description: "Variables, calculations, shapes drawn with loops and a traffic light you can program.",
    module: "Variables and drawing with loops",

    home: [
        { t: "h1", text: "Welcome to Grade 6 coding! 🧮" },
        "This term your programs get a **memory**. A **variable** keeps a score, a name or an answer so the program can use it later. Then we use loops to draw shapes and to run a traffic light, which South Africans call a **robot**. 🚦",
        { t: "callout", variant: "success", text: "Open **Modules** to start. Work through the pages in order: each one builds on the last." },
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "Coding" }, { t: "bullets", items: ["Variables such as `iScore` and `tName`", "Adding numbers and joining words", "Drawing shapes with loops", "A loop with a decision inside"] }],
                [{ t: "h3", text: "Robotics" }, { t: "bullets", items: ["A real micro:bit plus one part: an LED or a servo", "Modelling the robot at the corner", "Testing in the simulator before you build"] }],
            ],
        },
    ],

    pages: [
        {
            title: "Variables: boxes with names",
            blocks: [
                { t: "hero", title: "A box with a name", subtitle: "Variables help a program remember.", emoji: "📦", theme: "purple" },
                "A **variable** is like a box with a label. You put a **value** in it, and you can look inside or change it whenever you need to. A game keeps your score in a variable.",
                {
                    t: "flashcards",
                    title: "Words to know",
                    cards: [
                        ["Variable", "A named place in the computer's memory that holds a value."],
                        ["Value", "What is inside the variable right now, such as 15 or \"Thabo\"."],
                        ["iScore", "The i stands for integer: a whole number. iScore holds a score."],
                        ["tName", "The t stands for text. tName holds someone's name."],
                        ["set", "Puts a new value in the variable. The old value is gone."],
                        ["change by", "Adds to the value. Change by -5 takes 5 away."],
                    ],
                },
                {
                    t: "sort",
                    prompt: "Which kind of value would each variable hold?",
                    groups: {
                        "A number (i)": ["iScore", "iAge", "iLives", "iPrice"],
                        "Text (t)": ["tName", "tColour", "tCity", "tPassword"],
                    },
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Naledi's game keeps her score in iScore. Build it:\n\n1. set iScore to 0\n2. change iScore by 10 (she finds a coin)\n3. change iScore by 10 (another coin)\n4. change iScore by -5 (a bug bites her)\n5. say iScore",
                    toolbox: ["say", "variables", "math"],
                    starter: workspace([setVar("iScore", 0)]),
                    solution: workspace([setVar("iScore", 0), changeVar("iScore", 10), changeVar("iScore", 10), changeVar("iScore", -5), say(getVar("iScore"))]),
                    tests: [{ name: "Says the final score" }],
                },
                {
                    t: "fillTable",
                    prompt: "A trace table follows a variable step by step. Fill in iScore after each block of this program.",
                    headers: ["Step", "Block", "iScore"],
                    rows: [
                        ["1", "set iScore to 5", "?5"],
                        ["2", "change iScore by 3", "?8"],
                        ["3", "change iScore by -2", "?6"],
                        ["4", "change iScore by 10", "?16"],
                        ["5", "set iScore to 0", "?0"],
                    ],
                },
                { t: "callout", variant: "info", text: "Our programs use **at most two** variables. Give each one a name that says what it holds, with **i** or **t** in front." },
            ],
        },
        {
            title: "Calculations and joining words",
            blocks: [
                { t: "hero", title: "Stack the blocks", subtitle: "Put blocks inside blocks to calculate and to build sentences.", emoji: "🧱", theme: "sunset" },
                "Blocks can go **inside** other blocks. Put two numbers in a **+** block and you get their sum. Put words and a sum in a **join** block and you get a sentence. This is called **nesting** or stacking blocks.",
                {
                    t: "table",
                    header: ["Block", "Inside it", "Gives"],
                    rows: [
                        ["iPie + iDrink", "two variables", "27 (when they hold 15 and 12)"],
                        ["join \"The total is R\" with iPie + iDrink", "text and a + block", "The total is R27"],
                        ["say join …", "a join block", "shows the sentence"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Thabo buys a pie and a cooldrink at the tuck shop.\n\n1. set iPie to ask for a number \"How much is the pie in rand? \"\n2. set iDrink to ask for a number \"How much is the drink in rand? \"\n3. say join \"The total is R\" with an iPie + iDrink block\n\nFor a pie of R15 and a drink of R12 it should say \"The total is R27\". End each question with a space, like the first one.",
                    toolbox: ["say", "variables", "math"],
                    starter: workspace([setVar("iPie", askNumber("How much is the pie in rand? "))]),
                    solution: workspace([
                        setVar("iPie", askNumber("How much is the pie in rand? ")),
                        setVar("iDrink", askNumber("How much is the drink in rand? ")),
                        say(join("The total is R", maths(getVar("iPie"), "ADD", getVar("iDrink")))),
                    ]),
                    tests: [
                        { name: "R15 and R12", stdin: "15\n12" },
                        { name: "R20 and R9", stdin: "20\n9", hidden: true },
                        { name: "A free drink", stdin: "18\n0", hidden: true },
                    ],
                },
                { t: "h2", text: "Joining words" },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Ask for a name and greet that person.\n\n1. set tName to ask \"What is your name? \"\n2. say join \"Sawubona, \" + tName + \"! Welcome to coding.\"\n\nIf you type Lerato it should say \"Sawubona, Lerato! Welcome to coding.\" (Click the cog on the join block to give it three slots.)",
                    toolbox: ["say", "variables"],
                    starter: workspace([setVar("tName", ask("What is your name? "))]),
                    solution: workspace([setVar("tName", ask("What is your name? ")), say(join("Sawubona, ", getVar("tName"), "! Welcome to coding."))]),
                    tests: [
                        { name: "Greets Lerato", stdin: "Lerato" },
                        { name: "Greets Pieter", stdin: "Pieter", hidden: true },
                    ],
                },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "iPie is 15 and iDrink is 12. What does \"iPie + iDrink\" give?", options: ["1512", "27", "iPie + iDrink"], answer: 1 },
                        { q: "Which name is best for a variable that holds a learner's surname?", options: ["tSurname", "iSurname", "x"], answer: 0 },
                        { q: "What does the join block do?", options: ["Adds two numbers", "Sticks pieces of text together into one", "Asks a question"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Drawing shapes with loops",
            blocks: [
                { t: "hero", title: "Turtle art", subtitle: "Move, turn, repeat.", emoji: "🐢", theme: "forest" },
                "The turtle draws a line wherever it moves. To draw a shape with equal sides, it repeats the same two blocks: **move forward**, then **turn**. The turtle turns all the way round once, so each turn is **360 ÷ the number of sides**.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "This draws one side of a square. Put the two blocks inside a repeat 4 block to draw the whole square.",
                    toolbox: ["draw", "loops", "math", "variables"],
                    starter: workspace([forward(100), right(90)]),
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "This triangle is missing its turn. Work out 360 ÷ 3 and add a turn right block inside the loop.",
                    toolbox: ["draw", "loops", "math", "variables"],
                    starter: workspace([repeat(3, [forward(120)])]),
                },
                {
                    t: "fillTable",
                    prompt: "How far must the turtle turn at each corner? Work out 360 ÷ sides.",
                    headers: ["Shape", "Sides", "Turn (degrees)"],
                    rows: [
                        ["Square", "4", "?90"],
                        ["Triangle", "3", "?120"],
                        ["Pentagon", "5", "?72"],
                        ["Hexagon", "6", "?60"],
                        ["Octagon", "8", "?45"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "One program for any shape. Change iSides to 5, 6 or 8 and run it again. The turn is worked out by stacking a ÷ block inside the turn block.",
                    toolbox: ["draw", "loops", "math", "variables"],
                    starter: workspace([setVar("iSides", 6), repeat(getVar("iSides"), [forward(80), right(maths(360, "DIVIDE", getVar("iSides")))])]),
                },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "How many times must the loop repeat to draw a pentagon?", options: ["4", "5", "6"], answer: 1 },
                        { q: "What happens if you leave out the turn block?", options: ["The turtle draws one long straight line", "It draws a circle", "Nothing at all"], answer: 0 },
                        { q: "Why is a loop better than writing forward and turn eight times?", options: ["It draws faster lines", "It is shorter and easier to change", "Loops use more colours"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "The robot at the corner",
            blocks: [
                { t: "hero", title: "Program a robot 🚦", subtitle: "In South Africa, a traffic light is called a robot.", emoji: "🚦", theme: "night" },
                "A traffic light follows the same **sequence** again and again: green, then amber, then red, then back to green. That is a loop!",
                {
                    t: "order",
                    prompt: "Put one cycle of the robot in order, starting with green.",
                    items: ["🟢 Green: go if the way is clear", "🟡 Amber: the light is about to change", "🔴 Red: stop and wait", "🟢 Green again: the cycle starts over"],
                },
                {
                    t: "sort",
                    prompt: "What does each colour tell a driver?",
                    groups: {
                        "Red": ["Stop behind the white line", "Wait, even if the road looks empty"],
                        "Amber": ["Stop if it is safe to do so", "Red is coming next"],
                        "Green": ["Go if the way is clear", "Still look out for people crossing"],
                    },
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Model the robot.\n\n1. set iCycles to ask for a number \"How many cycles? \"\n2. repeat iCycles times: say Green, say Amber, say Red\n\nIf you type 2, it should say the three colours twice.",
                    toolbox: ["say", "loops", "variables"],
                    starter: workspace([setVar("iCycles", askNumber("How many cycles? "))]),
                    solution: workspace([setVar("iCycles", askNumber("How many cycles? ")), repeat(getVar("iCycles"), [say("Green"), say("Amber"), say("Red")])]),
                    tests: [
                        { name: "Two cycles", stdin: "2" },
                        { name: "Three cycles", stdin: "3", hidden: true },
                    ],
                },
                {
                    t: "reveal",
                    title: "Build it with a real micro:bit",
                    blocks: [
                        { t: "steps", items: ["Connect an LED to pin **P0** and **GND**, with a resistor, using crocodile clips.", "In MakeCode, inside **forever**: **digital write pin P0 to 1**, **pause (ms) 1000**, **digital write pin P0 to 0**, **pause (ms) 1000**.", "Download the program to the micro:bit and watch the LED blink.", "Change the pauses to make it blink faster or slower."] },
                        "A full robot needs three LEDs, one for each colour. With one LED you can already test the timing.",
                    ],
                },
                { t: "callout", variant: "info", text: "A **servo** is a motor that turns to an angle. **servo write pin P0 to 90** could lift a boom gate when the light turns green." },
            ],
        },
        {
            title: "A loop with a decision inside",
            blocks: [
                { t: "hero", title: "Count and choose", subtitle: "A loop that asks a question every time round.", emoji: "🔢", theme: "ocean" },
                "A **count with** loop gives its variable `i` a new number each time round: 1, then 2, then 3, and so on. Inside the loop, an **if** block can decide what to do with each number.",
                "A number is **even** when it divides by 2 with nothing left over. The **remainder** block tells you what is left over: the remainder of 7 ÷ 2 is 1, so 7 is odd.",
                { t: "diagram", code: "flowchart TD\n  A([i = 1]) --> B{Is i up to iMax?}\n  B -- no --> F([Stop])\n  B -- yes --> C{Remainder of i / 2 = 0?}\n  C -- yes --> D[Say i] --> E[i = i + 1]\n  C -- no --> E\n  E --> B", caption: "A loop with one decision inside." },
                {
                    t: "fillTable",
                    prompt: "Work out the remainder when each number is divided by 2. Is it said?",
                    headers: ["i", "remainder of i ÷ 2", "Said? (yes or no)"],
                    rows: [
                        ["1", "?1", "?no"],
                        ["2", "?0", "?yes"],
                        ["3", "?1", "?no"],
                        ["4", "?0", "?yes"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Say only the even numbers.\n\n1. set iMax to ask for a number \"Count up to: \"\n2. count with i from 1 to iMax by 1\n3. Inside the loop: if the remainder of i ÷ 2 = 0, say i\n\nIf you type 10 it should say 2, 4, 6, 8 and 10, each on its own line.",
                    toolbox: ["say", "loops", "logic", "math", "variables"],
                    starter: workspace([setVar("iMax", askNumber("Count up to: ")), forLoop("i", 1, getVar("iMax"), [])]),
                    solution: workspace([setVar("iMax", askNumber("Count up to: ")), forLoop("i", 1, getVar("iMax"), [when(compare(remainder(getVar("i"), 2), "EQ", 0), [say(getVar("i"))])])]),
                    tests: [
                        { name: "Up to 10", stdin: "10" },
                        { name: "Up to 15", stdin: "15", hidden: true },
                    ],
                },
                { t: "reveal", title: "Challenge", text: "Change one block so the program says only the **odd** numbers. Which number do you compare the remainder with now?" },
                { t: "callout", variant: "success", text: "You used variables, calculations, loops and decisions together. That is real programming! 🏆" },
            ],
        },
    ],
};
