import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, Avatar, Card, Modal, Select } from "./UI";
import { getActiveSession, openSession, getSessionStatus, closeSession, markStudentPresent } from "../services/checkInService";

const LATE_KEY      = "checkin_lateAfterMinutes";
const AUTOCLOSE_KEY = "checkin_autoCloseMinutes";

export default function AttendanceManageModal({ courseId, teacherId, sessionType, courseName, onClose }) {
    const [session, setSession]   = useState(null);
    const [status, setStatus]     = useState(null);
    const [isOpen, setIsOpen]     = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError]       = useState(null);

    // Settings — persisted to localStorage
    const [lateAfterMin,  setLateAfterMin]  = useState(() => localStorage.getItem(LATE_KEY)      || "");
    const [autoCloseMin,  setAutoCloseMin]  = useState(() => localStorage.getItem(AUTOCLOSE_KEY) || "");

    const saveLate = (val) => { setLateAfterMin(val);  localStorage.setItem(LATE_KEY,      val); };
    const saveAutoClose = (val) => { setAutoCloseMin(val); localStorage.setItem(AUTOCLOSE_KEY, val); };

    const lateNum      = lateAfterMin  ? parseInt(lateAfterMin)  : null;
    const autoCloseNum = autoCloseMin  ? parseInt(autoCloseMin)  : null;

    const handleMarkPresent = async (studentId) => {
        if (!session?.id) return;
        try {
            await markStudentPresent(session.id, studentId);
            getSessionStatus(session.id).then(setStatus).catch(() => {});
        } catch {}
    };

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
                const s = await openSession(courseId, teacherId, sessionType, lateNum, autoCloseNum);
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

    // When settings change while a session is already open, push the update immediately
    useEffect(() => {
        if (!isOpen || !session?.id) return;
        openSession(courseId, teacherId, sessionType, lateNum, autoCloseNum)
            .then(s => setSession(s))
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lateNum, autoCloseNum]);

    const pct = status
        ? Math.round((status.checkedIn.length / Math.max(status.totalEnrolled, 1)) * 100)
        : 0;

    return (
        <Modal
            open
            onClose={onClose}
            title="Live Attendance"
            description={`${sessionType} · ${courseName}`}
            size="md"
        >
            <div className="space-y-6">

                {/* Session settings */}
                <div className="flex gap-3">
                    <Select
                        label="Late After"
                        size="sm"
                        containerClassName="flex-1"
                        value={lateAfterMin}
                        onChange={e => saveLate(e.target.value)}
                    >
                        <option value="">No threshold</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                        <option value="30">30 minutes</option>
                    </Select>
                    <Select
                        label="Auto-Close"
                        size="sm"
                        containerClassName="flex-1"
                        value={autoCloseMin}
                        onChange={e => saveAutoClose(e.target.value)}
                    >
                        <option value="">None</option>
                        <option value="15">After 15 min</option>
                        <option value="30">After 30 min</option>
                        <option value="45">After 45 min</option>
                        <option value="60">After 60 min</option>
                        <option value="90">After 90 min</option>
                    </Select>
                </div>

                {/* Toggle row */}
                <Card tone="muted" radius="lg" className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-koru-on-surface">
                            {isOpen ? "Attendance is open" : "Attendance is closed"}
                        </p>
                        <p className="text-xs text-koru-on-surface-variant mt-0.5">
                            {isOpen ? "Students can check in now" : "Toggle to let students check in"}
                        </p>
                    </div>

                    {/* Toggle switch — always clickable, just dims while API call is in-flight */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isOpen}
                        aria-label="Attendance open"
                        onClick={handleToggle}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 ${
                            toggling ? "opacity-60 cursor-wait" : "cursor-pointer"
                        } ${isOpen ? "bg-koru-primary" : "bg-koru-outline-variant"}`}
                    >
                        <motion.span
                            layout
                            animate={{ x: isOpen ? 29 : 3 }}
                            transition={{ type: "spring", stiffness: 600, damping: 35 }}
                            className="absolute top-[3px] block w-[22px] h-[22px] bg-koru-surface-container-lowest rounded-full shadow-koru-xs"
                        />
                    </button>
                </Card>

                {error && (
                    <Alert variant="error" className="-mt-3">{error}</Alert>
                )}

                {/* Code block */}
                <div className={`rounded-koru-lg py-7 text-center transition-colors duration-300 ${isOpen ? "bg-koru-primary" : "bg-koru-surface-container-highest"}`}>
                    <p className={`text-koru-caption font-medium uppercase tracking-[0.25em] mb-4 ${isOpen ? "text-koru-on-primary/60" : "text-koru-on-surface-variant"}`}>
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
                                className="text-5xl font-medium font-mono text-koru-on-primary tracking-[0.5em] pl-[0.5em]"
                            >
                                {session.code}
                            </motion.p>
                        ) : (
                            <motion.p
                                key="closed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-4xl font-mono text-koru-outline tracking-widest"
                            >
                                — — — —
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {isOpen && (
                        <p className="text-xs text-koru-on-primary/60 mt-4">Share this with your students</p>
                    )}
                </div>

                {/* Progress bar */}
                {status && isOpen && (
                    <div>
                        <div className="flex justify-between text-xs font-medium text-koru-on-surface-variant mb-1.5">
                            <span>{status.checkedIn.length} checked in</span>
                            <span>{pct}% · {status.totalEnrolled} enrolled</span>
                        </div>
                        <div className="h-1.5 bg-koru-surface-container-high rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-koru-primary rounded-full"
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
                                <div className="w-2 h-2 rounded-full bg-koru-success" />
                                <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                                    Present ({status.checkedIn.length})
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {status.checkedIn.length === 0 ? (
                                    <p className="text-xs text-koru-on-surface-variant italic">Waiting…</p>
                                ) : status.checkedIn.map(s => (
                                    <motion.div
                                        key={s.studentId}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 bg-koru-success-soft rounded-koru-md px-3 py-2"
                                    >
                                        <Avatar name={s.name} seed={s.studentId} size="xs" />
                                        <span className="text-xs font-medium text-koru-success truncate">{s.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-koru-warning" />
                                <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                                    Not Yet ({status.notCheckedIn.length})
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {status.notCheckedIn.length === 0 ? (
                                    <p className="text-xs text-koru-on-surface-variant italic">All in! 🎉</p>
                                ) : status.notCheckedIn.map(s => (
                                    <div key={s.studentId} className="flex items-center gap-2 bg-koru-surface-container rounded-koru-md px-3 py-2 group/row">
                                        <Avatar name={s.name} seed={s.studentId} size="xs" />
                                        <span className="text-xs font-medium text-koru-on-surface-variant truncate flex-1">{s.name}</span>
                                        <div className="relative shrink-0">
                                            <button
                                                onClick={() => handleMarkPresent(s.studentId)}
                                                aria-label={`Mark ${s.name} present`}
                                                className="w-6 h-6 rounded-full bg-koru-outline-variant hover:bg-koru-success flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                            >
                                                <svg className="w-3 h-3 text-koru-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-koru-inverse-surface text-koru-inverse-on-surface text-koru-caption font-medium px-2 py-1 rounded-koru-sm whitespace-nowrap opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                Mark Present
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isOpen && !status && (
                    <p className="text-xs text-koru-on-surface-variant text-center">Loading roster…</p>
                )}

                {isOpen && session?.autoCloseAt && (
                    <p className="text-koru-caption text-center font-medium text-koru-warning">
                        Auto-closes at {new Date(session.autoCloseAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                )}
                {isOpen && (
                    <p className="text-koru-caption text-koru-on-surface-variant text-center">Roster updates every 5 seconds</p>
                )}
            </div>
        </Modal>
    );
}
