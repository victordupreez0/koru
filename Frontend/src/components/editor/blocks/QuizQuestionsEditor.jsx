import React, { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Input } from "../../UI";
import { blankQuestion } from "./interactive";

/** Edits a list of questions in the same shape as Assignments.QuizQuestionsJson. */
export default function QuizQuestionsEditor({ questions, onChange }) {
    const groupId = useId();
    const setQuestion = (qi, patch) => onChange(questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
    const setOption = (qi, oi, value) => setQuestion(qi, { options: questions[qi].options.map((o, i) => (i === oi ? value : o)) });

    return (
        <div className="flex flex-col gap-3">
            {questions.map((q, qi) => (
                <Card key={qi} tone="low" radius="md" padding="sm" className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <Input size="sm" aria-label={`Question ${qi + 1}`} placeholder={`Question ${qi + 1}`} value={q.question} onChange={(e) => setQuestion(qi, { question: e.target.value })} containerClassName="flex-1" />
                        <Button variant="text" size="sm" aria-label={`Remove question ${qi + 1}`} onClick={() => onChange(questions.filter((_, i) => i !== qi))}><Trash2 size={14} aria-hidden="true" /></Button>
                    </div>
                    {q.options.map((option, oi) => (
                        <label key={oi} className="flex items-center gap-2">
                            <input type="radio" name={`${groupId}-${qi}`} checked={q.correctAnswer === oi} onChange={() => setQuestion(qi, { correctAnswer: oi })} aria-label={`Option ${oi + 1} is correct`} className="h-4 w-4 accent-koru-primary" />
                            <Input size="sm" aria-label={`Question ${qi + 1} option ${oi + 1}`} placeholder={`Option ${oi + 1}`} value={option} onChange={(e) => setOption(qi, oi, e.target.value)} containerClassName="flex-1" />
                        </label>
                    ))}
                </Card>
            ))}
            <Button variant="tonal" size="sm" className="self-start" startIcon={<Plus size={13} />} onClick={() => onChange([...questions, blankQuestion()])}>Add question</Button>
        </div>
    );
}
