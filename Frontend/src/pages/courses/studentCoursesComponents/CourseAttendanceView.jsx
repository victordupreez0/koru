import React from "react";
import { Calendar, CheckCircle, CloseCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import AttendanceChart from "../../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../../components/UI/attendanceVisualizer";
// TODO: backend endpoint missing — no AttendanceController exists yet. Mock data from constants.
import { ATTENDANCE_LOGS, staggerContainer, slideUp, scaleIn } from "./constants";

export default function CourseAttendanceView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
                <p className="text-gray-500 mt-2">UX300 | Academic Presence Tracking</p>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <AttendanceChart attended={38} total={42} missed={4} />
                </motion.div>
                <motion.div variants={scaleIn}>
                    <AttendanceVisualizer />
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Session History</h2>
                    <button className="text-sm font-semibold text-[#3C0078] hover:underline flex items-center gap-2"><Calendar size={18} /> Download Report</button>
                </div>
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
                        {ATTENDANCE_LOGS.map((log, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-6 text-sm font-bold text-gray-900">{log.date}</td>
                                <td className="px-8 py-6 text-sm text-gray-600">{log.type}</td>
                                <td className="px-8 py-6 text-sm text-gray-400">{log.time}</td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${log.status === 'Present' ? 'text-green-600' : 'text-orange-600'}`}>{log.status}</span>
                                        {log.status === 'Present' ? <CheckCircle className="text-green-600" size={18} /> : <CloseCircle className="text-orange-600" size={18} />}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
}
