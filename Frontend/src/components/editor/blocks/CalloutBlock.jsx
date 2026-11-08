import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../../utils/cn";

const VARIANTS = {
    info: { label: "Info", icon: Info, className: "bg-koru-info-soft", iconClass: "text-koru-info" },
    success: { label: "Tip", icon: CircleCheck, className: "bg-koru-success-soft", iconClass: "text-koru-success" },
    warning: { label: "Warning", icon: TriangleAlert, className: "bg-koru-warning-soft", iconClass: "text-koru-warning" },
    error: { label: "Important", icon: CircleAlert, className: "bg-koru-error-container", iconClass: "text-koru-error" },
};
const ORDER = Object.keys(VARIANTS);

function CalloutView({ node, updateAttributes, editor }) {
    const variant = VARIANTS[node.attrs.variant] ? node.attrs.variant : "info";
    const { icon: Icon, className, iconClass, label } = VARIANTS[variant];
    const next = ORDER[(ORDER.indexOf(variant) + 1) % ORDER.length];

    return (
        <NodeViewWrapper className={cn("my-3 flex gap-3 rounded-koru-md px-4 py-3", className)} data-callout={variant}>
            {editor.isEditable ? (
                <button
                    type="button"
                    contentEditable={false}
                    title={`${label}: click to change`}
                    aria-label={`Callout style ${label}, change to ${VARIANTS[next].label}`}
                    onClick={() => updateAttributes({ variant: next })}
                    className={cn("mt-0.5 h-fit cursor-pointer rounded-koru-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus", iconClass)}
                >
                    <Icon size={18} aria-hidden="true" />
                </button>
            ) : (
                <span contentEditable={false} className={cn("mt-0.5", iconClass)}>
                    <Icon size={18} role="img" aria-label={label} />
                </span>
            )}
            <NodeViewContent className="min-w-0 flex-1" />
        </NodeViewWrapper>
    );
}

export const CalloutBlock = Node.create({
    name: "callout",
    group: "block",
    content: "block+",
    defining: true,

    addAttributes() {
        return {
            variant: {
                default: "info",
                parseHTML: (el) => el.getAttribute("data-callout"),
                renderHTML: (attrs) => ({ "data-callout": attrs.variant }),
            },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-callout]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
        return ReactNodeViewRenderer(CalloutView);
    },
});
