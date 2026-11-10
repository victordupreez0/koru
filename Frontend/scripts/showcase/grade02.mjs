// Grade 2, Coding and Robotics (CAPS Foundation Phase): turning on the spot, loops that make
// code shorter, a first IF decision and a shape cipher. Seven-year-olds read a little: short
// sentences, emoji, and activities they do by tapping.

export default {
    code: "CR-G02",
    name: "Coding and Robotics: Grade 2",
    description: "Turns, loops, IF decisions and secret codes for Grade 2 coders.",
    module: "Turns, loops and secret codes",

    home: [
        { t: "h1", text: "Welcome back, coders! 🤖" },
        "In Grade 1 you used arrows. Now the robot learns new tricks.",
        { t: "callout", variant: "success", text: "Open **Modules** to start. Read the words with a friend or a grown-up." },
        { t: "h2", text: "What we will do" },
        { t: "bullets", items: ["Turn left and turn right 🔄", "Make code shorter with a loop 🔁", "Make a decision with IF 🤔", "Send a message in secret code 🤫"] },
    ],

    pages: [
        {
            title: "Turn left, turn right",
            blocks: [
                { t: "hero", title: "Turn on the spot! 🔄", subtitle: "The robot can turn. Then it moves forward.", emoji: "🤖", theme: "ocean" },
                "The robot **turns on the spot**. It does not move to a new square. Then **forward** moves it one step the way it faces.",
                {
                    t: "flashcards",
                    title: "Three robot words",
                    cards: [["⬆️ Forward", "Move one step the way you face."], ["↩️ Turn left", "Turn to your left. Stay on your square."], ["↪️ Turn right", "Turn to your right. Stay on your square."]],
                },
                { t: "callout", variant: "info", text: "Stand up! Turn right. Now take one step forward. You are a robot! 🤖" },
                { t: "h2", text: "Your turn" },
                {
                    t: "robot",
                    prompt: "The taxi faces right ➡️. Drive it to the taxi rank. 🚕",
                    theme: "taxi",
                    mode: "turns",
                    facing: "right",
                    map: [
                        "S..",
                        "#.T",
                    ],
                    solution: "forward 2\nturn right\nforward",
                },
                {
                    t: "robot",
                    prompt: "The robot faces up ⬆️. Get the star ⭐ and go to the charger. You need a turn left and a turn right.",
                    theme: "robot",
                    mode: "turns",
                    facing: "up",
                    map: [
                        "T#.",
                        ".*.",
                        "#.S",
                    ],
                    solution: "forward\nturn left\nforward 2\nturn right\nforward",
                },
                {
                    t: "quiz",
                    pass: 60,
                    questions: [
                        { q: "The robot faces up ⬆️. It turns right. Which way does it face now?", options: ["Up ⬆️", "Right ➡️", "Left ⬅️"], answer: 1 },
                        { q: "When the robot turns, does it move to a new square?", options: ["Yes, one step", "No, it turns on the spot"], answer: 1 },
                        { q: "Which word moves the robot to a new square?", options: ["Turn left", "Forward", "Turn right"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Loops make code shorter",
            blocks: [
                "Look at this staircase code. Up, right. Up, right. Up, right. The same two steps again and again! 🪜",
                {
                    t: "columns",
                    layout: "equal",
                    cols: [
                        [{ t: "h3", text: "Long code 😩" }, { t: "steps", items: ["⬆️ up", "➡️ right", "⬆️ up", "➡️ right", "⬆️ up", "➡️ right"] }],
                        [{ t: "h3", text: "Short code 😎" }, { t: "bullets", items: ["🔁 **repeat 3**", "⬆️ up", "➡️ right", "**end**"] }],
                    ],
                },
                { t: "callout", variant: "success", text: "A **loop** repeats steps. Loops make code **shorter**." },
                {
                    t: "robot",
                    prompt: "Climb the stairs to the top! Use 3 blocks or fewer, so you need a repeat 🔁.",
                    theme: "robot",
                    mode: "blocks",
                    map: [
                        "##.T",
                        "#.*#",
                        ".*#.",
                        "S#..",
                    ],
                    maxBlocks: 3,
                    solution: "repeat 3\n  move up 1\n  move right 1\nend",
                },
                { t: "pattern", prompt: "This is the staircase code. Finish the pattern.", tokens: ["arrow-up:blue", "arrow-right:orange", "arrow-up:blue", "arrow-right:orange", "arrow-up:blue", "arrow-right:orange", "arrow-up:blue", "arrow-right:orange"], blanks: [5, 6, 7], distractors: ["arrow-down:blue", "arrow-left:orange"] },
                {
                    t: "blanks",
                    prompt: "Tap a word to fill each gap.",
                    text: "A {{loop}} repeats steps. A loop makes code {{shorter}}. To go up and right 3 times, we {{repeat}} 3 times.",
                    bank: true,
                    distractors: ["longer", "bug"],
                },
                { t: "callout", variant: "info", text: "Find a loop at home. Skipping is a loop: jump, jump, jump! 🪢" },
            ],
        },
        {
            title: "IF: a decision",
            blocks: [
                "Sometimes we must **decide**. We check something first. **IF** it is true, **THEN** we do it.",
                { t: "quote", text: "IF it rains ☔, THEN I take an umbrella." },
                {
                    t: "sort",
                    prompt: "What do you do? Put each one in the right group.",
                    groups: {
                        "IF it rains 🌧️": ["Take an umbrella ☂️", "Put on a raincoat 🧥", "Wear gumboots 🥾"],
                        "IF it is sunny ☀️": ["Put on a hat 👒", "Wear sunscreen 🧴", "Wear sunglasses 😎"],
                    },
                },
                { t: "callout", variant: "info", text: "Fun fact: in South Africa we call a traffic light a **robot**! 🚦" },
                {
                    t: "blanks",
                    prompt: "Finish the IF sentences.",
                    text: "IF the robot is {{red}} 🔴, THEN the taxi {{stops}}. IF the robot is {{green}} 🟢, THEN the taxi {{goes}}.",
                    bank: true,
                    distractors: ["blue", "jumps"],
                },
                {
                    t: "robot",
                    prompt: "IF the robot sees a wall 🧱, THEN it turns. Get the star ⭐ and go to the charger 🔋.",
                    theme: "robot",
                    mode: "turns",
                    facing: "right",
                    map: [
                        "S..#",
                        "##*#",
                        "#..T",
                    ],
                    solution: "forward 2\nturn right\nforward 2\nturn left\nforward",
                },
                {
                    t: "quiz",
                    pass: 50,
                    questions: [
                        { q: "IF it is cold 🥶, THEN…", options: ["wear a jersey 🧶", "eat an ice cream 🍦", "go swimming 🏊"], answer: 0 },
                        { q: "The robot 🚦 is red. What does the taxi do?", options: ["It goes", "It stops", "It turns around"], answer: 1 },
                    ],
                },
            ],
        },
        {
            title: "Secret codes",
            blocks: [
                { t: "hero", title: "Shh! A secret code 🤫", subtitle: "Shapes can stand for letters.", emoji: "🕵️", theme: "night" },
                "A **cipher** is a secret code. Each shape stands for a letter. Only friends with the **key** can read it.",
                {
                    t: "table",
                    header: ["Shape", "Letter"],
                    rows: [["⭐", "A"], ["🍎", "C"], ["🔵", "H"], ["🔺", "I"], ["🟩", "N"], ["🌙", "S"], ["🟣", "T"], ["🔶", "U"]],
                },
                {
                    t: "fillTable",
                    prompt: "Use the key. What does each code say? Type the word.",
                    headers: ["Secret code", "Word"],
                    rows: [["🔵 🔺", "?HI"], ["🍎 ⭐ 🟣", "?CAT"], ["🌙 🔶 🟩", "?SUN"]],
                },
                {
                    t: "blanks",
                    prompt: "Now write **HAT** in secret code. Tap the shapes.",
                    text: "H = {{🔵}}   A = {{⭐}}   T = {{🟣}}",
                    bank: true,
                    distractors: ["🌙", "🔺"],
                },
                { t: "pattern", prompt: "Lerato sends HI again and again: 🔵 🔺 🔵 🔺. Finish her code.", tokens: ["=🔵", "=🔺", "=🔵", "=🔺", "=🔵", "=🔺", "=🔵", "=🔺"], blanks: [5, 6, 7], distractors: ["=⭐"] },
                { t: "callout", variant: "info", text: "Your turn! ✏️ Use the key to write a word in secret code. Give it to a friend. Can they read it?" },
                { t: "callout", variant: "success", text: "You can turn, loop, decide and send secret codes. Super coder! 🏆" },
            ],
        },
    ],
};
