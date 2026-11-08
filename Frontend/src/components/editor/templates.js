// One-click starting points. Each is a list of ordinary blocks, so everything stays editable.

const text = (t) => [{ type: "text", text: t }];
const p = (t) => ({ type: "paragraph", ...(t ? { content: text(t) } : {}) });
const h = (level, t) => ({ type: "heading", attrs: { level }, content: text(t) });
const items = (list) => list.map((t) => ({ type: "listItem", content: [p(t)] }));
const bullets = (...list) => ({ type: "bulletList", content: items(list) });
const steps = (...list) => ({ type: "orderedList", content: items(list) });
const tasks = (...list) => ({
    type: "taskList",
    content: list.map((t) => ({ type: "taskItem", attrs: { checked: false }, content: [p(t)] })),
});
const callout = (variant, t) => ({ type: "callout", attrs: { variant }, content: [p(t)] });
const divider = { type: "horizontalRule" };
const cell = (type, t) => ({ type, content: [p(t)] });
const table = (header, ...rows) => ({
    type: "table",
    content: [
        { type: "tableRow", content: header.map((t) => cell("tableHeader", t)) },
        ...rows.map((row) => ({ type: "tableRow", content: row.map((t) => cell("tableCell", t)) })),
    ],
});

export const PAGE_TEMPLATES = [
    {
        id: "lecture",
        title: "Lecture page",
        description: "Outcomes, notes, video and takeaways",
        blocks: [
            callout("info", "By the end of this lecture you will be able to explain the main idea and apply it to an example."),
            h(1, "Overview"),
            p("Introduce the topic and why it matters."),
            h(2, "Learning outcomes"),
            bullets("Outcome one", "Outcome two", "Outcome three"),
            divider,
            h(1, "Lecture notes"),
            p("Write the main content here. Type / to add slides, a video or a diagram."),
            { type: "embed", attrs: { url: "" } },
            h(2, "Key takeaways"),
            bullets("Takeaway one", "Takeaway two"),
            h(2, "Further reading"),
            bullets("Add a link to a reading"),
        ],
    },
    {
        id: "lab",
        title: "Lab instructions",
        description: "Setup, numbered steps and a checklist",
        blocks: [
            callout("warning", "Finish the setup before the session starts."),
            h(1, "Goal"),
            p("Describe what students will build or discover."),
            h(2, "What you need"),
            bullets("Software or tools", "Starter files"),
            h(1, "Steps"),
            steps("First step", "Second step", "Third step"),
            { type: "codeBlock", attrs: { language: "javascript" }, content: text("// Starter code goes here") },
            h(2, "Before you leave"),
            tasks("It runs without errors", "I tested it with a partner", "I submitted my work"),
        ],
    },
    {
        id: "assignment",
        title: "Assignment brief",
        description: "The task, deliverables and marks",
        blocks: [
            callout("error", "Due date: add the date and time here. Late work loses 10% per day."),
            h(1, "The brief"),
            p("Explain the scenario and what students must do."),
            h(2, "Deliverables"),
            tasks("Deliverable one", "Deliverable two"),
            h(2, "How it will be marked"),
            table(["Criterion", "Weight", "What good looks like"], ["Understanding", "40%", "Clear and accurate"], ["Execution", "40%", "Works and is well built"], ["Presentation", "20%", "Neat and easy to follow"]),
            h(2, "Submitting"),
            p("Say where and how to submit."),
        ],
    },
];
