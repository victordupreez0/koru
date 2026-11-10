// Grade 3, Coding and Robotics (CAPS Foundation Phase): the code words Fwd, TL and TR, loops
// with turns, a loop and an IF working together, number patterns and debugging. Eight-year-olds
// read short sentences, so: plain words, a picture or emoji where it helps, lots of doing.

export default {
    code: "CR-G03",
    name: "Coding and Robotics: Grade 3",
    description: "Code words, loops with turns, IF decisions and debugging for Grade 3.",
    module: "Code words: Fwd, TL, TR",

    home: [
        { t: "h1", text: "Hello, Grade 3 coders! 🚀" },
        "This term we write code with **short code words**, put **loops** and **IF** together, and hunt for **bugs**.",
        { t: "callout", variant: "success", text: "Open **Modules** and start with page 1. Each page has puzzles to solve." },
        { t: "h2", text: "What we will do" },
        { t: "bullets", items: ["Write code with Fwd, TL and TR", "Walk round a square with one loop", "Use a loop and an IF together", "Spot number patterns and fix buggy code"] },
    ],

    pages: [
        {
            title: "Short code words",
            blocks: [
                { t: "hero", title: "Code words 🔤", subtitle: "Coders write short words instead of long sentences.", emoji: "🤖", theme: "purple" },
                "Writing *turn left* again and again takes a long time. Coders write **TL** instead. It is shorter and faster.",
                {
                    t: "table",
                    header: ["Code word", "What the robot does"],
                    rows: [["Fwd", "Moves forward one square, the way it faces"], ["Fwd 2", "Moves forward two squares"], ["TL", "Turns left on the spot"], ["TR", "Turns right on the spot"]],
                },
                {
                    t: "flashcards",
                    title: "Words to know",
                    cards: [
                        ["Fwd", "Forward. Move the way you are facing."],
                        ["TL", "Turn left. Turn on the spot, do not move."],
                        ["TR", "Turn right. Turn on the spot, do not move."],
                        ["Loop", "Steps that repeat. It makes code shorter."],
                        ["IF", "A decision. IF something is true, THEN do it."],
                        ["Debug", "Find the mistake (the bug) in code and fix it."],
                    ],
                },
                { t: "callout", variant: "info", text: "In the robot puzzles you can press **Code** and type the code words: `fwd 2`, `tl`, `tr`." },
                {
                    t: "robot",
                    prompt: "The rocket faces up ⬆️. Collect the star and land on the planet. Try: `fwd 3`, `tr`, then…?",
                    theme: "rocket",
                    mode: "turns",
                    facing: "up",
                    map: [
                        "..*T",
                        ".#..",
                        ".#..",
                        "S...",
                    ],
                    solution: "fwd 3\ntr\nfwd 3",
                },
                {
                    t: "robot",
                    prompt: "The robot faces right ➡️. Find the way past the walls to the charger. You need TL and TR.",
                    theme: "robot",
                    mode: "turns",
                    facing: "right",
                    map: [
                        "##..T",
                        "##*..",
                        "##.##",
                        "S..##",
                    ],
                    solution: "fwd 2\ntl\nfwd 2\ntr\nfwd 2\ntl\nfwd",
                },
            ],
        },
        {
            title: "Loops with turns",
            blocks: [
                "Walk round a square: **Fwd 2, TR** four times. The same two code words, again and again. A **loop** says them once.",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Without a loop" }, { t: "steps", items: ["Fwd 2", "TR", "Fwd 2", "TR", "Fwd 2", "TR", "Fwd 2", "TR"] }],
                        [{ t: "h3", text: "With a loop 🔁" }, { t: "bullets", items: ["**repeat 4**", "Fwd 2", "TR", "**end**"] }, { t: "callout", variant: "success", text: "8 lines became 4!" }],
                    ],
                },
                {
                    t: "robot",
                    prompt: "Walk all the way round the pond 🐸 and collect every star. Then go up to the flag. Use 5 blocks or fewer: `repeat 4` … `end` counts as one block, plus what is inside.",
                    theme: "robot",
                    mode: "turns",
                    facing: "right",
                    map: [
                        "T..",
                        "S.*",
                        ".#.",
                        "*.*",
                    ],
                    maxBlocks: 5,
                    solution: "repeat 4\n  fwd 2\n  tr\nend\ntl\nfwd",
                },
                { t: "reveal", title: "Challenge: can you do it in 4 blocks?", text: "Repeat only **3** times. The robot is then at the bottom-left corner, facing up. Now `fwd 3` takes it straight to the flag." },
                {
                    t: "order",
                    prompt: "Sipho's robot drives 2 squares to the garden. Then it goes round the garden: forward 1, then turn right, 4 times. Put his code in order.",
                    items: ["Fwd 2", "repeat 4", "Fwd 1", "TR", "end"],
                    code: true,
                },
                { t: "callout", variant: "info", text: "Loops and turns make shapes. **repeat 4: Fwd, TR** makes a square. 🟦" },
            ],
        },
        {
            title: "Loop + IF together",
            blocks: [
                "Now we join two ideas: a **loop** and an **IF**. Each time round the loop, the robot **checks** something and decides what to do.",
                { t: "quote", text: "REPEAT 4 times: Fwd 1. IF there is a star ⭐, THEN pick it up." },
                {
                    t: "diagram",
                    code: "flowchart TD\n  A([Start]) --> B[Fwd 1]\n  B --> C{Is there a star?}\n  C -- Yes --> D[Pick it up]\n  C -- No --> E{Done 4 times?}\n  D --> E\n  E -- No --> B\n  E -- Yes --> F([Stop])",
                    caption: "The loop goes round 4 times. The IF checks for a star every time.",
                },
                {
                    t: "blanks",
                    prompt: "Finish Naledi's instruction for the robot.",
                    text: "{{REPEAT}} 4 times: Fwd 1. {{IF}} there is a star, {{THEN}} pick it up.",
                    bank: true,
                    distractors: ["TL", "STOP"],
                },
                {
                    t: "fillTable",
                    prompt: "Trace the code above. The squares in front of the robot are: ⭐, empty, ⭐, ⭐. Fill in the table.",
                    headers: ["Round", "Steps so far", "Star here?", "Stars picked up"],
                    rows: [["1", "1", "yes ⭐", "1"], ["2", "?2", "no", "?1"], ["3", "?3", "yes ⭐", "?2"], ["4", "?4", "yes ⭐", "?3"]],
                },
                {
                    t: "sort",
                    prompt: "Is it a sequence, a loop or a decision? Sort them.",
                    groups: {
                        "Sequence (steps in order)": ["Put on your socks, then your shoes", "Wake up, then brush your teeth"],
                        "Loop (repeat)": ["Clap your hands 5 times", "Run round the field 3 times"],
                        "Decision (IF)": ["IF it rains, take an umbrella", "IF the robot 🚦 is red, stop"],
                    },
                },
            ],
        },
        {
            title: "Number patterns and bugs",
            blocks: [
                "A loop that moves **Fwd 2** every round makes a **number pattern**: after round 1 the robot has moved 2 squares, then 4, then 6…",
                { t: "pattern", prompt: "Steps so far with Fwd 2 in a loop. Fill in the missing numbers.", tokens: ["=2", "=4", "=6", "=8", "=10", "=12", "=14", "=16"], blanks: [4, 6, 7], distractors: ["=9", "=15"] },
                { t: "pattern", prompt: "Pieter saves a R5 coin every day. Count his rands.", tokens: ["=5", "=10", "=15", "=20", "=25", "=30"], blanks: [2, 5], distractors: ["=12", "=21"] },
                { t: "callout", variant: "warning", text: "A **bug** is a mistake in code. To **debug**: run the code, watch where it goes wrong, and fix that line. 🐞" },
                {
                    t: "robot",
                    prompt: "The dog should get the bone and go home 🏠, but it walks off the grid! Run the code. Find the bug and fix it.",
                    theme: "dog",
                    mode: "turns",
                    facing: "up",
                    map: [
                        "*..T",
                        ".##.",
                        ".#..",
                        "S...",
                    ],
                    starter: "fwd 3\ntl\nfwd 3",
                    solution: "fwd 3\ntr\nfwd 3",
                },
                {
                    t: "robot",
                    prompt: "The dog climbs the stairs but stops too soon. Fix the bug. Keep the loop!",
                    theme: "dog",
                    mode: "turns",
                    facing: "up",
                    map: [
                        "##.T",
                        "#..#",
                        "..#.",
                        "S#..",
                    ],
                    maxBlocks: 5,
                    starter: "repeat 2\n  fwd\n  tr\n  fwd\n  tl\nend",
                    solution: "repeat 3\n  fwd\n  tr\n  fwd\n  tl\nend",
                },
                {
                    t: "quiz",
                    pass: 75,
                    questions: [
                        { q: "What does TL mean?", options: ["Turn left", "Take a look", "Turn loop"], answer: 0 },
                        { q: "repeat 4: Fwd 3. How many squares does the robot move?", options: ["7", "12", "4"], answer: 1 },
                        { q: "The robot turns the wrong way because of a mistake in the code. What is the mistake called?", options: ["A loop", "A bug", "A pattern"], answer: 1 },
                        { q: "What comes next? 3, 6, 9, 12, …", options: ["13", "15", "14"], answer: 1 },
                    ],
                },
                { t: "callout", variant: "success", text: "You can write code words, loop, decide and debug. Well done, coder! 🏆" },
            ],
        },
    ],
};
