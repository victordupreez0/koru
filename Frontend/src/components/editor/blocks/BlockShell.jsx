import React, { useContext, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { BarChart3 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { Badge, Button, Card } from "../../UI";
import { PageBlockContext } from "../PageBlockContext";
import ResultsDialog from "./ResultsDialog";

/** The frame around every auto-marked block: its label, the student's progress and the lecturer's results. */
export default function BlockShell({ icon, label, blockId, progress, children }) {
    const { role } = useAuth();
    const { studentPreview } = useContext(PageBlockContext);
    const [showResults, setShowResults] = useState(false);
    const isStaff = (role === "teacher" || role === "admin") && !studentPreview;

    return (
        <NodeViewWrapper className="my-4">
            <Card variant="outlined" tone="surface" radius="lg" padding="md" contentEditable={false} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-koru-label text-koru-on-surface-variant">
                        {icon} {label}
                    </span>
                    <span className="flex items-center gap-2">
                        {progress ? (
                            <Badge variant={progress.passed ? "success" : "neutral"} dot={progress.passed}>
                                {progress.passed ? "Passed" : `${progress.attempts} ${progress.attempts === 1 ? "try" : "tries"}`}
                            </Badge>
                        ) : null}
                        {isStaff && blockId ? (
                            <Button variant="text" size="sm" startIcon={<BarChart3 size={13} />} onClick={() => setShowResults(true)}>Results</Button>
                        ) : null}
                    </span>
                </div>
                {children}
            </Card>
            {showResults ? <ResultsDialog blockId={blockId} onClose={() => setShowResults(false)} /> : null}
        </NodeViewWrapper>
    );
}
