import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, BookOpen, CheckCircle, Clock, Award,
  Target, BarChart3, ArrowUpRight, ArrowDownRight, ChevronDown,
  Flame, Zap, GraduationCap, FileText, AlertTriangle
} from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

/* ──────────────────────────── animation variants ──────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ──────────────────────────── MOCK DATA ──────────────────────────── */

// Enrolled courses with per-course grade data
const MOCK_COURSES = [
  { id: "c1", code: "DV300", name: "Development 300", lecturer: "Prof. van der Merwe", average: 78, trend: +4.2, color: "#3C0078" },
  { id: "c2", code: "UX300", name: "User Experience 300", lecturer: "Dr. Sarah Miller", average: 84, trend: +1.8, color: "#14B8A6" },
  { id: "c3", code: "ID300", name: "Interactive Development 300", lecturer: "Mr. James Lee", average: 71, trend: -2.1, color: "#F59E0B" },
  { id: "c4", code: "DV200", name: "Development 200", lecturer: "Mrs. Nkosi", average: 92, trend: +6.5, color: "#6366F1" },
];

// Recent assignment grades (from Grade + Submission + Assignment endpoints)
const MOCK_GRADES = [
  { id: "g1", assignment: "Heuristic Evaluation Report", course: "UX300", pointsEarned: 82, maxPoints: 100, gradedAt: "2026-04-28", status: "Graded" },
  { id: "g2", assignment: "React Dashboard Prototype", course: "DV300", pointsEarned: 75, maxPoints: 100, gradedAt: "2026-04-25", status: "Graded" },
  { id: "g3", assignment: "API Integration Task", course: "ID300", pointsEarned: 68, maxPoints: 100, gradedAt: "2026-04-22", status: "Graded" },
  { id: "g4", assignment: "Component Library", course: "DV200", pointsEarned: 95, maxPoints: 100, gradedAt: "2026-04-20", status: "Graded" },
  { id: "g5", assignment: "Persona Research Brief", course: "UX300", pointsEarned: 88, maxPoints: 100, gradedAt: "2026-04-15", status: "Graded" },
  { id: "g6", assignment: "Database Schema Design", course: "DV300", pointsEarned: 80, maxPoints: 100, gradedAt: "2026-04-10", status: "Graded" },
];

// Upcoming assignments (from Assignment endpoint – not yet submitted)
const MOCK_UPCOMING = [
  { id: "a1", title: "Usability Test Report", course: "UX300", dueDate: "2026-05-08", maxPoints: 100 },
  { id: "a2", title: "Full-Stack Capstone", course: "DV300", dueDate: "2026-05-15", maxPoints: 150 },
  { id: "a3", title: "Motion Design Sprint", course: "ID300", dueDate: "2026-05-12", maxPoints: 80 },
];

// Submissions status breakdown
const MOCK_SUBMISSIONS_SUMMARY = { total: 18, graded: 14, pending: 3, late: 1 };

// Monthly grade trend (for the sparkline)
const MOCK_MONTHLY_TREND = [62, 68, 71, 74, 70, 76, 78, 80, 82, 79, 84, 81];

// Recent feedback from teachers
const MOCK_FEEDBACK = [
  { id: "f1", assignment: "Heuristic Evaluation Report", course: "UX300", teacher: "Dr. Sarah Miller", content: "Excellent analysis of Nielsen's heuristics. Your recommendations were practical and well-supported.", createdAt: "2026-04-29" },
  { id: "f2", assignment: "React Dashboard Prototype", course: "DV300", teacher: "Prof. van der Merwe", content: "Good component structure but consider adding error boundaries. The UI polish is impressive.", createdAt: "2026-04-26" },
  { id: "f3", assignment: "Component Library", course: "DV200", teacher: "Mrs. Nkosi", content: "Outstanding work! Your documentation and reusable patterns set a high standard for the class.", createdAt: "2026-04-21" },
];

/* ──────────────────────────── helper components ──────────────────────────── */

function MiniSparkline({ data, color = "#3C0078", height = 40 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${w},${height}`} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, trend, suffix = "", accent = false, color }) {
  const isPositive = trend >= 0;
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-[28px] p-6 flex flex-col justify-between gap-4 group transition-all hover:shadow-lg ${
        accent
          ? "bg-[#3C0078] text-white"
          : "bg-white/70 border border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${accent ? "bg-white/70/15" : "bg-[#3C0078]/5"}`}>
          <Icon size={20} className={accent ? "text-white" : "text-[#3C0078]"} />
        </span>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            accent
              ? isPositive ? "bg-green-400/20 text-green-200" : "bg-red-400/20 text-red-200"
              : isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <span className={`text-[10px] font-black uppercase tracking-[0.15em] block mb-1 ${accent ? "text-white/60" : "text-gray-400"}`}>{label}</span>
        <span className={`text-4xl font-black italic ${accent ? "text-white" : "text-gray-900"}`}>{value}{suffix}</span>
      </div>
    </motion.div>
  );
}

function ProgressRing({ percent, size = 56, stroke = 5, color = "#3C0078" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

/* ──────────────────────────── main page ──────────────────────────── */

export default function StudentAnalytics() {
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  // Derived stats
  const overallAvg = Math.round(MOCK_COURSES.reduce((s, c) => s + c.average, 0) / MOCK_COURSES.length);
  const highestCourse = MOCK_COURSES.reduce((a, b) => a.average > b.average ? a : b);
  const totalAssignmentsGraded = MOCK_GRADES.length;

  return (
    <div className="w-full pb-16">
      <Menu />
      <SideMenu />

      <motion.div
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2"
        initial="hidden" animate="visible" variants={stagger}
      >
        {/* ─── Page Header ─── */}
        {/* <motion.div variants={fadeUp} className="rounded-[28px] p-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Track your academic performance, monitor grades across courses, and stay on top of upcoming deadlines.
          </p>
        </motion.div> */}

        {/* ─── Top Stat Cards ─── */}
        <motion.div variants={fadeUp} className="grid mt-15 grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Overall Average" value={overallAvg} suffix="%" icon={Target} trend={2.8} accent />
          <StatCard label="Courses Enrolled" value={MOCK_COURSES.length} icon={BookOpen} />
          <StatCard label="Assignments Graded" value={totalAssignmentsGraded} icon={CheckCircle} trend={3.5} />
          <StatCard label="Pending Submissions" value={MOCK_SUBMISSIONS_SUMMARY.pending} icon={Clock} />
        </motion.div>

        {/* ─── Main Grid: Performance + Upcoming ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-6">

            {/* ─── Grade Trend Chart ─── */}
            <motion.div variants={fadeUp} className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Grade Trend</h2>
                  <p className="text-sm text-gray-400">Monthly average over the past year</p>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-2xl">
                  <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                    <TrendingUp size={14} /> +2.8% overall
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <MiniSparkline data={MOCK_MONTHLY_TREND} color="#3C0078" height={100} />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-300 mt-2 px-1">
                  {["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"].map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ─── Course Performance Cards ─── */}
            <motion.div variants={fadeUp}>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Course Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_COURSES.map(course => {
                  const pct = course.average;
                  const isPositive = course.trend >= 0;
                  return (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -3 }}
                      className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm p-6 flex items-center gap-5 group hover:border-[#3C0078]/20 transition-all cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <ProgressRing percent={pct} color={course.color} />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black italic text-gray-900">
                          {pct}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors truncate">{course.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{course.code} · {course.lecturer}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                        isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(course.trend)}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ─── Recent Grades Table ─── */}
            <motion.div variants={fadeUp} className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Recent Grades</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last {MOCK_GRADES.length} assignments</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Course</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Score</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Date</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_GRADES.map(g => {
                    const pct = Math.round((g.pointsEarned / g.maxPoints) * 100);
                    return (
                      <tr key={g.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                        <td className="px-7 py-4">
                          <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{g.assignment}</span>
                        </td>
                        <td className="px-7 py-4">
                          <span className="text-xs font-bold text-gray-500">{g.course}</span>
                        </td>
                        <td className="px-7 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-base font-black italic text-gray-900">{pct}%</span>
                            <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-orange-400" : "bg-red-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-7 py-4 text-center text-xs text-gray-400">
                          {new Date(g.gradedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-7 py-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600">
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="flex flex-col gap-6">

            {/* Best-performing course */}
            <motion.div variants={fadeUp} className="bg-[#3C0078] rounded-[28px] p-6 text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/70/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Top Course</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic">{highestCourse.average}%</span>
                <span className="text-sm opacity-60">{highestCourse.code}</span>
              </div>
              <p className="text-sm text-white/70 mt-1">{highestCourse.name}</p>
              <div className="mt-6 flex items-center gap-2 text-sm">
                <Award size={16} className="text-yellow-300" />
                <span>Your highest performer</span>
              </div>
            </motion.div>

            {/* Submission Stats */}
            <motion.div variants={fadeUp} className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Submission Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: "Graded", value: MOCK_SUBMISSIONS_SUMMARY.graded, total: MOCK_SUBMISSIONS_SUMMARY.total, color: "bg-green-500" },
                  { label: "Pending", value: MOCK_SUBMISSIONS_SUMMARY.pending, total: MOCK_SUBMISSIONS_SUMMARY.total, color: "bg-amber-400" },
                  { label: "Late", value: MOCK_SUBMISSIONS_SUMMARY.late, total: MOCK_SUBMISSIONS_SUMMARY.total, color: "bg-red-500" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.value}/{item.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${(item.value / item.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div variants={fadeUp} className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {MOCK_UPCOMING.map(a => {
                  const dueDate = new Date(a.dueDate);
                  const daysLeft = Math.ceil((dueDate - new Date("2026-05-01")) / (1000 * 60 * 60 * 24));
                  const urgent = daysLeft <= 7;
                  return (
                    <div key={a.id} className={`rounded-2xl border p-4 flex items-center gap-4 transition-all hover:shadow-sm ${urgent ? "border-amber-200 bg-amber-50/30" : "border-gray-100"}`}>
                      <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ${urgent ? "bg-amber-100" : "bg-[#3C0078]/5"}`}>
                        {urgent ? <AlertTriangle size={18} className="text-amber-600" /> : <FileText size={18} className="text-[#3C0078]" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.course} · {a.maxPoints} pts</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${urgent ? "text-amber-600" : "text-gray-500"}`}>
                          {daysLeft}d left
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Feedback */}
            <motion.div variants={fadeUp} className="bg-white/70 rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Recent Feedback</h3>
              <div className="space-y-3">
                {MOCK_FEEDBACK.map(fb => (
                  <motion.div
                    key={fb.id}
                    layout
                    className="rounded-2xl border border-gray-100 p-4 hover:border-[#3C0078]/20 transition-all cursor-pointer"
                    onClick={() => setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{fb.assignment}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fb.teacher} · {fb.course}</p>
                      </div>
                      <motion.div animate={{ rotate: expandedFeedback === fb.id ? 180 : 0 }} className="shrink-0 text-gray-300">
                        <ChevronDown size={16} />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {expandedFeedback === fb.id && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-sm text-gray-600 mt-3 leading-relaxed overflow-hidden"
                        >
                          "{fb.content}"
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
