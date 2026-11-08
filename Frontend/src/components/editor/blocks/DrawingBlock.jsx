import React, { Suspense, lazy, useRef, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { PenLine } from "lucide-react";
import { Alert, Button, Card, Input, Modal, Skeleton } from "../../UI";
import { jsonAttribute } from "../behaviours";

const DrawingCanvas = lazy(() => import("./DrawingCanvas"));

// Students get the saved picture as an <img>: nothing inside an image can run, and they never download the drawing tool.
const svgToSrc = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

function DrawingView({ node, updateAttributes, editor }) {
    const { elements, svg, alt } = node.attrs;
    const editable = editor.isEditable;
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const canvas = useRef(null);

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            updateAttributes(await canvas.current.getResult());
            setOpen(false);
        } catch (err) {
            console.error("Saving the drawing failed:", err);
            setError("The drawing couldn't be saved. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!editable) {
        return (
            <NodeViewWrapper className="my-4">
                {svg ? <img src={svgToSrc(svg)} alt={alt || "Drawing"} className="mx-auto max-w-full rounded-koru-md" /> : null}
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="my-4">
            {svg ? (
                <div contentEditable={false} className="flex flex-col items-center gap-2">
                    <img src={svgToSrc(svg)} alt={alt || "Drawing"} className="max-w-full rounded-koru-md ring-1 ring-inset ring-koru-outline-faint" />
                    <div className="flex w-full flex-wrap items-center justify-center gap-2">
                        <Input
                            size="sm"
                            aria-label="Describe this drawing for screen readers"
                            placeholder="Describe this drawing for screen readers"
                            value={alt}
                            onChange={(e) => updateAttributes({ alt: e.target.value })}
                            containerClassName="min-w-[260px] flex-1"
                        />
                        <Button variant="tonal" size="sm" startIcon={<PenLine size={13} />} onClick={() => setOpen(true)}>Edit drawing</Button>
                    </div>
                </div>
            ) : (
                <Card tone="low" radius="lg" padding="sm" contentEditable={false} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-koru-label text-koru-on-surface">
                        <PenLine size={18} aria-hidden="true" className="text-koru-on-surface-variant" /> Drawing
                    </span>
                    <Button variant="tonal" size="sm" onClick={() => setOpen(true)}>Start drawing</Button>
                </Card>
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Drawing"
                size="xl"
                closeOnEscape={false}
                closeOnBackdrop={false}
                footer={
                    <>
                        <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button loading={saving} onClick={save}>Save drawing</Button>
                    </>
                }
            >
                {error ? <Alert variant="error" className="mb-3">{error}</Alert> : null}
                <div className="h-[62vh] overflow-hidden rounded-koru-md">
                    {open ? (
                        <Suspense fallback={<Skeleton className="h-full w-full" />}>
                            <DrawingCanvas ref={canvas} elements={elements} />
                        </Suspense>
                    ) : null}
                </div>
            </Modal>
        </NodeViewWrapper>
    );
}

export const DrawingBlock = Node.create({
    name: "drawing",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            elements: jsonAttribute("elements", []),
            svg: { default: "", parseHTML: (el) => el.getAttribute("data-svg") ?? "", renderHTML: (a) => ({ "data-svg": a.svg }) },
            alt: { default: "" },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-drawing]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-drawing": "" })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(DrawingView);
    },
});
