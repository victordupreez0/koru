import React, { useContext, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { getBlockResults } from "../../../services/attemptService";
import { Alert, Avatar, Badge, Card, EmptyState, Modal, Skeleton } from "../../UI";
import { KoruBarList } from "../../UI/charts/KoruCharts";
import { koruChartColors } from "../../UI/charts/koruChartTheme";
import { PageBlockContext } from "../PageBlockContext";

const POLL_MS = 4000;

/** Who has tried this activity. Refreshes while it's open, so new attempts appear by themselves. */
export default function ResultsDialog({ blockId, onClose }) {
    const { pageId } = useContext(PageBlockContext);
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        const load = () =>
            getBlockResults(pageId, blockId, user.userId).then(
                (r) => { if (alive) { setData(r); setError(""); } },
                (e) => { if (alive) setError(e.message); },
            );
        load();
        const timer = setInterval(load, POLL_MS);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [pageId, blockId, user.userId]);

    return (
        <Modal open onClose={onClose} title="Results" description="Updates on its own as students submit." size="lg">
            {error ? <Alert variant="error">{error}</Alert> : null}
            {!data && !error ? <Skeleton className="h-40 w-full" /> : null}
            {data ? (
                <div className="flex flex-col gap-4">
                    <KoruBarList
                        items={[
                            { label: "Passed", value: data.passed, color: koruChartColors.success },
                            { label: "Still trying", value: data.attempted - data.passed, color: koruChartColors.warning },
                            { label: "Not tried", value: Math.max(0, data.enrolled - data.attempted), color: koruChartColors.outlineVariant },
                        ]}
                    />
                    {data.students.length === 0 ? (
                        <EmptyState icon={<ClipboardList size={24} aria-hidden="true" />} title="No attempts yet" description="Results will appear here as soon as a student submits." size="sm" />
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {data.students.map((s) => (
                                <li key={s.id}>
                                    <Card variant="outlined" tone="surface" radius="md" padding="sm" className="flex items-center gap-3">
                                        <Avatar user={s} size="sm" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-koru-label text-koru-on-surface">{s.firstName} {s.lastName}</span>
                                            <span className="block text-koru-caption text-koru-on-surface-variant">
                                                {s.attempts} {s.attempts === 1 ? "try" : "tries"} · best {s.bestScore}/{s.maxScore}
                                            </span>
                                        </span>
                                        <Badge variant={s.passed ? "success" : "warning"} dot>{s.passed ? "Passed" : "Not yet"}</Badge>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </Modal>
    );
}
