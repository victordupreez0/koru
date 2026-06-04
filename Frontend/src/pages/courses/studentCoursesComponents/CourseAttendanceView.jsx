import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, CloseCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext";
import AttendanceChart from "../../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../../components/UI/attendanceVisualizer";
import { getCourseAttendance } from "../../../services/attendanceService";
import { staggerContainer, slideUp, scaleIn } from "./constants";

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CourseAttendanceView({ activeCourseId }) {
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
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
                <p className="text-gray-500 mt-2">Academic Presence Tracking</p>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <AttendanceChart attended={attended} total={total || 1} missed={missed} />
                </motion.div>
                <motion.div variants={scaleIn}>
                    <AttendanceVisualizer sessions={records} />
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Session History</h2>
                    <button className="text-sm font-semibold text-[#3C0078] hover:underline flex items-center gap-2">
                        <Calendar size={18} /> Download Report
                    </button>
                </div>

                {loading ? (
                    <div className="px-8 py-12 text-center text-gray-400 text-sm">Loading attendance…</div>
                ) : error ? (
                    <div className="px-8 py-12 text-center text-red-400 text-sm">{error}</div>
                ) : records.length === 0 ? (
                    <div className="px-8 py-12 text-center text-gray-400 text-sm">No attendance records yet.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Session Type</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((log, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-6 text-sm font-bold text-gray-900">{formatDate(log.date)}</td>
                                    <td className="px-8 py-6 text-sm text-gray-600">{log.sessionType}</td>
                                    <td className="px-8 py-6 text-sm text-gray-400">{log.time ?? "—"}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-xs font-bold uppercase tracking-widest ${
                                                log.status === "Present" ? "text-green-600" :
                                                log.status === "Late"    ? "text-orange-400" : "text-orange-600"
                                            }`}>{log.status}</span>
                                            {log.status === "Present"
                                                ? <CheckCircle className="text-green-600" size={18} />
                                                : <CloseCircle className="text-orange-600" size={18} />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </motion.div>
    );
}
