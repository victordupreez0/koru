// Grade 7, Coding and Robotics (CAPS Senior Phase): lists (given in a partial solution), looping
// through a list, a random item from a list, and a fixed-counter outer loop with nested simple
// conditions. Programs use three to four variables, still named with type prefixes.

import { workspace, say, askNumber, join, length, repeat, forLoop, forEach, when, compare, maths, randomInt, setVar, getVar, changeVar, list, listLength, listGet, forward, right } from "../../src/components/editor/runtime/blockJson.js";

const FRUITS = () => list("mango", "banana", "litchi", "guava", "apple");
const NAMES = () => list("Thabo", "Mpho", "Lerato", "Zola", "Ayanda", "Ben");

export default {
    code: "CR-G07",
    name: "Coding and Robotics: Grade 7",
    description: "Lists, random picks and loops inside loops.",
    module: "Lists and nested loops",

    home: [
        { t: "h1", text: "Welcome to Grade 7 coding! 📋" },
        "One variable holds one value. This term you meet the **list**: one name for a whole collection of values, such as every learner in a group. Then you put loops **inside** loops to draw patterns and build tables.",
        { t: "callout", variant: "success", text: "Open **Modules** to start. Each page explains an idea, then gives you programs to build and check." },
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "You will" }, { t: "bullets", items: ["Make and read lists", "Loop through every item in a list", "Pick a random item", "Nest one loop inside another"] }],
                [{ t: "h3", text: "Good habits" }, { t: "bullets", items: ["Name variables with a prefix: `iCount`, `tName`", "Use three or four variables, no more", "Trace your program before you run it"] }],
            ],
        },
        { t: "callout", variant: "info", text: "In Scratch you can now use **up to three sprites**, each with its own script, all sharing one list." },
    ],

    pages: [
        {
            title: "What is a list?",
            blocks: [
                { t: "hero", title: "Many values, one name", subtitle: "A list keeps things in order.", emoji: "📋", theme: "ocean" },
                "A **list** is a variable that holds many values in order. Each value is an **item**, and each item has a **position**: 1 for the first, 2 for the second, and so on.",
                {
                    t: "flashcards",
                    title: "Words to know",
                    cards: [
                        ["List", "One variable that holds many values, in order."],
                        ["Item", "One value in a list, such as \"mango\"."],
                        ["Position", "Where an item is in the list. In our blocks the first item is at position 1."],
                        ["Length", "How many items the list has."],
                        ["Partial solution", "A program that is already started for you. You finish it."],
                    ],
                },
                {
                    t: "fillTable",
                    prompt: "tFruits is the list mango, banana, litchi, guava, apple. Which item is at each position?",
                    headers: ["Position", "Item"],
                    rows: [
                        ["1", "mango"],
                        ["2", "?banana"],
                        ["4", "?guava"],
                        ["5", "?apple"],
                    ],
                },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "The list tFruits is made for you, and the program already says item 1. Add two say blocks:\n\n1. Say the length of tFruits.\n2. Say the last item. Do not type 5: use the \"in list … get #\" block with \"length of tFruits\" as the position, so it still works when someone adds a fruit.",
                    toolbox: ["say", "lists", "variables", "math"],
                    starter: workspace([setVar("tFruits", FRUITS()), say(listGet(getVar("tFruits"), 1))]),
                    solution: workspace([setVar("tFruits", FRUITS()), say(listGet(getVar("tFruits"), 1)), say(listLength(getVar("tFruits"))), say(listGet(getVar("tFruits"), listLength(getVar("tFruits"))))]),
                    tests: [{ name: "First item, length and last item" }],
                },
                { t: "reveal", title: "Why not just type 5?", text: "Add \"pawpaw\" to the list and run it again. Position 5 is still apple, but the last item is now pawpaw. Using the length always finds the end of the list." },
            ],
        },
        {
            title: "Loop through a list",
            blocks: [
                { t: "hero", title: "One by one", subtitle: "Visit every item in a list.", emoji: "🔄", theme: "forest" },
                "The **for each item in list** block runs its blocks once for every item. Each time round, its variable holds the next item: first Thabo, then Mpho, and so on to the end.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Greet the whole group. Use for each item tName in list tNames, and inside it say join \"Good morning, \" and tName.",
                    toolbox: ["say", "loops", "lists", "variables", "text"],
                    starter: workspace([setVar("tNames", NAMES())]),
                    solution: workspace([setVar("tNames", NAMES()), forEach("tName", getVar("tNames"), [say(join("Good morning, ", getVar("tName")))])]),
                    tests: [{ name: "Greets all six names" }],
                },
                { t: "h2", text: "A decision inside the loop" },
                "Put an **if** inside the loop to choose some items. The **length of** block (in **Words**) counts the letters in a piece of text: the length of \"Zola\" is 4.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "The team needs names with more than 4 letters.\n\n1. set iCount to 0.\n2. For each tName in tNames: if the length of tName > 4, say tName and change iCount by 1.\n3. After the loop, say join iCount and \" names have more than 4 letters.\"",
                    toolbox: ["say", "loops", "logic", "lists", "variables", "math", "text"],
                    starter: workspace([setVar("tNames", NAMES()), setVar("iCount", 0)]),
                    solution: workspace([
                        setVar("tNames", NAMES()),
                        setVar("iCount", 0),
                        forEach("tName", getVar("tNames"), [when(compare(length(getVar("tName")), "GT", 4), [say(getVar("tName")), changeVar("iCount", 1)])]),
                        say(join(getVar("iCount"), " names have more than 4 letters.")),
                    ]),
                    tests: [{ name: "The long names and how many" }],
                },
                {
                    t: "fillTable",
                    prompt: "Trace the program. Fill in the length of each name and iCount after that name.",
                    headers: ["tName", "Letters", "iCount"],
                    rows: [
                        ["Thabo", "?5", "?1"],
                        ["Mpho", "?4", "?1"],
                        ["Lerato", "?6", "?2"],
                        ["Zola", "?4", "?2"],
                        ["Ayanda", "?6", "?3"],
                        ["Ben", "?3", "?3"],
                    ],
                },
                { t: "callout", variant: "warning", text: "Mpho and Zola have **exactly** 4 letters. 4 > 4 is false, so they are not said. Use **≥** if 4 letters should count." },
            ],
        },
        {
            title: "A random pick",
            blocks: [
                { t: "hero", title: "Who goes first?", subtitle: "Let the computer choose fairly.", emoji: "🎲", theme: "sunset" },
                "A **random** number is one you cannot predict. **random integer from 1 to 4** gives 1, 2, 3 or 4, each just as likely. Use it as a position and you get a random item from a list.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Run this a few times. Who goes first? Then add a fifth player to tPlayers and run it again: because the top number is the length of the list, every player still has a chance.",
                    toolbox: ["say", "lists", "variables", "math", "text"],
                    starter: workspace([
                        setVar("tPlayers", list("Aisha", "Sipho", "Naledi", "Pieter")),
                        setVar("iPick", randomInt(1, listLength(getVar("tPlayers")))),
                        say(join(listGet(getVar("tPlayers"), getVar("iPick")), " goes first!")),
                    ]),
                },
                {
                    t: "fillTable",
                    prompt: "tPlayers is Aisha, Sipho, Naledi, Pieter. What does the program say for each iPick?",
                    headers: ["iPick", "The program says"],
                    rows: [
                        ["1", "Aisha goes first!"],
                        ["3", "?Naledi goes first!"],
                        ["4", "?Pieter goes first!"],
                    ],
                },
                {
                    t: "callout",
                    variant: "info",
                    text: "**Why isn't this activity marked?** To mark a program, the computer runs it and compares what it says with the right answer. A random pick can give a different, correct answer every time, so there is no single answer to compare with.",
                },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "tPlayers has 4 items. Which block picks a position that always exists?", options: ["random integer from 1 to 10", "random integer from 1 to length of tPlayers", "random integer from 0 to 4"], answer: 1 },
                        { q: "Where is randomness useful?", options: ["Rolling a dice in a game", "Adding up a till slip", "Showing the time"], answer: 0 },
                    ],
                },
            ],
        },
        {
            title: "Loops inside loops",
            blocks: [
                { t: "hero", title: "Nested loops", subtitle: "A loop that runs a whole loop each time round.", emoji: "🌸", theme: "purple" },
                "Put one loop inside another and the **inner** loop runs all the way through every time the **outer** loop goes round once. If the outer loop repeats 6 times and the inner loop 4 times, the inner blocks run 6 × 4 = 24 times.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "This draws one square. Make a flower: put the square inside a repeat 6 block, and after the square (still inside repeat 6) add turn right 60 degrees. Why 60? Six squares share a full turn: 360 ÷ 6.",
                    toolbox: ["draw", "loops", "math"],
                    starter: workspace([repeat(4, [forward(80), right(90)])]),
                },
                {
                    t: "fillTable",
                    prompt: "How many times do the inner blocks run?",
                    headers: ["Outer loop", "Inner loop", "Inner blocks run"],
                    rows: [
                        ["6", "4", "?24"],
                        ["3", "5", "?15"],
                        ["4", "4", "?16"],
                        ["10", "2", "?20"],
                    ],
                },
                { t: "h2", text: "A times table, row by row" },
                "A grid has **rows** and **columns**. The outer loop counts the rows, the inner loop counts the columns, and the program builds each row in a text variable `tLine` before it says it.",
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Finish the times table. The outer loop is done. Inside it, after tLine is set to empty text, add a count with iCol from 1 to iSize, with:\n\n1. if iCol > 1: set tLine to join tLine and a space\n2. set tLine to join tLine and a × block holding iRow and iCol\n\nIf you type 3 it should say:\n1 2 3\n2 4 6\n3 6 9",
                    toolbox: ["say", "loops", "logic", "variables", "math", "text"],
                    starter: workspace([setVar("iSize", askNumber("How big is the table? ")), forLoop("iRow", 1, getVar("iSize"), [setVar("tLine", ""), say(getVar("tLine"))])]),
                    solution: workspace([
                        setVar("iSize", askNumber("How big is the table? ")),
                        forLoop("iRow", 1, getVar("iSize"), [
                            setVar("tLine", ""),
                            forLoop("iCol", 1, getVar("iSize"), [
                                when(compare(getVar("iCol"), "GT", 1), [setVar("tLine", join(getVar("tLine"), " "))]),
                                setVar("tLine", join(getVar("tLine"), maths(getVar("iRow"), "MULTIPLY", getVar("iCol")))),
                            ]),
                            say(getVar("tLine")),
                        ]),
                    ]),
                    tests: [
                        { name: "A 3 by 3 table", stdin: "3" },
                        { name: "A 4 by 4 table", stdin: "4", hidden: true },
                        { name: "A 1 by 1 table", stdin: "1", hidden: true },
                    ],
                },
                { t: "reveal", title: "Why the if?", text: "Without it, every row would start with a space. The space goes *between* numbers, so it is added before every number except the first one in the row." },
            ],
        },
        {
            title: "Check yourself",
            blocks: [
                { t: "hero", title: "Show what you know", subtitle: "Lists and nested loops.", emoji: "🏁", theme: "night" },
                "Two last challenges. Take your time and trace each one in your head before you answer.",
                {
                    t: "order",
                    prompt: "Put the blocks of the flower program in order. The spaces at the start show which blocks are inside which loop.",
                    code: true,
                    items: ["repeat 6 times", "  repeat 4 times", "    move forward 80", "    turn right 90 degrees", "  turn right 60 degrees"],
                },
                {
                    t: "quiz",
                    pass: 60,
                    questions: [
                        { q: "tColours is red, green, blue. What is item 2?", options: ["red", "green", "blue"], answer: 1 },
                        { q: "What is the length of the list 4, 8, 15, 16, 23?", options: ["5", "23", "66"], answer: 0 },
                        { q: "An outer loop repeats 3 times and its inner loop repeats 5 times. How many times do the inner blocks run?", options: ["8", "15", "35"], answer: 1 },
                        { q: "In the flower program, which turn is in the outer loop only?", options: ["turn right 90 degrees", "turn right 60 degrees", "Both turns"], answer: 1 },
                        { q: "Which program can be marked automatically?", options: ["One that says a random player", "One that says the length of a list", "Neither of them"], answer: 1 },
                    ],
                },
                { t: "callout", variant: "success", text: "You can store a list, loop through it, pick from it at random and nest loops. That is everything this module set out to teach. 🏆" },
            ],
        },
    ],
};
