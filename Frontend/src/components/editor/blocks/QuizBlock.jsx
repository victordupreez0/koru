import React, { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Alert, Button, Input } from "../../UI";
import { cn } from "../../../utils/cn";
import { jsonAttribute } from "../behaviours";
import { makeActivityBlock } from "./activity";
import { blankQuestion, celebrate, useBlockAttempt } from "./interactive";
import QuizQuestionsEditor from "./QuizQuestionsEditor";
import Prose from "./Prose";

function Play({ attrs }) {
    const { blockId, questions } = attrs;
    const { submit, busy, error, progress } = useBlockAttempt(blockId);
    const [picked, setPicked] = useState(null);
    const [result, setResult] = useState(null);

    const answers = picked ?? progress?.lastAnswer?.answers ?? questions.map(() => null);
    const ready = answers.length === questions.length && answers.every((a) => a !== null);
    const perQuestion = result?.details?.perQuestion;

    const choose = (qi, oi) => {
        setResult(null);
        setPicked(answers.map((a, i) => (i === qi ? oi : a)));
    };

    const check = async () => {
        const r = await submit({ answers });
        if (!r) return;
        setResult(r);
        if (r.passed) celebrate();
    };

    return (
        <>
            {questions.map((q, qi) => (
                <fieldset key={qi} className="flex flex-col gap-1.5">
                    <legend className="mb-1 text-koru-body font-medium text-koru-on-surface"><Prose as="span" text={`${qi + 1}. ${q.question}`} /></legend>
                    {q.options.filter(Boolean).map((option, oi) => (
                        <label
                            key={oi}
                            className={cn(
                                "flex cursor-pointer items-center gap-2.5 rounded-koru-sm px-3 py-2 text-koru-body transition-colors",
                                answers[qi] === oi ? "bg-koru-primary-container text-koru-on-primary-container" : "bg-koru-surface-container-low hover:bg-koru-surface-container-high",
                                perQuestion && answers[qi] === oi && (perQuestion[qi] ? "bg-koru-success-soft text-koru-success" : "bg-koru-error-container text-koru-on-error-container"),
                            )}
                        >
                            <input type="radio" name={`${blockId}-${qi}`} checked={answers[qi] === oi} onChange={() => choose(qi, oi)} className="h-4 w-4 accent-koru-primary" />
                            {option}
                        </label>
                    ))}
                </fieldset>
            ))}
            <div>
                <Button size="sm" onClick={check} loading={busy} disabled={!ready || result?.passed}>Check my answers</Button>
            </div>
            {result ? <Alert variant={result.passed ? "success" : "warning"}>{result.message}</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
        </>
    );
}

function Author({ attrs, update }) {
    return (
        <>
            <QuizQuestionsEditor questions={attrs.questions} onChange={(questions) => update({ questions })} />
            <Input
                size="sm"
                type="number"
                min={1}
                max={100}
                label="Pass mark (%)"
                value={attrs.passPercent}
                onChange={(e) => update({ passPercent: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
                containerClassName="w-32"
            />
        </>
    );
}

export const QuizBlock = makeActivityBlock({
    name: "quizBlock",
    label: "Quiz",
    icon: <CircleHelp size={15} aria-hidden="true" />,
    attributes: {
        questions: jsonAttribute("questions", [blankQuestion()]),
        passPercent: { default: 50 },
    },
    Author,
    Play,
});
