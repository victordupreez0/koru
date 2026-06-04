import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveSession, openSession, getSessionStatus, closeSession } from "../services/checkInService";

export default function AttendanceManageModal({ courseId, teacherId, sessionType, courseName, onClose }) {
    const [session, setSession]   = useState(null);
    const [status, setStatus]     = useState(null);
    const [isOpen, setIsOpen]     = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError]       = useState(null);

    // On mount: check if a session is already active
    useEffect(() => {
        getActiveSession(courseId)
            .then(s => { if (s) { setSession(s); setIsOpen(true); } })
            .catch(() => {});
    }, [courseId]);

    // Poll roster every 5 s while open
    useEffect(() => {
        if (!isOpen || !session?.id) return;
        const poll = () => getSessionStatus(session.id).then(setStatus).catch(() => {});
        poll();
        const id = setInterval(poll, 5000);
        return () => clearInterval(id);
    }, [isOpen, session?.id]);

    const handleToggle = async () => {
        if (toggling) return;
        setToggling(true);
        setError(null);
        try {
            if (isOpen && session) {
                await closeSession(session.id);
                setIsOpen(false);
            } else {
                const s = await openSession(courseId, teacherId, sessionType);
                setSession(s);
                setStatus(null);
                setIsOpen(true);
            }
        } catch (e) {
            setError(e.message || "Something went wrong.");
        } finally {
            setToggling(false);
        }
    };

    const pct = status
        ? Math.round((status.checkedIn.length / Math.max(status.totalEnrolled, 1)) * 100)
        : 0;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-7 pt-7 pb-5 border-b border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3C0078] mb-1">
                        {sessionType} · {courseName}
                    </p>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900">Live Attendance</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500 text-sm font-bold"
                        >✕</button>
                    </div>
                </div>

                <div className="px-7 py-6 space-y-6">

                    {/* Toggle row */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
                        <div>
                            <p className="text-sm font-black text-gray-900">
                                {isOpen ? "Attendance is open" : "Attendance is closed"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {isOpen ? "Students can check in now" : "Toggle to let students check in"}
                            </p>
                        </div>

                        {/* Toggle switch — always clickable, just dims while API call is in-flight */}
                        <button
                            type="button"
                            onClick={handleToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                                toggling ? "opacity-60 cursor-wait" : "cursor-pointer"
                            } ${isOpen ? "bg-[#3C0078]" : "bg-gray-300"}`}
                        >
                            <motion.span
                                layout
                                animate={{ x: isOpen ? 29 : 3 }}
                                transition={{ type: "spring", stiffness: 600, damping: 35 }}
                                className="absolute top-[3px] block w-[22px] h-[22px] bg-white rounded-full shadow"
                            />
                        </button>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 text-center -mt-3">{error}</p>
                    )}

                    {/* Code block */}
                    <div className={`rounded-2xl py-7 text-center transition-colors duration-300 ${isOpen ? "bg-[#3C0078]" : "bg-gray-100"}`}>
                        <p className={`text-[9px] font-black uppercase tracking-[0.25em] mb-4 ${isOpen ? "text-white/50" : "text-gray-400"}`}>
                            Student Check-In Code
                        </p>
                        <AnimatePresence mode="wait">
                            {isOpen && session ? (
                                <motion.p
                                    key="code"
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-5xl font-black font-mono text-white tracking-[0.5em] pl-[0.5em]"
                                >
                                    {session.code}
                                </motion.p>
                            ) : (
                                <motion.p
                                    key="closed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-4xl font-mono text-gray-300 tracking-widest"
                                >
                                    — — — —
                                </motion.p>
                            )}
                        </AnimatePresence>
                        {isOpen && (
                            <p className="text-xs text-white/40 mt-4">Share this with your students</p>
                        )}
                    </div>

                    {/* Progress bar */}
                    {status && isOpen && (
                        <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1.5">
                                <span>{status.checkedIn.length} checked in</span>
                                <span>{pct}% · {status.totalEnrolled} enrolled</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#3C0078] rounded-full"
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Roster */}
                    {status && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        Present ({status.checkedIn.length})
                                    </span>
                                </div>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {status.checkedIn.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">Waiting…</p>
                                    ) : status.checkedIn.map(s => (
                                        <motion.div
                                            key={s.studentId}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[9px] font-black text-green-700 shrink-0">
                                                {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-800 truncate">{s.name}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        Not Yet ({status.notCheckedIn.length})
                                    </span>
                                </div>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {status.notCheckedIn.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">All in! 🎉</p>
                                    ) : status.notCheckedIn.map(s => (
                                        <div key={s.studentId} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0">
                                                {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 truncate">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {isOpen && !status && (
                        <p className="text-xs text-gray-400 text-center">Loading roster…</p>
                    )}

                    {isOpen && (
                        <p className="text-[10px] text-gray-400 text-center">Roster updates every 5 seconds</p>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
