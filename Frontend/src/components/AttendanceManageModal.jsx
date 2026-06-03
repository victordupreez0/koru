import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { openSession, getSessionStatus, closeSession } from "../services/checkInService";

export default function AttendanceManageModal({ courseId, teacherId, sessionType = "Lecture", courseName, onClose }) {
    const [session, setSession]   = useState(null);
    const [status, setStatus]     = useState(null);
    const [opening, setOpening]   = useState(true);
    const [closing, setClosing]   = useState(false);

    // Open or fetch existing session on mount
    useEffect(() => {
        openSession(courseId, teacherId, sessionType)
            .then(s => setSession(s))
            .catch(console.error)
            .finally(() => setOpening(false));
    }, [courseId, teacherId, sessionType]);

    // Poll status every 5 s
    useEffect(() => {
        if (!session?.id) return;
        const fetch = () => getSessionStatus(session.id).then(setStatus).catch(() => {});
        fetch();
        const id = setInterval(fetch, 5000);
        return () => clearInterval(id);
    }, [session?.id]);

    const handleClose = async () => {
        if (!session) { onClose(); return; }
        setClosing(true);
        try { await closeSession(session.id); } catch {}
        onClose();
    };

    const pct = status
        ? Math.round((status.checkedIn.length / Math.max(status.totalEnrolled, 1)) * 100)
        : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Purple header */}
                <div className="bg-[#3C0078] px-8 py-6 text-white">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                {sessionType} · {courseName}
                            </span>
                            <h2 className="text-2xl font-black mt-0.5">Attendance Open</h2>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Live</span>
                        </div>
                    </div>

                    {/* Code display */}
                    <div className="bg-white/10 rounded-2xl py-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-3">
                            Student Check-In Code
                        </p>
                        {opening ? (
                            <div className="text-5xl font-black font-mono tracking-[0.5em] opacity-40">- - - -</div>
                        ) : (
                            <div className="text-6xl font-black font-mono tracking-[0.5em]">
                                {session?.code}
                            </div>
                        )}
                        <p className="text-xs opacity-50 mt-3">Share this with your students</p>
                    </div>

                    {/* Progress bar */}
                    {status && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs font-bold opacity-70 mb-1.5">
                                <span>{status.checkedIn.length} checked in</span>
                                <span>{status.totalEnrolled} enrolled · {pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-green-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Roster */}
                <div className="p-8">
                    {!status ? (
                        <div className="text-center text-gray-400 py-8 text-sm">Loading roster…</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Present */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Present ({status.checkedIn.length})
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {status.checkedIn.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic pl-1">Waiting for students…</p>
                                    ) : status.checkedIn.map(s => (
                                        <AnimatePresence key={s.studentId}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3 bg-green-50 rounded-xl px-3 py-2.5"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-black text-green-700 shrink-0">
                                                    {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-800 truncate">{s.name}</span>
                                            </motion.div>
                                        </AnimatePresence>
                                    ))}
                                </div>
                            </div>

                            {/* Not yet */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        Not Yet ({status.notCheckedIn.length})
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {status.notCheckedIn.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic pl-1">Everyone's in! 🎉</p>
                                    ) : status.notCheckedIn.map(s => (
                                        <div key={s.studentId} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                                                {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-400 truncate">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-400">Updates every 5 seconds</p>
                        <button
                            onClick={handleClose}
                            disabled={closing}
                            className="px-6 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-bold hover:bg-[#2A0054] transition-colors disabled:opacity-50"
                        >
                            {closing ? "Closing…" : "Close Session"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
