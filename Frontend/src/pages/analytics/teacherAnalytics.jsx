import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Users, CheckCircle, Clock, Award,
  Target, ArrowUpRight, ArrowDownRight, ChevronDown, Filter,
  BookOpen, FileText, BarChart3, AlertTriangle, GraduationCap
} from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import { useAuth } from "../../contexts/AuthContext";
import { getTeacherCourses } from "../../services/courseService";
import { getCourseAssignments } from "../../services/assignmentService";
import { getCourseSubmissions } from "../../services/submissionService";
import { getCourseGrades } from "../../services/gradeService";
import {
  YEARS, SEMESTERS, YEAR_LEVELS,
  MOCK_COURSE_TRENDS,
  MOCK_GRADE_DISTRIBUTION
} from "./teacherMockData";

/* ─── animation variants ─── */
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } };

/* ─── reusable helpers ─── */
function MiniSparkline({ data, color = "#3C0078", height = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1, w = 100;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`tg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={`url(#tg-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressRing({ percent, size = 56, stroke = 5, color = "#3C0078" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, trend, suffix = "", accent = false }) {
  const pos = trend >= 0;
  return (
    <motion.div variants={fadeUp} className={`rounded-[28px] p-6 flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${accent ? "bg-[#3C0078] text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
      <div className="flex justify-between items-start">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${accent ? "bg-white/15" : "bg-[#3C0078]/5"}`}>
          <Icon size={20} className={accent ? "text-white" : "text-[#3C0078]"} />
        </span>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${accent ? (pos?"bg-green-400/20 text-green-200":"bg-red-400/20 text-red-200") : (pos?"bg-green-50 text-green-600":"bg-red-50 text-red-600")}`}>
            {pos ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{Math.abs(trend)}%
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

/* ─── filter pill ─── */
function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-[#3C0078] focus:ring-2 focus:ring-[#3C0078]/20 transition-all cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function TeacherAnalytics() {
  const { user } = useAuth();

  // ── filter state ──
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [selectedYearLevel, setSelectedYearLevel] = useState("All");
  const [selectedCourseId, setSelectedCourseId] = useState("all");

  // ── data state ──
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── fetch teacher's courses ──
  useEffect(() => {
    let mounted = true;
    async function fetchCourses() {
      if (!user?.userId) return;
      try {
        const data = await getTeacherCourses(user.userId);
        // Map backend courses into the shape the UI expects
        const mapped = (data || []).map(c => ({
          id: c.id,
          code: c.subject?.code || c.code || "???",
          name: c.subject?.name || c.name || "Course",
          label: c.subject?.code || c.code || "???",
          yearLevel: c.yearLevel || "3rd Year",
          semester: c.term || "Semester 1",
          year: 2026,
          enrolled: c.enrollments?.length || 0,
          color: "#3C0078"
        }));
        if (mounted) setTeacherCourses(mapped);
      } catch (err) {
        console.error("Failed to load teacher courses:", err);
      }
    }
    fetchCourses();
    return () => { mounted = false; };
  }, [user?.userId]);

  // ── filtered courses ──
  const filteredCourses = useMemo(() => {
    return teacherCourses.filter(c =>
      (selectedYearLevel === "All" || c.yearLevel === selectedYearLevel)
    );
  }, [teacherCourses, selectedYearLevel]);

  const activeCourseIds = useMemo(() =>
    selectedCourseId === "all" ? filteredCourses.map(c => c.id) : [selectedCourseId]
  , [selectedCourseId, filteredCourses]);

  // ── fetch assignments / submissions / grades for filtered courses ──
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (filteredCourses.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const promises = filteredCourses.map(async (c) => {
          const [a, s, g] = await Promise.all([
            getCourseAssignments(c.id).catch(() => []),
            getCourseSubmissions(c.id).catch(() => []),
            getCourseGrades(c.id).catch(() => [])
          ]);
          return { assignments: a, submissions: s, grades: g };
        });
        const results = await Promise.all(promises);
        if (mounted) {
          setAssignments(results.flatMap(r => r.assignments));
          setSubmissions(results.flatMap(r => r.submissions));
          setGrades(results.flatMap(r => r.grades));
        }
      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [filteredCourses]);

  // ── derived assignments with stats ──
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => activeCourseIds.includes(a.courseId)).map(a => {
      const subs = submissions.filter(s => s.assignmentId === a.id);
      const gs = grades.filter(g => g.submission?.assignmentId === a.id);
      let avgScore = null;
      if (gs.length > 0) {
        const totalEarned = gs.reduce((acc, g) => acc + (g.pointsEarned || 0), 0);
        const totalMax = gs.reduce((acc, g) => acc + (g.submission?.assignment?.maxPoints || a.maxPoints || 100), 0);
        avgScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null;
      }
      return {
        ...a,
        totalSubmissions: subs.length,
        graded: gs.length,
        avgScore,
        courseCode: filteredCourses.find(c => c.id === a.courseId)?.label || "???"
      };
    });
  }, [assignments, submissions, grades, activeCourseIds, filteredCourses]);

  // ── derived student roster ──
  const studentRoster = useMemo(() => {
    const studentMap = {};
    submissions.filter(s => activeCourseIds.includes(s.assignment?.courseId)).forEach(s => {
      const student = s.student;
      if (!student) return;
      if (!studentMap[student.id]) {
        studentMap[student.id] = {
          id: student.id,
          name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
          email: student.email,
          avatar: (student.name || `${student.firstName || ""} ${student.lastName || ""}`)
            .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() || "S",
          totalEarned: 0,
          totalMax: 0,
          submissions: 0,
          totalAssignments: filteredAssignments.filter(a => a.courseId === s.assignment?.courseId).length
        };
      }
      studentMap[student.id].submissions++;
      const grade = grades.find(g => g.submissionId === s.id);
      if (grade && s.assignment) {
        studentMap[student.id].totalEarned += (grade.pointsEarned || 0);
        studentMap[student.id].totalMax += (s.assignment.maxPoints || 0);
      }
    });
    return Object.values(studentMap).map(s => ({
      ...s,
      avgGrade: s.totalMax > 0 ? Math.round((s.totalEarned / s.totalMax) * 100) : 0,
      status: s.totalMax === 0 ? "Good"
        : s.totalEarned / s.totalMax >= 0.85 ? "Excellent"
        : s.totalEarned / s.totalMax >= 0.7 ? "Good"
        : s.totalEarned / s.totalMax >= 0.5 ? "At Risk"
        : "Critical"
    }));
  }, [submissions, grades, activeCourseIds, filteredAssignments]);

  // ── derived stats ──
  const totalStudents = filteredCourses.filter(c => activeCourseIds.includes(c.id)).reduce((s, c) => s + (c.enrolled || 0), 0) || studentRoster.length;
  const totalSubs = filteredAssignments.reduce((s, a) => s + a.totalSubmissions, 0);
  const totalGraded = filteredAssignments.reduce((s, a) => s + a.graded, 0);
  const pendingGrading = totalSubs - totalGraded;
  const gradedAssignments = filteredAssignments.filter(a => a.avgScore !== null);
  const classAvg = gradedAssignments.length ? Math.round(gradedAssignments.reduce((s, a) => s + a.avgScore, 0) / gradedAssignments.length) : 0;
  const gradingPct = totalSubs > 0 ? Math.round((totalGraded / totalSubs) * 100) : 0;

  return (
    <div className="w-full pb-16">
      <Menu />
      <SideMenu />

      <motion.div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2" initial="hidden" animate="visible" variants={stagger}>

        {/* ─── Header ─── */}
        <motion.div variants={fadeUp} className="rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Teaching Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Overview of class performance, grading progress, and student insights across your courses.
          </p>
        </motion.div>

        {/* ─── Filters ─── */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 rounded-[28px] border border-gray-100 bg-white/95 px-6 py-4 shadow-sm">
          <Filter size={18} className="text-gray-400" />
          <FilterSelect label="Year" value={selectedYear} options={YEARS} onChange={setSelectedYear} />
          <FilterSelect label="Semester" value={selectedSemester} options={SEMESTERS} onChange={setSelectedSemester} />
          <FilterSelect label="Level" value={selectedYearLevel} options={["All", ...YEAR_LEVELS]} onChange={setSelectedYearLevel} />
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Course</span>
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-[#3C0078] focus:ring-2 focus:ring-[#3C0078]/20 transition cursor-pointer">
              <option value="all">All Courses</option>
              {filteredCourses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </label>
        </motion.div>

        {/* ─── Stat Cards ─── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Class Average" value={classAvg} suffix="%" icon={Target} trend={3.1} accent />
          <StatCard label="Total Students" value={totalStudents} icon={Users} />
          <StatCard label="Grading Progress" value={gradingPct} suffix="%" icon={CheckCircle} trend={5.2} />
          <StatCard label="Pending to Grade" value={pendingGrading} icon={Clock} />
        </motion.div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">

            {/* Course Performance Cards */}
            <motion.div variants={fadeUp}>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Course Averages</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredCourses.map(course => {
                  const trend = MOCK_COURSE_TRENDS[course.id];
                  const avg = gradedAssignments.filter(a => a.courseId === course.id);
                  const courseAvg = avg.length ? Math.round(avg.reduce((s, a) => s + a.avgScore, 0) / avg.length) : 0;
                  return (
                    <motion.div key={course.id} whileHover={{ y: -3 }}
                      onClick={() => setSelectedCourseId(selectedCourseId === course.id ? "all" : course.id)}
                      className={`bg-white rounded-[28px] border shadow-sm p-6 cursor-pointer transition-all ${selectedCourseId === course.id ? "border-[#3C0078] shadow-md" : "border-gray-100 hover:border-[#3C0078]/20"}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative shrink-0">
                          <ProgressRing percent={courseAvg} color={course.color} />
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-black italic text-gray-900">{courseAvg}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{course.code}</p>
                          <p className="text-xs text-gray-400 truncate">{course.name}</p>
                        </div>
                      </div>
                      <MiniSparkline data={trend} color={course.color} height={36} />
                      <div className="flex justify-between mt-3 text-xs text-gray-400">
                        <span>{course.enrolled} students</span>
                        <span>{course.yearLevel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Grading Progress Table */}
            <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Grading Progress</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{filteredAssignments.length} assignments</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Course</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Graded</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Avg Score</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map(a => {
                    const pct = a.totalSubmissions > 0 ? Math.round((a.graded / a.totalSubmissions) * 100) : 0;
                    const done = a.graded === a.totalSubmissions && a.totalSubmissions > 0;
                    const noGrades = a.avgScore === null;
                    return (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                        <td className="px-7 py-4">
                          <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{a.title}</span>
                        </td>
                        <td className="px-7 py-4"><span className="text-xs font-bold text-gray-500">{a.courseCode}</span></td>
                        <td className="px-7 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">{a.graded}/{a.totalSubmissions}</span>
                            <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${done ? "bg-green-500" : pct > 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-7 py-4 text-center">
                          {noGrades ? <span className="text-xs text-gray-300">—</span> : <span className="text-base font-black italic text-gray-900">{a.avgScore}%</span>}
                        </td>
                        <td className="px-7 py-4 text-xs text-gray-400">{new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td className="px-7 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${done ? "bg-green-50 text-green-600" : noGrades ? "bg-gray-100 text-gray-400" : "bg-amber-50 text-amber-600"}`}>
                            {done ? "Complete" : noGrades ? "Not Started" : "In Progress"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* Student Roster */}
            <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Student Performance</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{studentRoster.length} students</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Avg Grade</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Submitted</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRoster.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078]">{s.avatar}</div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-7 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base font-black italic text-gray-900">{s.avgGrade}%</span>
                          <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.avgGrade >= 75 ? "bg-green-500" : s.avgGrade >= 50 ? "bg-orange-400" : "bg-red-500"}`} style={{ width: `${s.avgGrade}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-7 py-4 text-center text-sm font-bold text-gray-700">{s.submissions}/{s.totalAssignments}</td>
                      <td className="px-7 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          s.status === "Excellent" ? "bg-green-50 text-green-600" :
                          s.status === "Good" ? "bg-blue-50 text-blue-600" :
                          s.status === "At Risk" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-6">

            {/* Best course */}
            <motion.div variants={fadeUp} className="bg-[#3C0078] rounded-[28px] p-6 text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Highest Performing</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic">{classAvg}%</span>
                <span className="text-sm opacity-60">Avg</span>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm">
                <Award size={16} className="text-yellow-300" />
                <span>Across {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}</span>
              </div>
            </motion.div>

            {/* Grade Distribution */}
            <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Grade Distribution</h3>
              <div className="space-y-2.5">
                {MOCK_GRADE_DISTRIBUTION.map(b => {
                  const maxCount = Math.max(...MOCK_GRADE_DISTRIBUTION.map(d => d.count), 1);
                  return (
                    <div key={b.range} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-14 text-right">{b.range}</span>
                      <div className="flex-1 h-5 bg-gray-50 rounded-lg overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(b.count / maxCount) * 100}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-lg" style={{ backgroundColor: b.color }} />
                      </div>
                      <span className="text-xs font-black text-gray-700 w-6">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Grading queue */}
            <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Grading Queue</h3>
              <div className="space-y-3">
                {filteredAssignments.filter(a => a.graded < a.totalSubmissions).map(a => {
                  const remaining = a.totalSubmissions - a.graded;
                  return (
                    <div key={a.id} className="rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-[#3C0078]/20 transition-all">
                      <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50">
                        <FileText size={18} className="text-amber-600" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.courseCode}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-amber-600">{remaining} left</p>
                        <p className="text-[10px] text-gray-400">to grade</p>
                      </div>
                    </div>
                  );
                })}
                {filteredAssignments.filter(a => a.graded < a.totalSubmissions).length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                    All caught up!
                  </div>
                )}
              </div>
            </motion.div>

            {/* At-risk students */}
            <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">At-Risk Students</h3>
              <div className="space-y-3">
                {studentRoster.filter(s => s.status === "At Risk" || s.status === "Critical").map(s => (
                  <div key={s.id} className={`rounded-2xl border p-4 flex items-center gap-3 ${s.status === "Critical" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
                    <div className="w-9 h-9 rounded-full bg-white border-2 border-white flex items-center justify-center font-black text-[10px] text-[#3C0078] shadow-sm">{s.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.submissions}/{s.totalAssignments} submitted</p>
                    </div>
                    <span className={`text-lg font-black italic ${s.avgGrade < 50 ? "text-red-600" : "text-amber-600"}`}>{s.avgGrade}%</span>
                  </div>
                ))}
                {studentRoster.filter(s => s.status === "At Risk" || s.status === "Critical").length === 0 && (
                  <p className="text-center py-4 text-sm text-gray-400">No at-risk students 🎉</p>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
