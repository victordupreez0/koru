import React, { useCallback, useEffect, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Download, Paperclip } from "lucide-react";
import { Card } from "../../UI";
import { uploadEditorFile } from "../../../services/cloudinaryService";
import { safeUrl } from "../pageDocument";
import { takeFile } from "../uploads";
import BlockPlaceholder from "./BlockPlaceholder";

function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileView({ node, updateAttributes, editor }) {
    const { url, name, size, uploadId } = node.attrs;
    const editable = editor.isEditable;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const href = safeUrl(url);

    const upload = useCallback(async (file) => {
        setBusy(true);
        setError("");
        try {
            updateAttributes({ url: await uploadEditorFile(file), name: file.name, size: file.size, uploadId: null });
        } catch (err) {
            setError(err.message || "The file couldn't be uploaded.");
        } finally {
            setBusy(false);
        }
    }, [updateAttributes]);

    useEffect(() => {
        if (!uploadId) return;
        const file = takeFile(uploadId);
        if (file) upload(file);
    }, [uploadId, upload]);

    if (!href) {
        if (!editable) return <NodeViewWrapper />;
        return (
            <NodeViewWrapper className="my-3">
                <BlockPlaceholder icon={<Paperclip size={18} aria-hidden="true" />} title="File attachment" hint={name ? `Uploading ${name}` : "Slides, PDFs, datasets: anything students should download."} onFile={upload} busy={busy || !!uploadId} error={error} />
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="my-3">
            <Card variant="outlined" tone="surface" radius="lg" padding="sm" contentEditable={false} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-koru-md bg-koru-primary-container text-koru-on-primary-container">
                    <Paperclip size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-koru-label text-koru-on-surface">{name || "Attachment"}</span>
                    <span className="block text-koru-caption text-koru-on-surface-variant">{formatSize(size)}</span>
                </span>
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={name || true}
                    aria-label={`Download ${name || "attachment"}`}
                    className="flex h-10 w-10 items-center justify-center rounded-koru-pill text-koru-primary transition-colors hover:bg-koru-primary/8"
                >
                    <Download size={18} aria-hidden="true" />
                </a>
            </Card>
        </NodeViewWrapper>
    );
}

export const FileBlock = Node.create({
    name: "fileAttachment",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            url: { default: "", parseHTML: (el) => el.getAttribute("data-file"), renderHTML: (a) => ({ "data-file": a.url }) },
            name: { default: "" },
            size: { default: 0 },
            uploadId: { default: null, rendered: false },
        };
    },
    parseHTML() {
        return [{ tag: "div[data-file]" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
        return ReactNodeViewRenderer(FileView);
    },
});
