import React, { useState, useEffect } from "react";
import { Folder, CheckCircle, Filter } from "@solar-icons/react";
import { motion } from "framer-motion";
import AttendanceChart from "../../../components/UI/attendanceChart";
import { getCourseAttendance, updateAttendanceRecord } from "../../../services/attendanceService";
import { getCourseCohorts, getCourseStudents } from "../../../services/classGroupService";
import StudentAttendanceDetailModal from "../../../components/StudentAttendanceDetailModal";
import CohortFilterBar from "../../../components/CohortFilterBar";
import { staggerContainer, slideUp, scaleIn } from "./constants";

export function CourseAttendanceView({ activeCourseId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Cohort filter state
    const [cohorts, setCohorts] = useState([]);
    const [studentCohortMap, setStudentCohortMap] = useState({});
    const [selectedCohortId, setSelectedCohortId] = useState(null);

    const handleUpdateStatus = async (recordId, newStatus) => {
        await updateAttendanceRecord(recordId, newStatus);
        setRecords(prev => prev.map(rec => rec.id === recordId ? { ...rec, status: newStatus } : rec));
    };

    useEffect(() => {
        if (!activeCourseId) return;
        let mounted = true;
        setLoading(true);
        setSelectedCohortId(null);
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
    const total   = filteredRecords.length;
    const attended = filteredRecords.filter(r => r.status !== "Absent").length;
    const missed   = filteredRecords.filter(r => r.status === "Absent").length;

    // Unique session count (by date string)
    const totalSessions = new Set(filteredRecords.map(r => r.date?.split("T")[0])).size;

    // Per-student aggregation
    const studentMap = {};
    filteredRecords.forEach(r => {
        if (!r.student) return;
        if (!studentMap[r.studentId]) {
            studentMap[r.studentId] = {
                id:      r.studentId,
                name:    `${r.student.firstName} ${r.student.lastName}`,
                email:   r.student.email,
                avatar:  `${r.student.firstName[0]}${r.student.lastName[0]}`,
                present: 0,
                total:   0,
            };
        }
        studentMap[r.studentId].total++;
        if (r.status !== "Absent") studentMap[r.studentId].present++;
    });
    const studentStats = Object.values(studentMap);

    const overallRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Attendance & Presence</h1>
                    <p className="text-gray-500 mt-2">Academic Presence Analytics</p>
                    <div className="mt-3">
                        <CohortFilterBar cohorts={cohorts} selected={selectedCohortId} onChange={setSelectedCohortId} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Export Log
                    </button>
                    <button className="px-6 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-semibold shadow-lg shadow-[#3C0078]/20 hover:bg-[#2A0054] transition-all">
                        Take Attendance
                    </button>
                </div>
            </motion.header>

            {/* Attendance Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Class Attendance Overview</h3>
                                <p className="text-sm text-gray-400">Semester 1 · {totalSessions} sessions recorded</p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            <AttendanceChart attended={attended} total={total || 1} missed={missed} />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-3xl p-6 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Overall Rate</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">{overallRate}%</span>
                            <span className="text-sm opacity-60">Avg</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>{overallRate >= 80 ? "On track with semester goal" : "Below 80% threshold"}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex-1 group hover:border-[#3C0078]/20 transition-all cursor-pointer">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Class Engagement</span>
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-end justify-between gap-1 h-16">
                                {[30, 80, 45, 95, 60, 40, 85].map((h, i) => (
                                    <div
                                        key={i}
                                        className={`w-full rounded-t-lg transition-all duration-500 bg-gray-100 group-hover:bg-[#3C0078]/10 ${i === 3 ? "bg-[#3C0078]" : ""}`}
                                        style={{ height: `${h}%` }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3C0078]">Total Sessions</p>
                                    <p className="text-xl font-black italic">{totalSessions}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Students</p>
                                    <p className="text-xl font-black italic">{studentStats.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Students Attendance</h2>
                    <div className="flex gap-2">
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100"><Filter size={20} /></button>
                    </div>
                </div>

                {loading ? (
                    <div className="px-10 py-12 text-center text-gray-400 text-sm">Loading attendance…</div>
                ) : studentStats.length === 0 ? (
                    <div className="px-10 py-12 text-center text-gray-400 text-sm">No attendance records yet.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Info</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Sessions Present</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Present Rate</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentStats.map(student => {
                                const rate = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
                                return (
                                    <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
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
                                            <span className="text-sm font-bold text-gray-900">{student.present}/{student.total} Sessions</span>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-base font-black italic text-gray-900">{rate}%</span>
                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            rate > 80 ? "bg-green-500" :
                                                            rate > 70 ? "bg-orange-400" : "bg-red-500"
                                                        }`}
                                                        style={{ width: `${rate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                rate > 85 ? "bg-green-100 text-green-700" :
                                                rate > 75 ? "bg-blue-50 text-blue-700" :
                                                rate > 65 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                            }`}>
                                                {rate > 85 ? "Excellent" : rate > 75 ? "Good" : rate > 65 ? "At Risk" : "Critical"}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedStudent(student)}
                                                className="px-5 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white group-hover:border-[#3C0078] transition-all whitespace-nowrap shadow-sm"
                                            >
                                                View Student
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </motion.div>

            <StudentAttendanceDetailModal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                student={selectedStudent}
                records={records}
                onUpdateStatus={handleUpdateStatus}
            />
        </motion.div>
    );
}
