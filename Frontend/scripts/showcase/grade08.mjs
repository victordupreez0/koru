// Grade 8, Coding and Robotics (CAPS Senior Phase, block-based): shapes drawn from user input,
// a first list, several variables at once, a smart plant-watering system with moisture and
// temperature sensors, two micro:bits talking by radio, AND / OR / NOT, and a guided double
// nested loop. Teenagers: plain, direct, a little humour, no baby talk.

import { workspace, say, ask, askNumber, join, repeat, forLoop, forEach, whenElse, compare, both, not, maths, setVar, getVar, list, listLength, listAdd, forward, right, colour } from "../../src/components/editor/runtime/blockJson.js";

export default {
    code: "CR-G08",
    name: "Coding and Robotics: Grade 8",
    description: "Shapes from input, lists, sensors, logic and nested loops, built towards a smart plant-watering system.",
    module: "Shapes from input and smart systems",

    home: [
        { t: "h1", text: "Coding and Robotics: Grade 8" },
        "This term your programs start to **listen**. They ask questions, remember answers in variables and lists, and make decisions from sensor readings, the same way a real smart system does.",
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "You will code" }, { t: "bullets", items: ["Shapes that change with the number you type", "Your own list", "Decisions with AND, OR and NOT", "A loop inside a loop"] }],
                [{ t: "h3", text: "You will design" }, { t: "bullets", items: ["A smart plant-watering system", "Moisture and temperature sensors", "Two micro:bits that talk by radio"] }],
            ],
        },
        { t: "callout", variant: "info", text: "Every page has a **Run** button. Run often. A program that runs and is wrong teaches you more than one you never tried." },
        { t: "callout", variant: "success", text: "Open **Modules** and start with *Shapes from a number*." },
    ],

    pages: [
        {
            title: "Shapes from a number",
            blocks: [
                { t: "hero", title: "One program, every shape", subtitle: "Type a number, get a shape.", emoji: "🔷", theme: "ocean" },
                "A turtle that draws a shape walks along one side, turns, and repeats. To come back to where it started it must turn **360 degrees in total**. So for a shape with the same sides and angles, each turn is **360 ÷ number of sides**.",
                "Instead of writing one program for a triangle and another for a hexagon, we **ask** for the number of sides and store it in the variable `iSides`. The program does the maths.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Run the program and type 3, then 5, then 8. Then try the challenges below.",
                    toolbox: ["say", "draw", "loops", "math", "variables"],
                    starter: workspace([
                        setVar("iSides", askNumber("How many sides? ")),
                        colour("blue"),
                        repeat(getVar("iSides"), [forward(80), right(maths(360, "DIVIDE", getVar("iSides")))]),
                        say(join("Each turn was ", maths(360, "DIVIDE", getVar("iSides")), " degrees")),
                    ]),
                },
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "callout", variant: "info", text: "**Challenge 1:** a 20-sided shape goes off the screen. Change `move forward 80` so the side length is `400 ÷ iSides`. Now every shape fits." }],
                        [{ t: "callout", variant: "info", text: "**Challenge 2:** add a second variable, `iLength`, and ask for the side length too. Your program now uses **two** inputs." }],
                    ],
                },
                {
                    t: "fillTable",
                    prompt: "Work out the turn for each shape. Use 360 ÷ sides, then check with your program.",
                    headers: ["Shape", "Sides", "Turn (degrees)"],
                    rows: [
                        ["Triangle", "3", "120"],
                        ["Square", "4", "?90"],
                        ["Pentagon", "5", "?72"],
                        ["Hexagon", "6", "?60"],
                        ["Octagon", "8", "?45"],
                        ["Decagon", "10", "?36"],
                    ],
                },
                { t: "reveal", title: "Why does a 360-sided shape look like a circle?", text: "Each turn is only 1 degree and each side is tiny, so your eye cannot see the corners. Computers draw most circles this way: many short straight lines." },
            ],
        },
        {
            title: "Build your own list",
            blocks: [
                "A variable holds **one** value. A **list** holds many values under one name, in order. Each value has a **position**, and in blocks the first position is **1**.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Variable" }, "`tPlant` = Spinach", "One box, one value."],
                        [{ t: "h3", text: "List" }, "`lstPlants` = Spinach, Tomato, Mint", "Position 1 is Spinach, position 2 is Tomato, position 3 is Mint."],
                    ],
                },
                {
                    t: "sort",
                    prompt: "Would you store this in one variable or in a list?",
                    groups: {
                        "One variable": ["Your age", "Today's maximum temperature", "The name of your school"],
                        "A list": ["The marks of all 32 learners in your class", "The temperature every hour today", "The players in the netball team"],
                    },
                },
                { t: "h2", text: "The school vegetable garden" },
                "The garden club keeps a list of what they grow. Your program asks for one more plant, adds it to the list, and reports.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Start with the list `lstPlants` = Spinach, Tomato, Mint. Ask `Name a plant to add: ` and **add** the answer to the end of the list. Then say `We grow 4 plants` (use the **length of** block, not the number 4), and after that say each plant on its own line with a **for each** loop.",
                    toolbox: ["say", "lists", "variables", "loops"],
                    starter: workspace([setVar("lstPlants", list("Spinach", "Tomato", "Mint"))]),
                    solution: workspace([
                        setVar("lstPlants", list("Spinach", "Tomato", "Mint")),
                        setVar("tPlant", ask("Name a plant to add: ")),
                        listAdd(getVar("lstPlants"), getVar("tPlant")),
                        say(join("We grow ", listLength(getVar("lstPlants")), " plants")),
                        forEach("tItem", getVar("lstPlants"), [say(getVar("tItem"))]),
                    ]),
                    tests: [
                        { name: "Adds Basil", stdin: "Basil" },
                        { name: "Adds Rooibos", stdin: "Rooibos", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint", text: "Use the **in list … set … as** block from Lists: change **set** to **insert at** and **#** to **last**. **For each item in list** is in Repeat." },
            ],
        },
        {
            title: "The smart plant-watering system",
            blocks: [
                { t: "hero", title: "Plants that water themselves", subtitle: "A Natural Sciences problem with a Technology solution.", emoji: "🌱", theme: "forest" },
                "Plants need water, but too much drowns the roots and wastes water in a dry province. A smart system measures the soil and only waters when it needs to. Every system like this has three parts: a **sensor** (input), a **controller** that decides (processing) and an **actuator** that acts (output).",
                {
                    t: "diagram",
                    code: "flowchart TD\n  A([Start]) --> B[/Read soil moisture %/]\n  B --> C{Moisture below 30?}\n  C -- Yes --> D[Pump ON]\n  C -- No --> E[Pump OFF]\n  D --> F[Wait 1 minute]\n  E --> F\n  F --> B",
                    caption: "The controller reads the sensor, decides, acts, and then does it all again.",
                },
                {
                    t: "sort",
                    prompt: "Sort the parts of a smart greenhouse.",
                    groups: {
                        "Sensor (input)": ["Soil moisture sensor", "Temperature sensor", "Light sensor"],
                        "Controller (decides)": ["The micro:bit running your program", "IF moisture below 30"],
                        "Actuator (output)": ["Water pump", "Fan", "Warning buzzer"],
                    },
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Ask `Soil moisture %: ` and store the number in `iMoisture`. IF it is below 30, say `Pump ON`, ELSE say `Pump OFF`. Careful: exactly 30 is not below 30.",
                    toolbox: ["say", "logic", "variables"],
                    starter: workspace([setVar("iMoisture", askNumber("Soil moisture %: "))]),
                    solution: workspace([
                        setVar("iMoisture", askNumber("Soil moisture %: ")),
                        whenElse(compare(getVar("iMoisture"), "LT", 30), [say("Pump ON")], [say("Pump OFF")]),
                    ]),
                    tests: [
                        { name: "Dry soil (12%)", stdin: "12" },
                        { name: "Just dry (29%)", stdin: "29", hidden: true },
                        { name: "Exactly 30%", stdin: "30", hidden: true },
                        { name: "Wet soil (75%)", stdin: "75", hidden: true },
                    ],
                },
                { t: "h2", text: "Two micro:bits, one garden" },
                "The garden is far from the classroom. One micro:bit sits in the soil with the sensor. A second micro:bit in the classroom shows the reading. They talk by **radio**, and both must be set to the same radio **group** or they cannot hear each other.",
                {
                    t: "order",
                    prompt: "Put the radio steps in order.",
                    items: ["Set both micro:bits to radio group 1", "The garden micro:bit reads the moisture sensor", "The garden micro:bit sends the number by radio", "The classroom micro:bit receives the number", "The classroom micro:bit shows the number on its LEDs"],
                },
                { t: "callout", variant: "info", text: "A micro:bit pin reads a sensor as a number from 0 to 1023. Your program can turn that into a percentage before it decides." },
            ],
        },
        {
            title: "Thinking with AND, OR, NOT",
            blocks: [
                "Our pump has a problem. If the water tank is empty, the pump runs dry and burns out. So the rule becomes: **pump on when the soil is Dry AND the tank is NOT Empty**.",
                {
                    t: "table",
                    header: ["Operator", "True when…"],
                    rows: [["A AND B", "both A and B are true"], ["A OR B", "at least one of them is true"], ["NOT A", "A is false (it flips the value)"]],
                },
                { t: "logic", prompt: "D means the soil is Dry. E means the tank is Empty. Click the switches and watch when the pump turns on.", expression: "D AND NOT E", showTable: false },
                {
                    t: "fillTable",
                    prompt: "Complete the truth table. Type True or False.",
                    headers: ["D (dry)", "E (tank empty)", "NOT E", "D AND NOT E (pump)"],
                    rows: [
                        ["False", "False", "True", "?False"],
                        ["False", "True", "?False", "?False"],
                        ["True", "False", "?True", "?True"],
                        ["True", "True", "?False", "?False"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Ask `Soil moisture %: ` and then `Tank level %: `. The soil is dry below 30. The tank counts as empty at 10 or less. Use an **and** block (and a **not** block if you like) to say `Pump ON` only when the soil is dry and the tank is not empty. Otherwise say `Pump OFF`.",
                    toolbox: ["say", "logic", "variables"],
                    starter: workspace([setVar("iMoisture", askNumber("Soil moisture %: ")), setVar("iTank", askNumber("Tank level %: "))]),
                    solution: workspace([
                        setVar("iMoisture", askNumber("Soil moisture %: ")),
                        setVar("iTank", askNumber("Tank level %: ")),
                        whenElse(both(compare(getVar("iMoisture"), "LT", 30), "AND", not(compare(getVar("iTank"), "LTE", 10))), [say("Pump ON")], [say("Pump OFF")]),
                    ]),
                    tests: [
                        { name: "Dry soil, full tank", stdin: "20\n80" },
                        { name: "Dry soil, empty tank", stdin: "20\n5", hidden: true },
                        { name: "Wet soil, full tank", stdin: "50\n80", hidden: true },
                        { name: "Dry soil, tank at 11%", stdin: "29\n11", hidden: true },
                        { name: "Dry soil, tank at exactly 10%", stdin: "29\n10", hidden: true },
                    ],
                },
                {
                    t: "quiz",
                    pass: 67,
                    questions: [
                        { q: "A greenhouse fan turns on when it is hot OR the air is very humid. It is hot and not humid. Is the fan on?", options: ["Yes", "No"], answer: 0 },
                        { q: "What is NOT (True AND False)?", options: ["True", "False"], answer: 0 },
                        { q: "Load-shedding! The pump should only run when the soil is dry AND there is power. Which rule is right?", options: ["Dry OR Power", "Dry AND Power", "Dry AND NOT Power"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "A loop inside a loop",
            blocks: [
                "A **nested loop** is a loop inside another loop. Each time the **outer** loop goes round once, the **inner** loop runs **all the way through**. An outer loop of 3 with an inner loop of 3 runs the inside blocks 3 × 3 = 9 times.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "See it first. The inner loop draws a square. The outer loop turns a little and draws the next one. Run it, then change 12 and 30 (keep 12 × 30 = 360) and see what happens.",
                    toolbox: ["draw", "loops"],
                    starter: workspace([colour("purple"), repeat(12, [repeat(4, [forward(80), right(90)]), right(30)])]),
                },
                { t: "h2", text: "A times-table grid" },
                "This program uses two loops. The outer loop counts the rows with `iRow`. The inner loop counts the columns with `iCol`. Trace it by hand before you build it.",
                {
                    t: "fillTable",
                    prompt: "Trace the first passes of the nested loop: rows from 1, columns from 1 to 3.",
                    headers: ["Pass", "iRow", "iCol", "iRow × iCol"],
                    rows: [
                        ["1", "1", "1", "1"],
                        ["2", "1", "2", "?2"],
                        ["3", "1", "3", "?3"],
                        ["4", "?2", "?1", "?2"],
                        ["5", "?2", "?2", "?4"],
                        ["6", "?2", "?3", "?6"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "The outer loop is done for you. Inside it, add an inner **count with iCol from 1 to 3** loop that says `1 x 1 = 1`, `1 x 2 = 2` and so on: iRow, then ` x `, then iCol, then ` = `, then the answer. Take out the `Row` block when your inner loop works.",
                    toolbox: ["say", "loops", "math", "variables"],
                    starter: workspace([setVar("iRows", askNumber("How many rows? ")), forLoop("iRow", 1, getVar("iRows"), [say(join("Row ", getVar("iRow")))])]),
                    solution: workspace([
                        setVar("iRows", askNumber("How many rows? ")),
                        forLoop("iRow", 1, getVar("iRows"), [forLoop("iCol", 1, 3, [say(join(getVar("iRow"), " x ", getVar("iCol"), " = ", maths(getVar("iRow"), "MULTIPLY", getVar("iCol"))))])]),
                    ]),
                    tests: [
                        { name: "3 rows", stdin: "3" },
                        { name: "1 row", stdin: "1", hidden: true },
                        { name: "5 rows", stdin: "5", hidden: true },
                    ],
                },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "An outer loop repeats 4 times and the inner loop repeats 5 times. How many times do the blocks inside the inner loop run?", options: ["9", "20", "45"], answer: 1 },
                        { q: "In your times-table program, which variable changes fastest?", options: ["iRow, the outer loop", "iCol, the inner loop", "Both change at the same speed"], answer: 1 },
                    ],
                },
                { t: "callout", variant: "success", text: "You can now ask for input, keep lists, combine conditions and nest loops. That is everything a smart plant-watering system needs." },
            ],
        },
    ],
};
