import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card";

const FALLBACK = [
    { status: "Present", date: "2026-01-01" }, { status: "Present", date: "2026-01-08" },
    { status: "Absent",  date: "2026-01-15" }, { status: "Present", date: "2026-01-22" },
    { status: "Present", date: "2026-01-29" }, { status: "Present", date: "2026-02-05" },
    { status: "Present", date: "2026-02-12" }, { status: "Absent",  date: "2026-02-19" },
    { status: "Present", date: "2026-02-26" }, { status: "Present", date: "2026-03-05" },
];

function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: "short", day: "numeric", month: "short"
        });
    } catch { return ""; }
}

export default function AttendanceVisualizer({ sessions }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const raw = sessions && sessions.length > 0 ? sessions : FALLBACK;
    const sorted = [...raw].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last10 = sorted.slice(-10).map(r => ({
        status: r.status === "Absent" ? "Absent" : "Present",
        date: r.date,
    }));

    const isPresent = (item) => item.status === "Present";

    return (
        <Card
            variant="outlined"
            tone="surface"
            padding="xl"
            radius="3xl"
            className="flex h-full flex-col items-center justify-between"
        >
            <div className="w-full mb-6">
                <h3 className="font-display text-koru-label font-medium uppercase tracking-widest text-koru-on-surface-variant">Streak Analysis</h3>
                <p className="mt-1 text-koru-caption text-koru-on-surface-variant">Last {last10.length} sessions</p>
            </div>

            {/* Bars */}
            <div className="flex gap-2.5 items-end justify-center h-32 w-full relative">
                {last10.map((item, index) => {
                    const present = isPresent(item);
                    const color = present ? "var(--color-koru-primary)" : "var(--color-koru-accent)";
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                            key={index}
                            className="relative flex-1 flex flex-col items-center"
                            style={{ height: "100%" }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Tooltip */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.92 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                                    >
                                        <div
                                            className="px-3 py-2 rounded-koru-md shadow-koru-md text-center whitespace-nowrap"
                                            style={{ backgroundColor: color }}
                                        >
                                            <p className="text-koru-caption font-medium text-white uppercase tracking-wider">{item.status}</p>
                                            <p className="text-koru-caption text-white/80 mt-0.5">{formatDate(item.date)}</p>
                                            {/* Arrow */}
                                            <div
                                                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-1.5"
                                                style={{
                                                    borderLeft: "6px solid transparent",
                                                    borderRight: "6px solid transparent",
                                                    borderTop: `6px solid ${color}`,
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{
                                    height: "100%",
                                    opacity: isHovered ? 1 : 0.35,
                                    scaleX: isHovered ? 1.25 : 1,
                                }}
                                transition={
                                    hoveredIndex === null || isHovered
                                        ? { height: { delay: index * 0.1, type: "spring", stiffness: 100 }, opacity: { duration: 0.15 }, scaleX: { duration: 0.15 } }
                                        : { opacity: { duration: 0.15 }, scaleX: { duration: 0.15 } }
                                }
                                className="w-full rounded-full cursor-pointer origin-bottom"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-between w-full border-t border-koru-outline-faint pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-koru-primary" />
                    <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-koru-accent" />
                    <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Absent</span>
                </div>
            </div>
        </Card>
    );
}
