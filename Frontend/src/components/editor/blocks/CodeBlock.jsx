import React, { useState } from "react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Check, Copy } from "lucide-react";
import { Select } from "../../UI";

const lowlight = createLowlight(common);

const LANGUAGES = [
    ["", "Auto"],
    ["javascript", "JavaScript"],
    ["typescript", "TypeScript"],
    ["python", "Python"],
    ["csharp", "C#"],
    ["java", "Java"],
    ["xml", "HTML"],
    ["css", "CSS"],
    ["sql", "SQL"],
    ["json", "JSON"],
    ["bash", "Bash"],
];

function CodeBlockView({ node, updateAttributes, editor }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(node.textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <NodeViewWrapper className="relative my-4">
            <div contentEditable={false} className="absolute right-2 top-2 z-10 flex items-center gap-1">
                {editor.isEditable ? (
                    <Select
                        size="sm"
                        aria-label="Code language"
                        value={node.attrs.language ?? ""}
                        onChange={(e) => updateAttributes({ language: e.target.value || null })}
                    >
                        {LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                ) : null}
                <button
                    type="button"
                    onClick={copy}
                    aria-label={copied ? "Copied" : "Copy code"}
                    className="cursor-pointer rounded-koru-sm p-1.5 text-koru-inverse-on-surface transition-colors hover:bg-koru-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-inverse-primary"
                >
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </button>
            </div>
            <pre>
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    );
}

export const CodeBlock = CodeBlockLowlight.extend({
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
    },
    addKeyboardShortcuts() {
        return {
            ...this.parent?.(),
            // Tab indents inside code instead of jumping out of the editor.
            Tab: () => this.editor.isActive("codeBlock") && this.editor.commands.insertContent("    "),
        };
    },
}).configure({ lowlight, defaultLanguage: null });
