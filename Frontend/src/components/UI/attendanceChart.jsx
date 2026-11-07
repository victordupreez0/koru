import React from "react";
import { motion } from "framer-motion";
import Badge from "./Badge";
import Card from "./Card";

/**
 * AttendanceChart Component
 * 
 * A visually engaging, modern attendance tracker that uses a segmented ring 
 * to show attendance ratios and small floating indicators for stats.
 */
export default function AttendanceChart({ attended = 38, total = 42, missed = 4, centerLabel = "Attendance", leftStat = "Total", midStat = "Attended", rightStat = "Missed", leftValue, midValue, rightValue }) {
    const percentage = Math.round((attended / total) * 100);
    
    // SVG Circle Math
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <Card
            variant="outlined"
            tone="surface"
            padding="xl"
            radius="3xl"
            className="group relative flex flex-col items-center justify-center"
        >
            {/* Main Ring Chart */}
            <div className="relative w-64 h-64 flex items-center justify-center animate-in fade-in zoom-in duration-700">
                <svg className="w-full h-full -rotate-90 transform">
                    {/* Background Track */}
                    <circle
                        cx="128"
                        cy="128"
                        r={radius}
                        fill="transparent"
                        strokeWidth="16"
                        className="stroke-koru-surface-container-highest"
                    />
                    {/* Progress Fill */}
                    <motion.circle
                        cx="128"
                        cy="128"
                        r={radius}
                        fill="transparent"
                        className="stroke-koru-primary"
                        strokeWidth="16"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="font-display text-6xl font-medium tracking-tight text-koru-primary"
                    >
                        {percentage}%
                    </motion.span>
                    <span className="mt-1 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{centerLabel}</span>
                </div>
            </div>

            {/* Floating Stats Layout */}
            <div className="grid grid-cols-3 gap-8 w-full mt-8 border-t border-koru-outline-faint pt-8">
                <div className="flex flex-col items-center">
                    <span className="mb-1 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{leftStat}</span>
                    <span className="font-display text-xl font-medium text-koru-on-surface">{leftValue ?? total}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="mb-1 text-koru-caption font-medium uppercase tracking-widest text-koru-info">{midStat}</span>
                    <span className="font-display text-xl font-medium text-koru-on-surface">{midValue ?? attended}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="mb-1 text-koru-caption font-medium uppercase tracking-widest text-koru-accent-ink">{rightStat}</span>
                    <span className="font-display text-xl font-medium text-koru-on-surface">{rightValue ?? missed}</span>
                </div>
            </div>

            {/* Micro-Interaction Indicator: "On Track" */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 right-8"
            >
                <Badge variant="success" dot className="uppercase tracking-widest">On Track</Badge>
            </motion.div>
        </Card>
    );
}
