import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Folder, InfoCircle, CheckCircle } from "@solar-icons/react";
import AttendanceChart from "../../../components/UI/attendanceChart";
import { getCourseGrades } from "../../../services/gradeService";
import { getCourseSubmissions } from "../../../services/submissionService";
import { staggerContainer, slideUp, scaleIn } from "./constants";

export function CourseGradesView({ activeCourseId, subject }) {
    const [grades, setGrades] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const [g, s] = await Promise.all([
                    getCourseGrades(activeCourseId).catch(() => []),
                    getCourseSubmissions(activeCourseId).catch(() => []),
                ]);
                if (mounted) {
                    setGrades(g || []);
                    setSubmissions(s || []);
                }
            } catch (err) {
                console.error("Failed to load course grades/submissions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId]);

    const studentRows = React.useMemo(() => {
        const map = {};
        submissions.forEach(s => {
            const student = s.student;
            if (!student) return;
            const sid = student.id;
            if (!map[sid]) {
                const name = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
                map[sid] = {
                    id: sid,
                    name,
                    email: student.email,
                    avatar: name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || "S",
                    totalEarned: 0,
                    totalMax: 0,
                };
            }
            const grade = grades.find(g => g.submissionId === s.id);
            if (grade && s.assignment) {
                map[sid].totalEarned += (grade.pointsEarned || 0);
                map[sid].totalMax += (s.assignment.maxPoints || 0);
            }
        });
        return Object.values(map).map(r => {
            const pct = r.totalMax > 0 ? Math.round((r.totalEarned / r.totalMax) * 100) : 0;
            return {
                ...r,
                avgGrade: `${pct}%`,
                avgGradePct: pct,
                status: pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "At Risk" : "Critical"
            };
        });
    }, [submissions, grades]);

    const classAvg = React.useMemo(() => {
        if (studentRows.length === 0) return 0;
        return Math.round(studentRows.reduce((s, r) => s + r.avgGradePct, 0) / studentRows.length);
    }, [studentRows]);

    const aboveTarget = studentRows.filter(r => r.avgGradePct >= 75).length;
    const belowTarget = studentRows.length - aboveTarget;
    const aboveTargetPct = studentRows.length > 0 ? Math.round((aboveTarget / studentRows.length) * 100) : 0;
    const topStudent = studentRows.length > 0 ? studentRows.reduce((a, b) => a.avgGradePct > b.avgGradePct ? a : b) : null;
    const lowestStudent = studentRows.length > 0 ? studentRows.reduce((a, b) => a.avgGradePct < b.avgGradePct ? a : b) : null;
    const topPerformers = [...studentRows].sort((a, b) => b.avgGradePct - a.avgGradePct).slice(0, 10);
    const gradeBreakdown = {
        A: studentRows.filter(r => r.avgGradePct >= 90).length,
        B: studentRows.filter(r => r.avgGradePct >= 80 && r.avgGradePct < 90).length,
        C: studentRows.filter(r => r.avgGradePct >= 70 && r.avgGradePct < 80).length,
        D: studentRows.filter(r => r.avgGradePct >= 60 && r.avgGradePct < 70).length,
        F: studentRows.filter(r => r.avgGradePct < 60).length,
    };

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Grades & Performance</h1>
                    <p className="text-gray-500 mt-2">{subject?.code || "Course"} | Class Performance Analytics</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Export CSV
                    </button>
                </div>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-stretch">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Class Average Distribution</h3>
                                <p className="text-sm text-gray-400">Total Assignments | {subject?.code || "Course"}</p>
                            </div>
                            <div className="bg-[#3C0078]/5 px-4 py-2 rounded-2xl">
                                <span className="text-[#3C0078] font-bold text-sm">Target: 75%</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            <AttendanceChart
                                attended={classAvg}
                                total={100}
                                missed={100 - classAvg}
                                centerLabel="Class Average"
                                leftStat="Students"
                                midStat="Above 75%"
                                rightStat="Below 75%"
                                leftValue={studentRows.length}
                                midValue={aboveTarget}
                                rightValue={belowTarget}
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-[40px] p-8 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Target Evaluation</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">{aboveTargetPct}%</span>
                            <span className="text-sm opacity-60">above target</span>
                        </div>
                        <div className="mt-5 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={14} className="text-green-400 shrink-0" />
                                <span>{aboveTarget} above target · {belowTarget} below</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm opacity-80">
                                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                                <span>Highest: {topStudent ? `${topStudent.avgGradePct}%` : "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm opacity-80">
                                <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                <span>Lowest: {lowestStudent ? `${lowestStudent.avgGradePct}%` : "—"}</span>
                            </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-5 gap-1">
                            {Object.entries(gradeBreakdown).map(([letter, count]) => (
                                <div key={letter} className="flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-black opacity-60">{letter}</span>
                                    <span className="text-base font-black">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-6 flex-1 flex flex-col overflow-hidden hover:border-[#3C0078]/20 transition-all">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block mb-4">Top 10 Performers</span>
                        {topPerformers.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center mt-4">No data yet</p>
                        ) : (
                            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                                {topPerformers.map((s, i) => (
                                    <div key={s.id} className="flex items-center gap-3">
                                        <span className={`w-4 text-[10px] font-black text-right shrink-0 ${
                                            i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"
                                        }`}>{i + 1}</span>
                                        <div className="w-7 h-7 rounded-full bg-[#3C0078]/10 flex items-center justify-center text-[9px] font-black text-[#3C0078] shrink-0">
                                            {s.avatar}
                                        </div>
                                        <span className="flex-1 text-xs font-semibold text-gray-800 truncate">{s.name}</span>
                                        <span className={`text-xs font-black shrink-0 ${
                                            s.avgGradePct >= 90 ? "text-green-600" : s.avgGradePct >= 75 ? "text-blue-600" : "text-orange-500"
                                        }`}>{s.avgGradePct}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-12">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Students List</h2>
                    <div className="flex gap-2">
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100"><InfoCircle size={20} /></button>
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/30">
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Student Info</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Avg Grade</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentRows.map((student) => (
                            <motion.tr key={student.id} variants={slideUp} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078] shadow-sm">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{student.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <span className="text-lg font-black italic text-gray-900">{student.avgGrade}</span>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                        student.status === "Excellent" ? "bg-green-100 text-green-700" :
                                        student.status === "Good" ? "bg-blue-50 text-blue-700" :
                                        student.status === "At Risk" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="px-5 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white group-hover:border-[#3C0078] transition-all whitespace-nowrap shadow-sm">
                                        View Student
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
}
