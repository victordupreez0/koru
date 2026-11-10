import React, { useEffect, useId, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Workflow } from "lucide-react";
import { Button, Card, Input } from "../../UI";

const DIAGRAM_EXAMPLES = {
    Flowchart: `flowchart TD
    A([Start]) --> B[/Read a number/]
    B --> C{Is it bigger than 0?}
    C -- Yes --> D[Say "positive"]
    C -- No --> E[Say "not positive"]
    D --> F([End])
    E --> F`,
    "Class diagram": `classDiagram
    class TLearner {
        -String fName
        -Integer fMark
        +Create(sName, iMark)
        +GetName() String
        +SetMark(iMark)
    }`,
    "Database (ERD)": `erDiagram
    LEARNER ||--o{ RESULT : gets
    LEARNER {
        int LearnerID PK
        string Name
    }
    RESULT {
        int ResultID PK
        int LearnerID FK
        int Mark
    }`,
    "Mind map": `mindmap
  root((Coding))
    Sequence
    Loops
    Decisions
    Variables`,
};

let mermaidReady = null;
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Mermaid is large, so it is only fetched when a page has a diagram. Colours come from the design tokens.
function loadMermaid() {
    mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            fontFamily: "inherit",
            themeVariables: {
                primaryColor: css("--color-koru-primary-container"),
                primaryTextColor: css("--color-koru-on-surface"),
                primaryBorderColor: css("--color-koru-primary"),
                lineColor: css("--color-koru-on-surface-variant"),
                secondaryColor: css("--color-koru-secondary-container"),
                tertiaryColor: css("--color-koru-surface-container-low"),
                fontSize: "15px",
            },
        });
        return mermaid;
    });
    return mermaidReady;
}

function Diagram({ code, label }) {
    const id = `diagram-${useId().replace(/[^a-z0-9]/gi, "")}`;
    const [drawn, setDrawn] = useState({ svg: "", error: "" });

    useEffect(() => {
        let live = true;
        if (!code.trim()) return undefined;
        loadMermaid()
            .then((mermaid) => mermaid.render(id, code))
            .then(({ svg }) => live && setDrawn({ svg, error: "" }))
            .catch((err) => {
                document.getElementById(id)?.remove(); // Mermaid leaves a half-drawn element behind when it fails
                if (live) setDrawn((d) => ({ ...d, error: String(err.message ?? err).split("\n")[0] }));
            });
        return () => { live = false; };
    }, [code, id]);

    return (
        <>
            {drawn.svg ? (
                // Mermaid sanitises its own output (securityLevel "strict"), so no script can come through here.
                <div role="img" aria-label={label || "Diagram"} className="koru-diagram flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: drawn.svg }} />
            ) : null}
            {drawn.error ? <p className="text-koru-caption text-koru-warning">This diagram can't be drawn yet: {drawn.error}</p> : null}
        </>
    );
}

function DiagramView({ node, updateAttributes, editor }) {
    const { code, caption } = node.attrs;

    if (!editor.isEditable) {
        return (
            <NodeViewWrapper className="my-5">
                <figure contentEditable={false} className="flex flex-col items-center gap-2">
                    <Diagram code={code} label={caption} />
                    {caption ? <figcaption className="text-koru-caption text-koru-on-surface-variant">{caption}</figcaption> : null}
                </figure>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="my-5">
            <Card variant="outlined" tone="surface" radius="lg" padding="sm" contentEditable={false} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-koru-label text-koru-on-surface"><Workflow size={16} aria-hidden="true" className="text-koru-on-surface-variant" /> Diagram</span>
                    <span className="flex flex-wrap gap-1">
                        {Object.entries(DIAGRAM_EXAMPLES).map(([name, example]) => (
                            <Button key={name} size="sm" variant="text" onClick={() => updateAttributes({ code: example })}>{name}</Button>
                        ))}
                    </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <textarea
                        aria-label="Diagram text"
                        value={code}
                        spellCheck={false}
                        rows={10}
                        onChange={(e) => updateAttributes({ code: e.target.value })}
                        className="w-full resize-y rounded-koru-md bg-koru-inverse-surface p-3 font-mono text-sm text-koru-inverse-on-surface outline-none focus:ring-2 focus:ring-koru-primary"
                    />
                    <div className="flex min-h-40 flex-col justify-center rounded-koru-md bg-koru-surface-container-low p-3"><Diagram code={code} label={caption} /></div>
                </div>
                <Input size="sm" aria-label="Caption" placeholder="Caption (optional)" value={caption} onChange={(e) => updateAttributes({ caption: e.target.value })} />
                <p className="text-koru-caption text-koru-on-surface-variant">Pick an example and change the words. Each arrow is written as A --&gt; B.</p>
            </Card>
        </NodeViewWrapper>
    );
}

/** Flowcharts, class diagrams and database diagrams, written as text and drawn by Mermaid. */
export const DiagramBlock = Node.create({
    name: "diagram",
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
        return { code: { default: DIAGRAM_EXAMPLES.Flowchart }, caption: { default: "" } };
    },
    parseHTML() {
        return [{ tag: "div[data-diagram]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-diagram": "" })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(DiagramView);
    },
});
