import React from "react";
import { Folder, CheckCircle } from "lucide-react";
import { InfoCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import AttendanceChart from "../../../components/UI/attendanceChart";
import { staggerContainer, slideUp, scaleIn, STUDENT_GRADES_DATA } from "./constants";

export function CourseGradesView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Grades & Performance</h1>
                    <p className="text-gray-500 mt-2">UX300 | Class Performance Analytics</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Export CSV
                    </button>
                </div>
            </motion.header>

            {/* Grades Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-stretch">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Class Average Distribution</h3>
                                <p className="text-sm text-gray-400">Total Assignments | UX300</p>
                            </div>
                            <div className="bg-[#3C0078]/5 px-4 py-2 rounded-2xl">
                                <span className="text-[#3C0078] font-bold text-sm">Target: 75%</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            {/* Reusing chart logic but focused on grades */}
                            <AttendanceChart attended={78} total={100} missed={22} label="Grade Distribution" />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-[40px] p-8 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Class Average</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">78.4%</span>
                            <span className="text-sm opacity-60">Avg</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>12 students above target</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex-1 group hover:border-[#3C0078]/20 transition-all">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block mb-6">Highest Performance</span>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black italic text-xl shadow-inner">
                                A+
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic text-gray-900 leading-none">94.2%</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Emma Watson</p>
                            </div>
                        </div>
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
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Attendance</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Avg Grade</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STUDENT_GRADES_DATA.map((student) => (
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
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-base font-bold text-gray-900">{student.attendance}</span>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    parseInt(student.attendance) > 80 ? 'bg-green-500' : 
                                                    parseInt(student.attendance) > 70 ? 'bg-orange-400' : 'bg-red-500'
                                                }`}
                                                style={{ width: student.attendance }}
                                            ></div>
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
