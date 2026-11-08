import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import NovelEditor from "./NovelEditor";
import { EmptyState } from "./UI";
import { useAuth } from "../contexts/AuthContext";
import { getMyAttempts } from "../services/attemptService";
import { PageBlockContext } from "./editor/PageBlockContext";
import GenerateQuiz from "./editor/GenerateQuiz";
import { fromPageDoc, isDocEmpty, toPageDoc } from "./editor/pageDocument";

/**
 * A course page: one Tiptap document, editable for lecturers and read-only for everyone else.
 *
 *   sections  – what the page loaded with (old multi-section pages are merged here)
 *   onChange  – called on every edit; the parent reads getSections() through the ref
 *   pageId    – the module page this is; auto-marked activities are only offered when it's set
 *   studentPreview – a lecturer looking through a student's eyes
 */
const PageCanvas = forwardRef(({ sections = [], isEditing = false, placeholder = "Start writing, or type / for blocks", onChange, pageId = null, studentPreview = false }, ref) => {
    const editorRef = useRef(null);
    const doc = useMemo(() => toPageDoc(sections), [sections]);
    const { user, role } = useAuth();
    const userId = user?.userId;
    const [attempts, setAttempts] = useState(null);

    // A student's earlier answers, so coming back to a page shows where they got to.
    const loadAttempts = useCallback(() => {
        if (!pageId || isEditing || role !== "student") return;
        getMyAttempts(pageId, userId)
            .then((list) => setAttempts(Object.fromEntries(list.map((a) => [a.blockId, a]))))
            .catch(console.error);
    }, [pageId, isEditing, role, userId]);

    useEffect(() => { loadAttempts(); }, [loadAttempts]);

    const blockContext = useMemo(() => ({ pageId, studentPreview, attempts, onAttempt: loadAttempts }), [pageId, studentPreview, attempts, loadAttempts]);

    const rememberEditor = useCallback(({ editor }) => { editorRef.current = editor; }, []);

    useImperativeHandle(ref, () => ({
        getSections: () => (editorRef.current ? fromPageDoc(editorRef.current.getJSON()) : sections),
        getEditor: () => editorRef.current,
    }), [sections]);

    if (!isEditing && isDocEmpty(doc)) {
        return <EmptyState icon={<FileText size={24} aria-hidden="true" />} title="Nothing here yet" description={placeholder} />;
    }

    return (
        <div className="novel-editor-wrapper relative flex w-full flex-1 select-text flex-col">
            <PageBlockContext.Provider value={blockContext}>
                {/* Edit and read mode mount separately so every block picks up the right behaviour. */}
                <NovelEditor
                    key={isEditing ? "edit" : "view"}
                    initialContent={doc}
                    editable={isEditing}
                    placeholder={placeholder}
                    variant={pageId ? "page" : "home"}
                    toolbarExtra={pageId ? <GenerateQuiz /> : null}
                    onCreate={rememberEditor}
                    onUpdate={() => onChange?.()}
                    className="flex-1"
                />
            </PageBlockContext.Provider>
        </div>
    );
});

PageCanvas.displayName = "PageCanvas";

export default PageCanvas;
