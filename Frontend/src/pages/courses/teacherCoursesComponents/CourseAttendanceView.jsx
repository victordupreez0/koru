import React, { useState, useEffect, useMemo } from "react";
import { Folder, Filter } from "@solar-icons/react";
import { X, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AttendanceChart from "../../../components/UI/attendanceChart";
import { getCourseAttendance, updateAttendanceRecord } from "../../../services/attendanceService";
import { getCourseCohorts, getCourseStudents } from "../../../services/classGroupService";
import CohortFilterBar from "../../../components/CohortFilterBar";
import { staggerContainer, slideUp, scaleIn } from "./constants";
import Avatar from "../../../components/UI/Avatar";
import { Badge, Button, Input } from "../../../components/UI";

function downloadAttendanceCSV(studentStats, courseName) {
    const header = ["Student Name", "Email", "Sessions Present", "Total Sessions", "Attendance Rate (%)", "Status"];
    const rows = studentStats.map(s => {
        const rate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
        const status = rate > 85 ? "Excellent" : rate > 75 ? "Good" : rate > 65 ? "At Risk" : "Critical";
        return [s.name, s.email || "—", s.present, s.total, rate, status];
    });
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

function formatSessionDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function CourseAttendanceView({ activeCourseId, subject }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Cohort filter state
    const [cohorts, setCohorts] = useState([]);
    const [studentCohortMap, setStudentCohortMap] = useState({});
    const [selectedCohortId, setSelectedCohortId] = useState(null);

    // Filter/search state
    const [showFilter, setShowFilter] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const handleUpdateStatus = async (recordId, newStatus) => {
        await updateAttendanceRecord(recordId, newStatus);
        setRecords(prev => prev.map(rec => rec.id === recordId ? { ...rec, status: newStatus } : rec));
    };

    useEffect(() => {
        if (!activeCourseId) return;
        let mounted = true;
        setLoading(true);
        setSelectedCohortId(null);
        setSelectedStudent(null);
        Promise.all([
            getCourseAttendance(activeCourseId),
            getCourseCohorts(activeCourseId).catch(() => []),
            getCourseStudents(activeCourseId).catch(() => []),
        ]).then(([attendanceData, cohortData, studentData]) => {
            if (!mounted) return;
            setRecords(attendanceData);
            setCohorts(cohortData || []);
            const map = {};
            (studentData || []).forEach(s => { map[s.studentId] = s.classGroupId; });
            setStudentCohortMap(map);
        }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [activeCourseId]);

    // Filter records by selected cohort
    const filteredRecords = selectedCohortId
        ? records.filter(r => studentCohortMap[r.studentId] === selectedCohortId)
        : records;

    // Class-level aggregate
    const total    = filteredRecords.length;
    const attended = filteredRecords.filter(r => r.status !== "Absent").length;
    const missed   = filteredRecords.filter(r => r.status === "Absent").length;

    // Unique session count (by date string)
    const totalSessions = new Set(filteredRecords.map(r => r.date?.split("T")[0])).size;

    // Per-student aggregation
    const studentStats = useMemo(() => {
        const map = {};
        filteredRecords.forEach(r => {
            if (!r.student) return;
            if (!map[r.studentId]) {
                map[r.studentId] = {
                    id:      r.studentId,
                    name:    `${r.student.firstName} ${r.student.lastName}`,
                    email:   r.student.email,
                    profileImageUrl: r.student.profileImageUrl,
                    avatar:  `${r.student.firstName[0]}${r.student.lastName[0]}`,
                    present: 0,
                    total:   0,
                };
            }
            map[r.studentId].total++;
            if (r.status !== "Absent") map[r.studentId].present++;
        });
        return Object.values(map);
    }, [filteredRecords]);

    const filteredStudentStats = useMemo(() => {
        return studentStats.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
            const rate = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
            const status = rate > 85 ? "Excellent" : rate > 75 ? "Good" : rate > 65 ? "At Risk" : "Critical";
            const matchesStatus = statusFilter === "All" || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [studentStats, searchQuery, statusFilter]);

    const overallRate = total > 0 ? Math.round((attended / total) * 100) : 0;
    const onTrack     = studentStats.filter(s => s.total > 0 && Math.round((s.present / s.total) * 100) >= 80).length;
    const atRisk      = studentStats.length - onTrack;
    const topAttendees = [...studentStats]
        .sort((a, b) => (b.present / (b.total || 1)) - (a.present / (a.total || 1)))
        .slice(0, 10);

    // Per-student session breakdown for the inline panel
    const studentRecords = useMemo(() => {
        if (!selectedStudent) return [];
        return records
            .filter(r => r.studentId === selectedStudent.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [selectedStudent, records]);

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="font-display text-koru-title text-koru-on-surface">Attendance & Presence</h1>
                    <p className="text-koru-on-surface-variant mt-2">Academic Presence Analytics</p>
                    <div className="mt-3">
                        <CohortFilterBar cohorts={cohorts} selected={selectedCohortId} onChange={setSelectedCohortId} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outlined" startIcon={<Folder size={18} />} onClick={() => downloadAttendanceCSV(filteredStudentStats, subject?.name || subject?.code || activeCourseId)}>Export Log</Button>
                    <Button>Take Attendance</Button>
                </div>
            </motion.header>

            {/* KPI summary row */}
            <motion.div variants={slideUp} className="flex flex-row mb-6 divide-x divide-koru-outline-variant">
                {[
                    {
                        label: "Overall Rate",
                        value: `${overallRate}%`,
                        sub: `${totalSessions} session${totalSessions !== 1 ? "s" : ""} recorded`,
                    },
                    {
                        label: "On Track",
                        value: `${onTrack}`,
                        sub: `of ${studentStats.length} students · ≥80% threshold`,
                    },
                    {
                        label: "At Risk",
                        value: `${atRisk}`,
                        sub: `student${atRisk !== 1 ? "s" : ""} below 80%`,
                    },
                    {
                        label: "Total Students",
                        value: `${studentStats.length}`,
                        sub: `enrolled in course`,
                    },
                ].map((kpi, i) => (
                    <div key={i} className={`flex flex-col gap-1 py-1 flex-1 ${i === 0 ? "pr-6" : "px-6"}`}>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-koru-on-surface-variant">{kpi.label}</p>
                        <p className="text-2xl font-medium leading-none text-koru-on-surface">{kpi.value}</p>
                        <p className="text-xs text-koru-on-surface-variant truncate mt-0.5">{kpi.sub}</p>
                    </div>
                ))}
            </motion.div>

            {/* Chart + leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                {/* Attendance chart */}
                <motion.div variants={scaleIn} className="lg:col-span-2 rounded-koru-md bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6 flex flex-col">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h3 className="font-display text-koru-heading text-koru-on-surface">Class Attendance Overview</h3>
                            <p className="text-xs text-koru-on-surface-variant mt-0.5">{subject?.code || "Course"} · {totalSessions} sessions recorded</p>
                        </div>
                        <Badge variant="primary" className="shrink-0">Target 80%</Badge>
                    </div>
                    <div className="flex-1 min-h-[220px]">
                        <AttendanceChart
                            attended={attended}
                            total={total || 1}
                            missed={missed}
                            centerLabel="Attendance Rate"
                            leftStat="Students"
                            midStat="Present"
                            rightStat="Absent"
                            leftValue={studentStats.length}
                            midValue={attended}
                            rightValue={missed}
                        />
                    </div>
                </motion.div>

                {/* Top attendees leaderboard */}
                <motion.div variants={scaleIn} className="rounded-koru-md bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6 flex flex-col">
                    <div className="mb-5">
                        <h3 className="font-display text-koru-heading text-koru-on-surface">Top Attendance</h3>
                        <p className="text-xs text-koru-on-surface-variant mt-0.5">Ranked by attendance rate</p>
                    </div>
                    {topAttendees.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-koru-on-surface-variant">No data yet</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 space-y-3">
                            {topAttendees.map((s, i) => {
                                const rate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
                                return (
                                    <div key={s.id} className="flex items-center gap-3">
                                        <span className={`w-5 text-[11px] font-medium text-right shrink-0 ${
                                            i === 0 ? "text-koru-warning" : i === 1 ? "text-koru-on-surface-variant" : i === 2 ? "text-koru-accent-ink" : "text-koru-outline"
                                        }`}>{i + 1}</span>
                                        <Avatar user={s} name={s.name} size={28} />
                                        <span className="flex-1 text-xs font-medium text-koru-on-surface truncate">{s.name}</span>
                                        <span className={`text-xs font-medium tabular-nums shrink-0 ${
                                            rate >= 90 ? "text-koru-success" : rate >= 80 ? "text-koru-primary" : "text-koru-accent-ink"
                                        }`}>{rate}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Students section — inline split layout */}
            <motion.div variants={slideUp} className="flex flex-row gap-5 items-start mb-8">

                {/* Left: students table — shrinks when panel is open */}
                <div className={`rounded-koru-lg bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden transition-all duration-300 motion-reduce:transition-none min-w-0 ${
                    selectedStudent ? "w-[44%] shrink-0" : "w-full"
                }`}>
                    <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
                        <h2 className="font-display text-koru-heading text-koru-on-surface">Students Attendance</h2>
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            aria-label="Toggle filters"
 aria-pressed={showFilter}
 className={`p-2.5 rounded-koru-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${showFilter ? "text-koru-primary bg-koru-primary-container" : "text-koru-on-surface-variant bg-koru-surface-container hover:bg-koru-surface-container-high"}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilter && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-6 py-4 border-b border-koru-outline-faint bg-koru-surface-container-low flex flex-col sm:flex-row gap-3 items-center overflow-hidden"
                            >
                                <Input
    type="text"
    size="sm"
    aria-label="Search by student name"
    placeholder="Search by student name..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    containerClassName="flex-1 w-full"
    startIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    }
    endAdornment={searchQuery ? (
        <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery("")}
            className="text-koru-on-surface-variant hover:text-koru-on-surface cursor-pointer rounded-koru-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
        >
            <X size={14} />
        </button>
    ) : null}
/>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                                    {["All", "Excellent", "Good", "At Risk", "Critical"].map((status) => (
                                        <Button
    key={status}
    size="sm"
    variant={statusFilter === status ? "filled" : "tonal"}
    onClick={() => setStatusFilter(status)}
>
    {status}
</Button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div className="animate-pulse">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-koru-outline-faint bg-koru-surface-container-low">
                                        <th className="px-5 py-4"><div className="h-2.5 rounded-koru-pill bg-koru-surface-container-highest w-16" /></th>
                                        <th className="px-4 py-4 text-center"><div className="h-2.5 rounded-koru-pill bg-koru-surface-container-highest w-10 mx-auto" /></th>
                                        <th className="px-4 py-4"><div className="h-2.5 rounded-koru-pill bg-koru-surface-container-highest w-14" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="border-b border-koru-outline-faint">
                                            <td className="py-3 pl-5 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-koru-pill bg-koru-surface-container shrink-0" />
                                                    <div className="flex flex-col gap-2">
                                                        <div className="h-3.5 rounded-koru-pill bg-koru-surface-container-highest" style={{ width: `${65 + (i * 19) % 45}px` }} />
                                                        <div className="h-2.5 rounded-koru-pill bg-koru-surface-container w-28" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="h-5 rounded-koru-pill bg-koru-surface-container w-10 mx-auto" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="h-5 rounded-koru-pill bg-koru-surface-container w-16" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : studentStats.length === 0 ? (
                        <div className="px-8 py-12 text-center text-koru-on-surface-variant text-sm">No attendance records yet.</div>
                    ) : filteredStudentStats.length === 0 ? (
                        <div className="px-8 py-12 text-center text-koru-on-surface-variant text-sm">No students match your filter criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-koru-outline-faint bg-koru-surface-container-low">
                                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-koru-on-surface-variant">Student</th>
                                    <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-koru-on-surface-variant text-center">Rate</th>
                                    {!selectedStudent && <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-koru-on-surface-variant">Status</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudentStats.map(student => {
                                    const rate = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
                                    const isActive = selectedStudent?.id === student.id;
                                    return (
                                        <tr
                                            key={student.id}
                                            onClick={() => setSelectedStudent(isActive ? null : student)}
                                            className={`border-b border-koru-outline-faint last:border-0 transition-all cursor-pointer group ${
                                                isActive ? "bg-koru-primary-subtle" : "hover:bg-koru-surface-container-low"
                                            }`}
                                        >
                                            <td className={`py-3 pl-5 pr-3 ${isActive ? "border-l-2 border-koru-primary" : ""}`}>
                                                <div className="flex items-center gap-3">
                                                    <Avatar user={student} name={student.name} size={32} />
                                                    <div className="min-w-0">
                                                        <div className={`font-medium text-sm truncate transition-colors ${
                                                            isActive ? "text-koru-primary" : "text-koru-on-surface group-hover:text-koru-primary"
                                                        }`}>{student.name}</div>
                                                        {!selectedStudent && (
                                                            <div className="text-xs text-koru-on-surface-variant mt-0.5 truncate">{student.email}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-koru-heading font-medium italic text-koru-on-surface">{rate}%</span>
                                            </td>
                                            {!selectedStudent && (
                                                <td className="px-4 py-3">
                                                    <Badge variant={rate > 85 ? "success" : rate > 75 ? "info" : rate > 65 ? "warning" : "error"}>
                                                        {rate > 85 ? "Excellent" : rate > 75 ? "Good" : rate > 65 ? "At Risk" : "Critical"}
                                                    </Badge>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Right: session breakdown panel — slides in as flex sibling */}
                <AnimatePresence mode="wait">
                    {selectedStudent && (
                        <motion.div
                            key="attendance-panel"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, transition: { duration: 0.15, ease: "easeIn" } }}
                            transition={{ type: "spring", damping: 30, stiffness: 250 }}
                            className="flex-1 min-w-0 rounded-koru-lg bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden flex flex-col"
                            style={{ maxHeight: "75vh" }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-koru-outline-faint shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar user={selectedStudent} name={selectedStudent.name} size={36} />
                                    <div className="min-w-0">
                                        <h2 className="font-display text-sm text-koru-on-surface leading-tight truncate">{selectedStudent.name}</h2>
                                        <p className="text-xs text-koru-on-surface-variant mt-0.5 truncate">{selectedStudent.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="w-7 h-7 rounded-koru-pill flex items-center justify-center text-koru-on-surface-variant hover:text-koru-on-surface hover:bg-koru-surface-container-high transition-colors cursor-pointer shrink-0 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                    aria-label="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Attendance summary */}
                            <div className="px-5 pt-4 pb-4 border-b border-koru-outline-faint shrink-0">
                                {(() => {
                                    const rate = selectedStudent.total > 0 ? Math.round((selectedStudent.present / selectedStudent.total) * 100) : 0;
                                    const absent = selectedStudent.total - selectedStudent.present;
                                    return (
                                        <>
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className="flex flex-col items-center bg-koru-surface-container rounded-koru-md py-3">
                                                    <span className="text-xl font-medium text-koru-on-surface">{rate}%</span>
                                                    <span className="text-[10px] text-koru-on-surface-variant font-medium mt-0.5">Rate</span>
                                                </div>
                                                <div className="flex flex-col items-center bg-koru-surface-container rounded-koru-md py-3">
                                                    <span className="text-xl font-medium text-koru-on-surface">{selectedStudent.present}</span>
                                                    <span className="text-[10px] text-koru-on-surface-variant font-medium mt-0.5">Present</span>
                                                </div>
                                                <div className="flex flex-col items-center bg-koru-surface-container rounded-koru-md py-3">
                                                    <span className="text-xl font-medium text-koru-on-surface">{absent}</span>
                                                    <span className="text-[10px] text-koru-on-surface-variant font-medium mt-0.5">Absent</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-koru-surface-container rounded-koru-pill overflow-hidden">
                                                <div
                                                    className="h-full rounded-koru-pill transition-all duration-500"
                                                    style={{
                                                        width: `${rate}%`,
                                                        background: rate >= 80 ? "var(--color-koru-success)" : rate >= 65 ? "var(--color-koru-accent)" : "var(--color-koru-error)"
                                                    }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-koru-on-surface-variant mt-1.5">{selectedStudent.present} of {selectedStudent.total} sessions attended</p>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Session list — scrollable */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                <p className="text-[10px] font-medium uppercase tracking-widest text-koru-on-surface-variant mb-3">Session History</p>
                                {studentRecords.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Calendar size={28} className="text-koru-outline mb-2" />
                                        <p className="text-sm font-medium text-koru-on-surface-variant">No sessions found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {studentRecords.map((rec, idx) => {
                                            const isPresent = rec.status !== "Absent";
                                            const isLate = rec.status === "Late";
                                            return (
                                                <motion.div
                                                    key={rec.id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                                                    className="bg-koru-surface-container-lowest border border-koru-outline-faint rounded-koru-sm px-3.5 py-3 flex items-center gap-3 hover:bg-koru-surface-container-low transition-colors"
                                                >
                                                    <div className={`w-6 h-6 rounded-koru-xs flex items-center justify-center shrink-0 ${
                                                        isLate ? "bg-koru-warning-soft" : isPresent ? "bg-koru-success-soft" : "bg-koru-error-container"
                                                    }`}>
                                                        {isLate
                                                            ? <Clock size={11} className="text-koru-warning" />
                                                            : isPresent
                                                                ? <CheckCircle2 size={11} className="text-koru-success" />
                                                                : <XCircle size={11} className="text-koru-error" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-koru-on-surface leading-tight">
                                                            {formatSessionDate(rec.date)}
                                                        </p>
                                                        {rec.sessionType && (
                                                            <p className="text-[10px] text-koru-on-surface-variant mt-0.5">{rec.sessionType}</p>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium uppercase tracking-wider shrink-0 ${
                                                        isLate ? "text-koru-warning" : isPresent ? "text-koru-success" : "text-koru-error"
                                                    }`}>
                                                        {rec.status}
                                                    </span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 border-t border-koru-outline-faint shrink-0">
                                <p className="text-[10px] text-koru-on-surface-variant text-center">Rate = Sessions attended ÷ Total sessions × 100</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
