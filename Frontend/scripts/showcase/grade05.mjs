// Grade 5, Coding and Robotics (CAPS Intermediate Phase): block-based decisions. if…else on the
// answer, relational operators (=, <, >), the forever loop with one nested conditional, and the
// micro:bit's onboard parts in the MakeCode simulator. No variables yet: they start in Grade 6,
// so programs use the answer from "ask" directly.

import { workspace, say, askNumber, forever, stopLoop, whenElse, compare } from "../../src/components/editor/runtime/blockJson.js";

export default {
    code: "CR-G05",
    name: "Coding and Robotics: Grade 5",
    description: "Decisions, forever loops and the micro:bit's lights and sensors.",
    module: "Decisions and forever loops",

    home: [
        { t: "h1", text: "Welcome to Grade 5 coding! 🤖" },
        "This term your programs learn to **make decisions**. They ask a question, look at the answer and choose what to do. Then we make them **repeat forever**, the way a real robot does.",
        { t: "callout", variant: "success", text: "Open **Modules** to start. Each page has a short explanation, then activities you can try as often as you like." },
        { t: "h2", text: "What you will learn" },
        {
            t: "columns",
            layout: "equal",
            cols: [
                [{ t: "h3", text: "Coding" }, { t: "bullets", items: ["**if… else**: choose between two things", "**=, < and >**: compare two numbers", "The **forever** loop, and how to stop it"] }],
                [{ t: "h3", text: "Robotics" }, { t: "bullets", items: ["The **micro:bit** and its 5 × 5 LED display", "Buttons A and B, shake, temperature and light", "Testing ideas in the MakeCode simulator"] }],
            ],
        },
        { t: "callout", variant: "info", text: "We code with **blocks**, like in Scratch. Snap them together, then press **Run**." },
    ],

    pages: [
        {
            title: "If… else",
            blocks: [
                { t: "hero", title: "Programs that decide", subtitle: "If this is true, do one thing. Else, do another.", emoji: "🔀", theme: "ocean" },
                "Every day you make decisions: *if* it is raining, take an umbrella, *else* wear a cap. A program can do the same with an **if… else** block.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "if" }, "A **condition**: a question with a true or false answer. *Is the temperature more than 25?*"],
                        [{ t: "h3", text: "do / else" }, "The **do** part runs when the condition is true. The **else** part runs when it is false. Only one of them ever runs."],
                    ],
                },
                { t: "diagram", code: "flowchart TD\n  A([Ask: what is the temperature?]) --> B{Is the answer more than 25?}\n  B -- true --> C[Say: It is hot. Drink water!]\n  B -- false --> D[Say: It is not too hot today.]", caption: "One question, two possible paths." },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "The if… else block already asks for the temperature and checks if it is more than 25. Fill in both parts:\n\n- do: say \"It is hot. Drink water!\"\n- else: say \"It is not too hot today.\"\n\nRun it and type 30. Run it again and type 18.",
                    toolbox: ["say", "logic", "math"],
                    starter: workspace([whenElse(compare(askNumber("What is the temperature today? "), "GT", 25), [], [])]),
                    solution: workspace([whenElse(compare(askNumber("What is the temperature today? "), "GT", 25), [say("It is hot. Drink water!")], [say("It is not too hot today.")])]),
                    tests: [
                        { name: "A hot day: 30 degrees", stdin: "30" },
                        { name: "A cool day", stdin: "18", hidden: true },
                    ],
                },
                { t: "reveal", title: "What if I type 25?", text: "25 is **not** more than 25, so the condition is false and the **else** part runs. Try it!" },
                { t: "callout", variant: "info", text: "The micro:bit has a **temperature sensor** inside it. A real program could use the temperature it measures instead of asking you." },
            ],
        },
        {
            title: "Bigger, smaller, equal",
            blocks: [
                { t: "hero", title: "Compare like a computer", subtitle: "Is it bigger, smaller or the same?", emoji: "⚖️", theme: "sunset" },
                "Conditions use **relational operators** to compare two numbers. The answer is always **true** or **false**.",
                {
                    t: "table",
                    header: ["Operator", "Means", "Example", "Answer"],
                    rows: [
                        ["=", "is equal to", "5 = 5", "true"],
                        ["<", "is less than", "3 < 8", "true"],
                        [">", "is greater than", "2 > 9", "false"],
                    ],
                },
                { t: "callout", variant: "info", text: "A trick: the open side of **<** and **>** always faces the bigger number, like a hungry crocodile. 🐊" },
                {
                    t: "sort",
                    prompt: "Is each statement true or false? Drag it to the right group.",
                    groups: {
                        "True": ["7 > 3", "2 < 9", "6 = 6", "10 > 1"],
                        "False": ["4 = 5", "8 < 2", "3 > 3", "1 > 10"],
                    },
                },
                {
                    t: "fillTable",
                    prompt: "Type true or false for each one.",
                    headers: ["Expression", "True or false?"],
                    rows: [
                        ["12 > 20", "?false"],
                        ["15 = 15", "?true"],
                        ["0 < 1", "?true"],
                        ["9 < 9", "?false"],
                        ["30 > 25", "?true"],
                    ],
                },
                {
                    t: "blanks",
                    prompt: "Drag the right operator into each gap.",
                    text: "Sipho is 11 and Naledi is 10, so 11 {{>}} 10. A spider has 8 legs and an ant has 6, so 6 {{<}} 8. Every week has 7 days, so the days in this week {{=}} the days in next week. A minibus taxi seats 16 people and a car seats 5, so 16 {{>}} 5.",
                    bank: true,
                },
                { t: "reveal", title: "Why is 3 > 3 false?", text: "3 is not *greater* than 3. It is **equal** to 3. So 3 > 3 is false, but 3 = 3 is true." },
            ],
        },
        {
            title: "Forever loops",
            blocks: [
                { t: "hero", title: "Again and again and again", subtitle: "The forever loop never gets tired.", emoji: "🔁", theme: "forest" },
                "A **forever loop** repeats the blocks inside it again and again. A micro:bit program usually runs inside a forever loop, so it can keep checking its buttons and sensors.",
                "Put an **if… else** inside a forever loop and you get a quiz that keeps asking until you get it right. To leave the loop, use the **break out of loop** block.",
                { t: "diagram", code: "flowchart TD\n  A[Ask: what is 7 x 8?] --> B{Is the answer = 56?}\n  B -- true --> C[Say: Well done!] --> D([Break out of the loop])\n  B -- false --> E[Say: Try again.] --> A", caption: "A forever loop with one decision inside." },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "This quiz never says \"Try again.\" and never stops. Fix it:\n\n- In the else part, say \"Try again.\"\n- In the do part, after \"Well done!\", add break out of loop (it is in Repeat).\n\nTo test it, type a wrong answer on the first line of the Input box and 56 on the next line.",
                    toolbox: ["say", "loops", "logic", "math"],
                    starter: workspace([forever([whenElse(compare(askNumber("What is 7 x 8? "), "EQ", 56), [say("Well done!")], [])])]),
                    solution: workspace([forever([whenElse(compare(askNumber("What is 7 x 8? "), "EQ", 56), [say("Well done!"), stopLoop()], [say("Try again.")])])]),
                    tests: [
                        { name: "One wrong guess, then 56", stdin: "54\n56" },
                        { name: "Right the first time", stdin: "56", hidden: true },
                        { name: "Three wrong guesses, then 56", stdin: "48\n63\n58\n56", hidden: true },
                    ],
                },
                {
                    t: "reveal",
                    title: "What happens without the break?",
                    text: "After *Well done!* the loop goes back to the top and asks the question **again**, forever. Here the program stops only because there are no more answers in the Input box. On a micro:bit, a forever loop really does run until you unplug it, which is exactly what a robot that keeps watching its sensors needs.",
                },
                { t: "callout", variant: "info", text: "In Scratch you can use **two sprites**: one asks the question, and the other one cheers when the answer is right." },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "How many times does a forever loop repeat?", options: ["Once", "Ten times", "Again and again, until something stops it"], answer: 2 },
                        { q: "In our quiz, which part runs when the answer is wrong?", options: ["The do part", "The else part", "Both parts"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "micro:bit lights",
            blocks: [
                { t: "hero", title: "Meet the micro:bit", subtitle: "A tiny computer with lights, buttons and sensors.", emoji: "💡", theme: "night" },
                "The **micro:bit** is a small computer you can hold in your hand. On the front is a **display** of 25 red lights (LEDs) in 5 rows and 5 columns. In the free [MakeCode editor](https://makecode.microbit.org), the **show leds** block lets you choose which lights are on, and the simulator shows the result.",
                {
                    t: "flashcards",
                    title: "Parts of the micro:bit",
                    cards: [
                        ["LED display", "25 lights in a 5 × 5 grid. It shows pictures, numbers and scrolling words."],
                        ["Button A and button B", "Two buttons on the front. A program can do something when you press one of them, or both."],
                        ["Accelerometer", "Feels movement. It knows when you shake or tilt the micro:bit."],
                        ["Temperature sensor", "Measures how warm it is, in degrees Celsius."],
                        ["Light sensor", "The LEDs can also measure how bright it is around the micro:bit."],
                        ["USB socket", "Connects the micro:bit to a computer, to give it power and copy a program onto it."],
                    ],
                },
                { t: "h2", text: "Draw on the display" },
                {
                    t: "columns",
                    layout: "wide-right",
                    cols: [
                        [{ t: "code", code: ". # . # .\n# # # # #\n# # # # #\n. # # # .\n. . # . ." }, "**#** is a light that is on."],
                        [{ t: "squares", prompt: "Light up the heart. Copy the picture row by row: 16 lights.", rows: 5, cols: 5, correct: [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 22] }],
                    ],
                },
                {
                    t: "columns",
                    layout: "wide-right",
                    cols: [
                        [{ t: "code", code: ". . . . .\n. # . # .\n. . . . .\n# . . . #\n. # # # ." }, "Two eyes, then a smile."],
                        [{ t: "squares", prompt: "Now the happy face: 7 lights.", rows: 5, cols: 5, correct: [6, 8, 15, 19, 21, 22, 23] }],
                    ],
                },
                { t: "callout", variant: "success", text: "In MakeCode, try this: **on button A pressed**, show the heart. **On button B pressed**, show the happy face. **On shake**, clear the screen." },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "How many LEDs are on the micro:bit display?", options: ["10", "25", "16"], answer: 1 },
                        { q: "Which part notices when you shake the micro:bit?", options: ["The accelerometer", "Button B", "The USB socket"], answer: 0 },
                        { q: "A program shows a sun when it is warm. Which sensor does it need?", options: ["The light sensor", "The temperature sensor", "Button A"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Fix it",
            blocks: [
                { t: "hero", title: "Bug hunt", subtitle: "Lerato's quiz does the opposite of what she wants.", emoji: "🐞", theme: "purple" },
                "Lerato wrote a quiz. When you get it **right**, it keeps asking. When you get it **wrong**, it stops. Some blocks are in the wrong place!",
                { t: "steps", items: ["Run the program and type 54, the right answer. What happens?", "Read the blocks. Which part runs when the answer is right?", "Move the blocks so that a right answer says `Well done!` and stops, and a wrong answer says `Try again.` and asks again."] },
                {
                    t: "codelab",
                    language: "blocks",
                    prompt: "Fix Lerato's quiz. Right answer: say \"Well done!\" and break out of the loop. Wrong answer: say \"Try again.\"",
                    toolbox: ["say", "loops", "logic", "math"],
                    starter: workspace([forever([whenElse(compare(askNumber("What is 9 x 6? "), "EQ", 54), [say("Try again.")], [say("Well done!"), stopLoop()])])]),
                    solution: workspace([forever([whenElse(compare(askNumber("What is 9 x 6? "), "EQ", 54), [say("Well done!"), stopLoop()], [say("Try again.")])])]),
                    tests: [
                        { name: "Right the first time", stdin: "54" },
                        { name: "Two wrong answers, then 54", stdin: "45\n56\n54", hidden: true },
                    ],
                },
                { t: "reveal", title: "Hint", text: "The **do** part runs when the answer is right. Swap what is in **do** with what is in **else**." },
                { t: "callout", variant: "warning", text: "Finding and fixing a mistake is called **debugging**. Every programmer does it, every day." },
                { t: "callout", variant: "success", text: "You can make a program decide, compare numbers, loop forever and stop when you need to. Well done! 🏆" },
            ],
        },
    ],
};
