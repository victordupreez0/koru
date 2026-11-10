import React, { useContext, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { BarChart3, Eye, Settings2 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { Badge, Button, Card } from "../../UI";
import { cn } from "../../../utils/cn";
import { PageBlockContext } from "../PageBlockContext";
import ResultsDialog from "./ResultsDialog";

const TABS = [
    { value: "setup", label: "Set up", icon: Settings2 },
    { value: "try", label: "Try it", icon: Eye },
];

/**
 * The frame around every activity: its name, the student's progress and the lecturer's results.
 * While editing, `tab` and `onTab` add the "Set up / Try it" switch.
 * `marked` is false for things to explore that have no right answer.
 */
export default function BlockShell({ icon, label, blockId, marked = true, tab, onTab, children }) {
    const { role } = useAuth();
    const { studentPreview, attempts } = useContext(PageBlockContext);
    const [showResults, setShowResults] = useState(false);
    const isStaff = (role === "teacher" || role === "admin") && !studentPreview;
    const progress = marked && !onTab ? attempts?.[blockId] ?? null : null;

    return (
        <NodeViewWrapper className="my-5">
            <Card variant="outlined" tone="surface" radius="lg" padding="none" contentEditable={false} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-koru-outline-faint bg-koru-surface-container-low px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5 text-koru-label text-koru-on-surface">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-koru-sm bg-koru-primary-container text-koru-on-primary-container">{icon}</span>
                        <span className="truncate">{label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        {progress ? (
                            <Badge variant={progress.passed ? "success" : "neutral"} dot={progress.passed}>
                                {progress.passed ? "Passed" : `${progress.attempts} ${progress.attempts === 1 ? "try" : "tries"}`}
                            </Badge>
                        ) : null}
                        {onTab ? (
                            <span role="tablist" aria-label={`${label} view`} className="flex rounded-koru-pill bg-koru-surface-container-high p-0.5">
                                {TABS.map(({ value, label: text, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === value}
                                        onClick={() => onTab(value)}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-1.5 rounded-koru-pill px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                                            tab === value ? "bg-koru-surface text-koru-primary shadow-koru-xs" : "text-koru-on-surface-variant hover:text-koru-on-surface",
                                        )}
                                    >
                                        <Icon size={12} aria-hidden="true" /> {text}
                                    </button>
                                ))}
                            </span>
                        ) : null}
                        {isStaff && marked && blockId && !onTab ? (
                            <Button variant="text" size="sm" startIcon={<BarChart3 size={13} />} onClick={() => setShowResults(true)}>Results</Button>
                        ) : null}
                    </span>
                </div>
                <div className="flex flex-col gap-4 p-4 md:p-5">{children}</div>
            </Card>
            {showResults ? <ResultsDialog blockId={blockId} onClose={() => setShowResults(false)} /> : null}
        </NodeViewWrapper>
    );
}
