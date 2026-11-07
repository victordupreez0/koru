import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, CloseCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import AttendanceChart from "../../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../../components/UI/attendanceVisualizer";
import { getCourseAttendance } from "../../../services/attendanceService";
import { Alert, Badge, Button, Card, EmptyState, Skeleton } from "../../../components/UI";
import { staggerContainer, slideUp, scaleIn } from "./constants";

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function downloadCSV(records, courseName) {
    const header = ["Date", "Session Type", "Time", "Status"];
    const rows = records.map(r => [
        formatDate(r.date),
        r.sessionType || "—",
        r.time || "—",
        r.status,
    ]);
    const csvContent = [header, ...rows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${(courseName || "report").toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function CourseAttendanceView({ activeCourseId, subject }) {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!activeCourseId || !user?.userId) return;
        let mounted = true;
        setLoading(true);
        setError(null);
        getCourseAttendance(activeCourseId)
            .then(data => {
                if (!mounted) return;
                setRecords(data.filter(r => r.studentId === user.userId));
            })
            .catch(err => { if (mounted) setError(err.message); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [activeCourseId, user?.userId]);

    const total = records.length;
    const attended = records.filter(r => r.status !== "Absent").length;
    const missed = records.filter(r => r.status === "Absent").length;

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6">
                <h1 className="font-display text-koru-title text-koru-on-surface">Attendance</h1>
                <p className="text-koru-body text-koru-on-surface-variant mt-2">Academic Presence Tracking</p>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <AttendanceChart attended={attended} total={total || 1} missed={missed} />
                </motion.div>
                <motion.div variants={scaleIn}>
                    <AttendanceVisualizer sessions={records} />
                </motion.div>
            </div>

            <motion.div variants={slideUp}>
              <Card variant="outlined" tone="surface" padding="none" radius="2xl" className="overflow-hidden">
                <div className="px-6 py-4 border-b border-koru-outline-faint flex justify-between items-center">
                    <h2 className="font-display text-koru-heading text-koru-on-surface">Session History</h2>
                    <Button
                        variant="text"
                        size="sm"
                        onClick={() => downloadCSV(records, subject?.name || subject?.code || activeCourseId)}
                        disabled={records.length === 0}
                        startIcon={<Download size={15} />}
                    >
                        Download Report
                    </Button>
                </div>

                {loading ? (
                    <div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-koru-surface-container-low">
                                    <th className="px-8 py-4"><Skeleton variant="text" className="w-10" /></th>
                                    <th className="px-8 py-4"><Skeleton variant="text" className="w-24" /></th>
                                    <th className="px-8 py-4"><Skeleton variant="text" className="w-10" /></th>
                                    <th className="px-8 py-4 text-right"><Skeleton variant="text" className="w-14 ml-auto" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-koru-outline-faint">
                                        <td className="px-8 py-6"><Skeleton variant="rect" className="h-4" width={`${60 + (i * 17) % 40}px`} /></td>
                                        <td className="px-8 py-6"><Skeleton variant="rect" className="h-4 w-20" /></td>
                                        <td className="px-8 py-6"><Skeleton variant="rect" className="h-4 w-16" /></td>
                                        <td className="px-8 py-6 text-right"><Skeleton variant="rect" className="h-5 w-16 ml-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : error ? (
                    <div className="p-6"><Alert variant="error">{error}</Alert></div>
                ) : records.length === 0 ? (
                    <EmptyState size="sm" title="No attendance records yet." />
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-koru-surface-container-low">
                                <th className="px-8 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Date</th>
                                <th className="px-8 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Session Type</th>
                                <th className="px-8 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Time</th>
                                <th className="px-8 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((log, i) => (
                                <tr key={i} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low transition-colors">
                                    <td className="px-8 py-6 text-sm font-medium text-koru-on-surface">{formatDate(log.date)}</td>
                                    <td className="px-8 py-6 text-sm text-koru-on-surface-variant">{log.sessionType}</td>
                                    <td className="px-8 py-6 text-sm text-koru-on-surface-variant">{log.time ?? "—"}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Badge variant={log.status === "Present" ? "success" : log.status === "Late" ? "warning" : "error"}>{log.status}</Badge>
                                            {log.status === "Present"
                                                ? <CheckCircle className="text-koru-success" size={18} />
                                                : <CloseCircle className="text-koru-error" size={18} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
              </Card>
            </motion.div>
        </motion.div>
    );
}
