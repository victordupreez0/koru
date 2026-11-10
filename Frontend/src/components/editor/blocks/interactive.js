import { useContext, useState } from "react";
import confetti from "canvas-confetti";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { useAuth } from "../../../contexts/AuthContext";
import { previewMark, submitAttempt } from "../../../services/attemptService";
import { ActivityPreviewContext, PageBlockContext } from "../PageBlockContext";

/** The Tiptap node shared by every auto-marked block. */
export const makeInteractiveBlock = (name, attributes, View) =>
    Node.create({
        name,
        group: "block",
        atom: true,
        draggable: true,

        addAttributes() {
            return {
                blockId: { default: null, parseHTML: (el) => el.getAttribute("data-block-id"), renderHTML: (a) => ({ "data-block-id": a.blockId }) },
                ...attributes,
            };
        },
        parseHTML() {
            return [{ tag: `div[data-type="${name}"]` }];
        },
        renderHTML({ HTMLAttributes }) {
            return ["div", mergeAttributes(HTMLAttributes, { "data-type": name })];
        },
        addNodeView() {
            return ReactNodeViewRenderer(View);
        },
    });

/** Same shape as Assignments.QuizQuestionsJson. */
export const blankQuestion = () => ({ question: "", options: ["", "", "", ""], correctAnswer: 0 });

export const celebrate = () => confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, disableForReducedMotion: true });

/** Sends an answer to the server and reports what came back. The browser never decides a result. */
export function useBlockAttempt(blockId) {
    const { pageId, attempts, onAttempt } = useContext(PageBlockContext);
    const preview = useContext(ActivityPreviewContext);
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (answer) => {
        setBusy(true);
        setError("");
        try {
            // A lecturer trying an unsaved block is marked against what's in their editor.
            const result = preview
                ? await previewMark(user.userId, preview, answer)
                : await submitAttempt(pageId, blockId, user.userId, answer);
            if (!preview) onAttempt?.();
            return result;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setBusy(false);
        }
    };

    return { submit, busy, error, progress: preview ? null : attempts?.[blockId] ?? null };
}
