import React from "react";
import { motion } from "framer-motion";
import { useDarkMode } from "../../hooks/useDarkMode";

/**
 * AttendanceVisualizer Component
 * 
 * An interactive, abstract representation of attendance history (last 10 sessions)
 * using colored nodes that expand to show details.
 */
export default function AttendanceVisualizer() {
    const isDark = useDarkMode();
    const presentColor = isDark ? "#9BE9EA" : "#3C0078";
    const presentAlpha = isDark ? "#9BE9EA33" : "#3C007833";
    const data = [
        { status: "Present", color: "#3C0078" },
        { status: "Present", color: "#3C0078" },
        { status: "Absent", color: "#FF8731" },
        { status: "Present", color: "#3C0078" },
        { status: "Present", color: "#3C0078" },
        { status: "Present", color: "#3C0078" },
        { status: "Present", color: "#3C0078" },
        { status: "Absent", color: "#FF8731" },
        { status: "Present", color: "#3C0078" },
        { status: "Present", color: "#3C0078" },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col h-full items-center justify-between group">
            <div className="w-full mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Streak Analysis</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">Last 10 sessions performance</p>
            </div>

            <div className="flex gap-2.5 items-end justify-center h-32 w-full">
                {data.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: item.status === "Present" ? "100%" : "40%" }}
                        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ scale: 1.1, backgroundColor: item.status === "Present" ? presentColor : "#FF8731" }}
                        className="w-4 rounded-full transition-colors cursor-pointer"
                        style={{ backgroundColor: item.status === "Present" ? presentAlpha : "#FF873133" }}
                    />
                ))}
            </div>

            <div className="mt-8 flex justify-between w-full border-t border-gray-50 dark:border-slate-700 pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3C0078] dark:bg-[#9BE9EA]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-slate-400">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF8731]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-slate-400">Absent</span>
                </div>
            </div>
        </div>
    );
}
