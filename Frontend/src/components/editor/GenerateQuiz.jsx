import React, { useState } from "react";
import { useEditor } from "novel";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { generateQuizDraft } from "../../services/assistantService";
import { Alert, Button, Modal, Select, Skeleton } from "../UI";
import { blankQuestion } from "./blocks/interactive";
import QuizQuestionsEditor from "./blocks/QuizQuestionsEditor";

/** Drafts a quiz from the page. Nothing reaches the page until the lecturer has reviewed it. */
export default function GenerateQuiz() {
    const { editor } = useEditor();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState("5");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [questions, setQuestions] = useState(null);
    if (!editor) return null;

    const close = () => {
        setOpen(false);
        setError("");
        setQuestions(null);
    };

    const generate = async () => {
        setBusy(true);
        setError("");
        try {
            setQuestions(await generateQuizDraft(editor.getText(), Number(count), user.userId));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const insert = (list) => {
        editor.chain().focus().insertContent({ type: "quizBlock", attrs: { questions: list } }).run();
        close();
    };

    return (
        <>
            <Button variant="text" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(true)} startIcon={<Sparkles size={13} />}>
                Generate quiz
            </Button>
            <Modal
                open={open}
                onClose={close}
                title="Generate a quiz from this page"
                description="AI drafts the questions from what's on this page. Check them before adding."
                size="lg"
                footer={
                    questions ? (
                        <>
                            <Button variant="text" onClick={generate} loading={busy}>Try again</Button>
                            <Button onClick={() => insert(questions)} disabled={questions.length === 0}>Add quiz to page</Button>
                        </>
                    ) : error ? (
                        <>
                            <Button variant="text" onClick={generate} loading={busy}>Try again</Button>
                            <Button variant="tonal" onClick={() => insert([blankQuestion()])}>Write it myself</Button>
                        </>
                    ) : (
                        <Button onClick={generate} loading={busy} startIcon={<Sparkles size={14} />}>Generate</Button>
                    )
                }
            >
                {error ? <Alert variant="error" className="mb-3">{error}</Alert> : null}
                {busy ? (
                    <div className="flex flex-col gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
                ) : questions ? (
                    <QuizQuestionsEditor questions={questions} onChange={setQuestions} />
                ) : (
                    <Select label="How many questions?" value={count} onChange={(e) => setCount(e.target.value)}>
                        {["3", "5", "8", "10"].map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                )}
            </Modal>
        </>
    );
}
