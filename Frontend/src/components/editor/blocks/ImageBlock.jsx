import React, { useCallback, useEffect, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Image as ImageIcon } from "lucide-react";
import { Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { uploadEditorFile } from "../../../services/cloudinaryService";
import { safeUrl } from "../pageDocument";
import { takeFile } from "../uploads";
import BlockPlaceholder from "./BlockPlaceholder";

const SIZES = { small: "w-1/3", medium: "w-2/3", full: "w-full" };

const PRESETS = [
    { label: "Abstract pattern", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" },
    { label: "Grid", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80" },
    { label: "Workspace", url: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1000&q=80" },
];

function ImageView({ node, updateAttributes, editor, selected }) {
    const { src, alt, caption, size, uploadId } = node.attrs;
    const editable = editor.isEditable;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const url = safeUrl(src);

    const upload = useCallback(async (file) => {
        setBusy(true);
        setError("");
        try {
            updateAttributes({ src: await uploadEditorFile(file), uploadId: null });
        } catch (err) {
            setError(err.message || "The image couldn't be uploaded.");
        } finally {
            setBusy(false);
        }
    }, [updateAttributes]);

    useEffect(() => {
        if (!uploadId) return;
        const file = takeFile(uploadId);
        if (file) upload(file);
    }, [uploadId, upload]);

    const addUrl = (value) => {
        if (safeUrl(value)) {
            setError("");
            updateAttributes({ src: value, uploadId: null });
        } else {
            setError("That doesn't look like a web address. It should start with https://");
        }
    };

    if (!url) {
        if (!editable) return <NodeViewWrapper />;
        return (
            <NodeViewWrapper className="my-3">
                <BlockPlaceholder icon={<ImageIcon size={18} aria-hidden="true" />} title="Image" accept="image/*" urlLabel="Or paste an image link" onFile={upload} onUrl={addUrl} busy={busy || !!uploadId} error={error}>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => addUrl(p.url)}
                                className="cursor-pointer rounded-koru-sm bg-koru-surface-container-high px-2 py-1 text-koru-caption text-koru-on-surface-variant transition-colors hover:bg-koru-primary-container hover:text-koru-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </BlockPlaceholder>
            </NodeViewWrapper>
        );
    }

    return (
        <NodeViewWrapper className="my-4">
            <figure className={cn("mx-auto", SIZES[size] ?? SIZES.full)}>
                <img
                    src={url}
                    alt={alt ?? ""}
                    draggable={false}
                    className={cn("w-full rounded-koru-md shadow-koru-card", editable && selected && "ring-2 ring-koru-focus")}
                />
                {editable ? (
                    <input
                        value={caption}
                        placeholder="Add a caption"
                        aria-label="Image caption"
                        onChange={(e) => updateAttributes({ caption: e.target.value })}
                        className="mt-1 w-full bg-transparent text-center text-koru-caption text-koru-on-surface-variant outline-none placeholder:text-koru-outline"
                    />
                ) : caption ? (
                    <figcaption className="mt-1 text-center text-koru-caption text-koru-on-surface-variant">{caption}</figcaption>
                ) : null}
            </figure>

            {editable && selected ? (
                <div contentEditable={false} className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <Input
                        size="sm"
                        aria-label="Alt text for screen readers"
                        placeholder="Describe this image for screen readers"
                        value={alt ?? ""}
                        onChange={(e) => updateAttributes({ alt: e.target.value })}
                        containerClassName="min-w-[260px] flex-1"
                    />
                    {Object.keys(SIZES).map((s) => (
                        <button
                            key={s}
                            type="button"
                            aria-pressed={(size ?? "full") === s}
                            onClick={() => updateAttributes({ size: s })}
                            className={cn(
                                "cursor-pointer rounded-koru-sm px-2 py-1 text-koru-caption capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                (size ?? "full") === s ? "bg-koru-primary-container text-koru-on-primary-container" : "bg-koru-surface-container-high text-koru-on-surface-variant",
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            ) : null}
        </NodeViewWrapper>
    );
}

export const ImageBlock = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            caption: { default: "" },
            size: { default: "full" },
            uploadId: { default: null, rendered: false },
        };
    },
    addInputRules() {
        return [];
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageView);
    },
});
