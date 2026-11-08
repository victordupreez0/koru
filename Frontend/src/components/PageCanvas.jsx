import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { FileText } from "lucide-react";
import NovelEditor from "./NovelEditor";
import { EmptyState } from "./UI";
import { fromPageDoc, isDocEmpty, toPageDoc } from "./editor/pageDocument";

/**
 * A course page: one Tiptap document, editable for lecturers and read-only for everyone else.
 *
 *   sections  – what the page loaded with (old multi-section pages are merged here)
 *   onChange  – called on every edit; the parent reads getSections() through the ref
 */
const PageCanvas = forwardRef(({ sections = [], isEditing = false, placeholder = "Start writing, or type / for blocks", onChange, toolbarExtra }, ref) => {
    const editorRef = useRef(null);
    const doc = useMemo(() => toPageDoc(sections), [sections]);

    useImperativeHandle(ref, () => ({
        getSections: () => (editorRef.current ? fromPageDoc(editorRef.current.getJSON()) : sections),
        getEditor: () => editorRef.current,
    }), [sections]);

    if (!isEditing && isDocEmpty(doc)) {
        return <EmptyState icon={<FileText size={24} aria-hidden="true" />} title="Nothing here yet" description={placeholder} />;
    }

    return (
        <div className="novel-editor-wrapper relative flex w-full flex-1 select-text flex-col">
            {/* Edit and read mode mount separately so every block picks up the right behaviour. */}
            <NovelEditor
                key={isEditing ? "edit" : "view"}
                initialContent={doc}
                editable={isEditing}
                placeholder={placeholder}
                toolbarExtra={toolbarExtra}
                onCreate={({ editor }) => { editorRef.current = editor; }}
                onUpdate={() => onChange?.()}
                className="flex-1"
            />
        </div>
    );
});

PageCanvas.displayName = "PageCanvas";

export default PageCanvas;
