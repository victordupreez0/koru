// Grade 1, Coding and Robotics (CAPS Foundation Phase): arrows on a grid, patterns, routes
// around obstacles and finding a bug. Six-year-olds read very little, so: short sentences,
// pictures, and activities they can do by tapping.

export default {
    code: "CR-G01",
    name: "Coding and Robotics: Grade 1",
    description: "Arrow codes, patterns and routes for our youngest coders.",
    module: "Arrows and routes",

    home: [
        { t: "h1", text: "Hello, coders! 👋" },
        "This term we learn to give instructions with **arrows**, spot **patterns** and find **bugs**.",
        { t: "callout", variant: "success", text: "Open **Modules** to start. A grown-up can read the words with you." },
        { t: "h2", text: "What we will do" },
        { t: "bullets", items: ["Move a bee with arrow codes", "Finish patterns with shapes and colours", "Find a way around rocks", "Fix a code that has a bug"] },
    ],

    pages: [
        {
            title: "Arrows are code",
            blocks: [
                { t: "hero", title: "Help the bee! 🌻", subtitle: "Use arrows to show the bee the way.", emoji: "🐝", theme: "forest" },
                "A **code** is a list of steps. Each arrow is one step.",
                {
                    t: "flashcards",
                    title: "Our four arrows",
                    cards: [["⬆️", "Forward. One step up."], ["➡️", "Right. One step to the right."], ["⬇️", "Back. One step down."], ["⬅️", "Left. One step to the left."]],
                },
                { t: "h2", text: "Your turn" },
                {
                    t: "robot",
                    prompt: "The bee wants the flower. Tap the arrows to make the code, then tap Go!",
                    theme: "bee",
                    mode: "arrows",
                    map: ["S..T"],
                    solution: "right\nright\nright",
                },
                {
                    t: "robot",
                    prompt: "Now the flower is up high. Which arrows do you need?",
                    theme: "bee",
                    mode: "arrows",
                    map: [
                        "..T",
                        "...",
                        "S..",
                    ],
                    solution: "right\nright\nup\nup",
                },
                { t: "callout", variant: "success", text: "You wrote your first code! 🎉" },
            ],
        },
        {
            title: "Patterns",
            blocks: [
                "A **pattern** is something that repeats. Look at it. Say it out loud. What comes next?",
                { t: "pattern", prompt: "Red circle, blue square, red circle, blue square... what comes next?", tokens: ["circle:red", "square:blue", "circle:red", "square:blue", "circle:red", "square:blue"], blanks: [4, 5], distractors: ["triangle:green"] },
                { t: "pattern", prompt: "This pattern has two stars and then a heart.", tokens: ["star:yellow", "star:yellow", "heart:pink", "star:yellow", "star:yellow", "heart:pink", "star:yellow", "star:yellow", "heart:pink"], blanks: [5, 7, 8], distractors: ["circle:blue"] },
                { t: "pattern", prompt: "Arrows can make a pattern too. Finish the code.", tokens: ["arrow-up:blue", "arrow-right:orange", "arrow-up:blue", "arrow-right:orange", "arrow-up:blue", "arrow-right:orange"], blanks: [3, 4, 5], distractors: ["arrow-left:orange", "arrow-down:blue"] },
                { t: "pattern", prompt: "Bee, flower, bee, flower... fill the gaps.", tokens: ["=🐝", "=🌻", "=🐝", "=🌻", "=🐝", "=🌻", "=🐝", "=🌻"], blanks: [2, 5, 7], distractors: ["=🦋"] },
                { t: "callout", variant: "info", text: "Look for patterns at home: on a blanket, on a fence, in a song." },
            ],
        },
        {
            title: "Around the rocks",
            blocks: [
                "Sometimes something is in the way. The bee cannot fly through a **rock**. Find a way around.",
                {
                    t: "robot",
                    prompt: "Go around the rock to the flower.",
                    theme: "bee",
                    mode: "arrows",
                    map: [
                        "...",
                        "S#T",
                        "...",
                    ],
                    solution: "up\nright\nright\ndown",
                },
                {
                    t: "robot",
                    prompt: "Pick up the little flower on the way! 🌼",
                    theme: "bee",
                    mode: "arrows",
                    map: [
                        "S.#.",
                        ".*#.",
                        "...T",
                    ],
                    solution: "down\nright\ndown\nright\nright",
                },
                { t: "h2", text: "Steps in order" },
                "Code only works when the steps are in the **right order**. Getting ready for school has an order too.",
                { t: "order", prompt: "Put the morning in order.", items: ["🛏️ Wake up", "🦷 Brush your teeth", "👕 Get dressed", "🎒 Pack your bag", "🚶 Walk to school"] },
            ],
        },
        {
            title: "Find the bug",
            blocks: [
                { t: "callout", variant: "warning", text: "A **bug** is a mistake in a code. When we fix it, we **debug**." },
                "This code is wrong. The dog walks into the tree! 🌳 Run it and see. Then fix it.",
                {
                    t: "robot",
                    prompt: "Fix the code so the dog gets home. Tap an arrow in the code to take it out.",
                    theme: "dog",
                    mode: "arrows",
                    map: [
                        "S#.",
                        "..T",
                    ],
                    starter: "right\ndown\nright",
                    solution: "down\nright\nright",
                },
                {
                    t: "robot",
                    prompt: "This code stops too soon. Add what is missing, and get the bone on the way. 🦴",
                    theme: "dog",
                    mode: "arrows",
                    map: [
                        "S*.T",
                    ],
                    starter: "right\nright",
                    solution: "right\nright\nright",
                },
                {
                    t: "quiz",
                    pass: 100,
                    questions: [
                        { q: "What is a bug?", options: ["A mistake in a code", "A new arrow", "A pattern"], answer: 0 },
                        { q: "What do we do when we find a bug?", options: ["We stop coding", "We fix it. That is called debugging", "We hide it"], answer: 1 },
                    ],
                },
                { t: "callout", variant: "success", text: "You can write code, see patterns and fix bugs. You are a coder! 🏆" },
            ],
        },
    ],
};
