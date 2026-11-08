import React, { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { MonitorPlay } from "lucide-react";
import { Button } from "../../UI";
import { cn } from "../../../utils/cn";
import { toEmbed } from "../pageDocument";
import BlockPlaceholder from "./BlockPlaceholder";

function EmbedView({ node, updateAttributes, editor, selected }) {
    const editable = editor.isEditable;
    const [error, setError] = useState("");
    const embed = toEmbed(node.attrs.url);

    const addUrl = (value) => {
        if (toEmbed(value)) {
            setError("");
            updateAttributes({ url: value });
        } else {
            setError("That link can't be embedded. Try YouTube, Vimeo, Google Slides, Docs or Forms, Canva or Figma.");
        }
    };

    if (!embed) {
        if (!editable) return <NodeViewWrapper />;
        return (
            <NodeViewWrapper className="my-3">
                <BlockPlaceholder
                    icon={<MonitorPlay size={18} aria-hidden="true" />}
                    title="Video or embed"
                    hint="YouTube, Vimeo, Google Slides, Docs, Sheets or Forms, Canva and Figma. Share the file publicly first."
                    urlLabel="Paste a link"
                    onUrl={addUrl}
                    error={error}
                />
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="my-4" data-embed-provider={embed.provider}>
            <div className={cn("relative aspect-video w-full overflow-hidden rounded-koru-md shadow-koru-card", editable && selected && "ring-2 ring-koru-focus")}>
                <iframe
                    src={embed.src}
                    title={`${embed.provider} embed`}
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
                    // While editing, clicks should select the block rather than disappear into the iframe.
                    className={cn("absolute inset-0 h-full w-full border-0", editable && !selected && "pointer-events-none")}
                />
            </div>
            {editable && selected ? (
                <div contentEditable={false} className="mt-2 flex justify-center">
                    <Button variant="text" size="sm" onClick={() => updateAttributes({ url: "" })}>Change link</Button>
                </div>
            ) : null}
        </NodeViewWrapper>
    );
}

export const EmbedBlock = Node.create({
    name: "embed",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return { url: { default: "", parseHTML: (el) => el.getAttribute("data-embed"), renderHTML: (a) => ({ "data-embed": a.url }) } };
    },
    parseHTML() {
        return [{ tag: "div[data-embed]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
        return ReactNodeViewRenderer(EmbedView);
    },
});
