import React from "react";
import { motion } from "framer-motion";
import { GRADES_DATA, staggerContainer, slideUp } from "./constants";

export default function CourseGradesView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Grades</h1>
                <p className="text-gray-500 mt-2">UX300 | Academic Performance Overview</p>
            </motion.header>
            <motion.div variants={slideUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Assignment Name</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Weight</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {GRADES_DATA.map((item) => (
                            <motion.tr key={item.id} variants={slideUp} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{item.date}</div>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-600">{item.weight}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.status === "Graded" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>{item.status}</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="text-lg font-semibold text-gray-900">{item.grade}</span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
            <motion.div variants={slideUp} className="mt-8 flex justify-end">
                <div className="bg-[#3C0078] text-white px-8 py-6 rounded-3xl shadow-lg shadow-[#3C0078]/20 flex items-center gap-12">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Course Progress</span>
                        <span className="text-sm font-medium">Completed: 60%</span>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Current Average</span>
                        <span className="text-2xl font-bold italic">82.4%</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
