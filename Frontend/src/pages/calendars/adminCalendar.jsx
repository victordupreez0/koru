import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Clock, MapPin, User, CheckCircle,
  ChevronDown, ChevronUp, Zap, Calendar,
} from "lucide-react";
import { classService } from "../../services/classService";
import { useAuth } from "../../contexts/AuthContext";
import StudentCalendar from "./studentCalendar";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

function parseMinutes(t) {
  if (!t) return null;
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function detectConflicts(classes) {
  const scheduled = classes.filter(c => c.startTime && c.dayOfWeek && c.teacherId);
  const conflicts = [];
  const seen = new Set();
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i], b = scheduled[j];
      if (a.teacherId !== b.teacherId || a.dayOfWeek !== b.dayOfWeek) continue;
      const aS = parseMinutes(a.startTime), aE = parseMinutes(a.endTime);
      const bS = parseMinutes(b.startTime), bE = parseMinutes(b.endTime);
      if (aS === null || aE === null || bS === null || bE === null) continue;
      if (aS < bE && bS < aE) {
        const key = [a.id, b.id].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          conflicts.push({ slot1: a, slot2: b, teacherName: a.teacherName || b.teacherName });
        }
      }
    }
  }
  return conflicts;
}

function SlotChip({ cls, conflict }) {
  return (
    <div className={`rounded-xl px-3 py-2 border text-[10px] ${
      conflict ? "bg-red-50 border-red-200" : "bg-white border-gray-100"
    }`}>
      {cls.name && <span className={`font-black uppercase tracking-wider ${conflict ? "text-red-500" : "text-[#3C0078]"}`}>{cls.name} · </span>}
      {cls.courseName && <span className="font-semibold text-gray-700">{cls.courseName}</span>}
      <div className="flex flex-wrap gap-x-2 mt-0.5 text-gray-400">
        {cls.startTime && <span className="flex items-center gap-0.5"><Clock size={8} />{formatTime(cls.startTime)}</span>}
        {cls.teacherName && <span className="flex items-center gap-0.5"><User size={8} />{cls.teacherName}</span>}
        {cls.room && <span className="flex items-center gap-0.5"><MapPin size={8} />{cls.room}</span>}
      </div>
    </div>
  );
}

export default function AdminCalendar() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastTimetable, setLastTimetable] = useState(null);

  useEffect(() => {
    classService.getAll()
      .then(d => setClasses(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const conflicts = useMemo(() => detectConflicts(classes), [classes]);
  const unscheduled = useMemo(() => classes.filter(c => c.classGroupId && !c.startTime), [classes]);
  const conflictIds = useMemo(() => new Set(conflicts.flatMap(c => [c.slot1.id, c.slot2.id])), [conflicts]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/Timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: "Semester 1",
          year: new Date().getFullYear(),
          generatedAt: new Date().toISOString(),
          generatedBy: user ? `${user.firstName} ${user.lastName}` : "Admin",
          userId: user?.userId || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLastTimetable(data);
      } else {
        alert("Failed to generate timetable.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const statusColor = conflicts.length > 0 ? "red" : unscheduled.length > 0 ? "amber" : "green";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Timetable control panel ───────────────────────────── */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Panel header (always visible) */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Status dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              statusColor === "red" ? "bg-red-500 animate-pulse"
              : statusColor === "amber" ? "bg-amber-400 animate-pulse"
              : "bg-green-500"
            }`} />

            {loading ? (
              <span className="text-xs text-gray-400">Loading timetable data…</span>
            ) : (
              <span className={`text-xs font-semibold ${
                statusColor === "red" ? "text-red-600"
                : statusColor === "amber" ? "text-amber-600"
                : "text-green-600"
              }`}>
                {conflicts.length > 0
                  ? `${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} — teacher double-booked`
                  : unscheduled.length > 0
                  ? `${unscheduled.length} unscheduled slot${unscheduled.length !== 1 ? "s" : ""}`
                  : `No conflicts · ${classes.length} class slot${classes.length !== 1 ? "s" : ""} configured`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastTimetable && (
              <span className="text-[10px] text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                Timetable generated
              </span>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3C0078] text-white text-[11px] font-bold hover:bg-[#2a0055] transition-colors disabled:opacity-50"
            >
              <Zap size={12} />
              {generating ? "Generating…" : "Generate Timetable"}
            </button>
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={panelOpen ? "Collapse" : "Expand"}
            >
              {panelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Collapsible detail panel */}
        <AnimatePresence>
          {panelOpen && !loading && (conflicts.length > 0 || unscheduled.length > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-4 space-y-4 max-h-64 overflow-y-auto">
                {/* Conflicts */}
                {conflicts.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={10} /> Teacher Conflicts
                    </div>
                    <div className="space-y-2">
                      {conflicts.map((c, i) => (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-2xl p-3">
                          <p className="text-[10px] font-bold text-red-700 mb-2">
                            <User size={10} className="inline mr-1" />
                            {c.teacherName || "Unknown"} — {c.slot1.dayOfWeek}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <SlotChip cls={c.slot1} conflict />
                            <SlotChip cls={c.slot2} conflict />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unscheduled */}
                {unscheduled.length > 0 && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1.5">
                      <Clock size={10} /> Unscheduled Slots
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {unscheduled.map(cls => (
                        <div key={cls.id} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px]">
                          {cls.name && <span className="font-black text-amber-600 uppercase tracking-wider">{cls.name} · </span>}
                          <span className="text-gray-600 font-semibold">{cls.courseName || "Unknown course"}</span>
                          {cls.durationHours && <span className="text-gray-400 ml-1">({cls.durationHours}h)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* ── Student calendar below ─────────────────────────────── */}
      <div className="flex-1 overflow-hidden min-h-0">
        <StudentCalendar />
      </div>
    </div>
  );
}
