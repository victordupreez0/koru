import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, GraduationCap, ArrowUpRight, ArrowDownRight,
  UserCheck, TrendingUp, TrendingDown, CheckCircle, Clock, Target,
  BarChart3, ChevronDown, Award, Layers
} from "lucide-react";



const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

const COURSE_COLORS = [
  "#3C0078", "#14B8A6", "#6366F1", "#F59E0B", "#EC4899",
  "#10B981", "#8B5CF6", "#EF4444", "#3B82F6", "#84CC16",
];

/* ─── animation variants ─── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ─── helpers ─── */
function MiniSparkline({ data, color = "#3C0078", height = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1, w = 100;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`ag-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={`url(#ag-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressRing({ percent, size = 56, stroke = 5, color = "#3C0078" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
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
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${accent ? (pos ? "bg-green-400/20 text-green-200" : "bg-red-400/20 text-red-200") : (pos ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}`}>
            {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(trend)}%
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

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
export default function AdminAnalytics() {
  /* ── platform-wide data ── */
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── teacher analytics panel ── */
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [teacherSubmissions, setTeacherSubmissions] = useState([]);
  const [teacherGrades, setTeacherGrades] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);

  /* ── fetch platform stats ── */
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        setLoading(true);
        const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
          fetch(`${API_BASE}/User`),
          fetch(`${API_BASE}/Course`),
          fetch(`${API_BASE}/Enrollment`),
        ]);
        const [usersData, coursesData, enrollmentsData] = await Promise.all([
          usersRes.json(),
          coursesRes.json(),
          enrollmentsRes.json(),
        ]);
        if (mounted) {
          setUsers(Array.isArray(usersData) ? usersData : []);
          setCourses(Array.isArray(coursesData) ? coursesData : []);
          setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, []);

  /* ── fetch selected teacher's analytics ── */
  useEffect(() => {
    if (!selectedTeacherId) {
      setTeacherCourses([]);
      setTeacherAssignments([]);
      setTeacherSubmissions([]);
      setTeacherGrades([]);
      return;
    }
    let mounted = true;
    async function fetchTeacherData() {
      try {
        setTeacherLoading(true);

        // Fetch all courses fresh and filter by this teacher's ID
        const allCoursesRes = await fetch(`${API_BASE}/Course`);
        const allCoursesData = allCoursesRes.ok ? await allCoursesRes.json() : [];
        const raw = Array.isArray(allCoursesData)
          ? allCoursesData.filter(
              c => c.teacherId === selectedTeacherId || c.teacher?.id === selectedTeacherId
            )
          : [];

        const mapped = raw.map((c, i) => ({
          id: c.id,
          subjectName: c.subject?.name || "Unnamed",
          label: c.subject?.code || "???",
          code: (c.subject?.code || "??").substring(0, 2),
          number: (c.subject?.code || "??").substring(2),
          term: c.term,
          color: COURSE_COLORS[i % COURSE_COLORS.length],
          enrolled: c.capacity || 0,
        }));

        if (!mounted) return;
        setTeacherCourses(mapped);

        if (mapped.length === 0) {
          setTeacherAssignments([]);
          setTeacherSubmissions([]);
          setTeacherGrades([]);
          return;
        }

        // Fetch assignments for each course, plus all submissions and grades in parallel
        const [assignmentArrays, subsData, gradesData] = await Promise.all([
          Promise.all(
            mapped.map(c =>
              fetch(`${API_BASE}/Assignment/course/${c.id}`)
                .then(r => r.ok ? r.json() : [])
                .catch(() => [])
            )
          ),
          fetch(`${API_BASE}/Submission`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch(`${API_BASE}/Grade`).then(r => r.ok ? r.json() : []).catch(() => []),
        ]);

        if (!mounted) return;

        const allAssignments = assignmentArrays.flat();
        const assignmentIdSet = new Set(allAssignments.map(a => a.id));

        const filteredSubs = Array.isArray(subsData)
          ? subsData.filter(s => assignmentIdSet.has(s.assignmentId))
          : [];
        // Build a set of submission IDs that belong to this teacher's assignments
        const submissionIdSet = new Set(filteredSubs.map(s => s.id));

        const filteredGrades = Array.isArray(gradesData)
          ? gradesData.filter(g =>
              submissionIdSet.has(g.submissionId) ||
              assignmentIdSet.has(g.submission?.assignmentId)
            )
          : [];

        setTeacherAssignments(allAssignments);
        setTeacherSubmissions(filteredSubs);
        setTeacherGrades(filteredGrades);
      } catch (err) {
        console.error("Failed to load teacher analytics:", err);
      } finally {
        if (mounted) setTeacherLoading(false);
      }
    }
    fetchTeacherData();
    return () => { mounted = false; };
  }, [selectedTeacherId]);

  /* ── derived platform stats ── */
  const lecturers = useMemo(() => users.filter(u => u.role?.toLowerCase() === "teacher"), [users]);
  const students = useMemo(() => users.filter(u => u.role?.toLowerCase() === "student"), [users]);

  const coursesPerLecturer = useMemo(() =>
    lecturers.map(l => ({
      ...l,
      fullName: `${l.firstName} ${l.lastName}`,
      avatar: `${l.firstName?.[0] || ""}${l.lastName?.[0] || ""}`.toUpperCase(),
      courseList: courses.filter(c => c.teacherId === l.id || c.teacher?.id === l.id),
    })).sort((a, b) => b.courseList.length - a.courseList.length)
  , [lecturers, courses]);

  const avgCoursesPerLecturer = lecturers.length
    ? (courses.length / lecturers.length).toFixed(1)
    : 0;

  const uniqueSubjects = useMemo(() => {
    const ids = new Set(courses.map(c => c.subjectId || c.subject?.id).filter(Boolean));
    return ids.size || courses.length;
  }, [courses]);

  /* ── derived teacher analytics stats ── */
  const selectedTeacher = useMemo(
    () => users.find(u => u.id === selectedTeacherId),
    [users, selectedTeacherId]
  );

  const assignmentsWithStats = useMemo(() =>
    teacherAssignments.map(a => {
      const subs = teacherSubmissions.filter(s => s.assignmentId === a.id);
      const gs = teacherGrades.filter(g => g.submission?.assignmentId === a.id);
      const avgScore = gs.length > 0
        ? Math.round(
            gs.reduce((acc, g) => acc + g.pointsEarned, 0) /
            gs.reduce((acc, g) => acc + (g.submission?.assignment?.maxPoints || 100), 0) * 100
          )
        : null;
      return {
        ...a,
        totalSubmissions: subs.length,
        graded: gs.length,
        avgScore,
        courseCode: teacherCourses.find(c => c.id === a.courseId)?.label || "???",
      };
    })
  , [teacherAssignments, teacherSubmissions, teacherGrades, teacherCourses]);

  const gradedAssignments = assignmentsWithStats.filter(a => a.avgScore !== null);
  const classAvg = gradedAssignments.length
    ? Math.round(gradedAssignments.reduce((s, a) => s + a.avgScore, 0) / gradedAssignments.length)
    : 0;
  const totalSubs = assignmentsWithStats.reduce((s, a) => s + a.totalSubmissions, 0);
  const totalGraded = assignmentsWithStats.reduce((s, a) => s + a.graded, 0);
  const gradingPct = totalSubs > 0 ? Math.round((totalGraded / totalSubs) * 100) : 0;
  const pendingGrading = totalSubs - totalGraded;

  const studentRoster = useMemo(() => {
    const map = {};
    teacherSubmissions.forEach(s => {
      const st = s.student;
      if (!st) return;
      const name = st.name || `${st.firstName || ""} ${st.lastName || ""}`.trim();
      if (!map[st.id]) {
        map[st.id] = {
          id: st.id,
          name,
          email: st.email,
          avatar: name.split(" ").map(n => n[0] || "").join("").toUpperCase().substring(0, 2),
          totalEarned: 0,
          totalMax: 0,
          submissions: 0,
        };
      }
      map[st.id].submissions++;
      const grade = teacherGrades.find(g => g.submissionId === s.id);
      if (grade && s.assignment) {
        map[st.id].totalEarned += grade.pointsEarned;
        map[st.id].totalMax += s.assignment.maxPoints;
      }
    });
    return Object.values(map).map(s => ({
      ...s,
      avgGrade: s.totalMax > 0 ? Math.round((s.totalEarned / s.totalMax) * 100) : 0,
      status: s.totalMax === 0
        ? "Good"
        : s.totalEarned / s.totalMax >= 0.85
          ? "Excellent"
          : s.totalEarned / s.totalMax >= 0.7
            ? "Good"
            : "At Risk",
    }));
  }, [teacherSubmissions, teacherGrades]);

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="w-full pb-16">

      <motion.div
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2"
        initial="hidden" animate="visible" variants={stagger}
      >

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-sm">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Platform Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Institution-wide overview — users, courses, enrolments, and lecturer performance across the platform.
          </p>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Lecturers" value={loading ? "—" : lecturers.length} icon={UserCheck} accent />
          <StatCard label="Total Students" value={loading ? "—" : students.length} icon={Users} />
          <StatCard label="Total Courses" value={loading ? "—" : courses.length} icon={BookOpen} />
          <StatCard label="Total Enrolments" value={loading ? "—" : enrollments.length} icon={GraduationCap} />
        </motion.div>

        {/* ── Secondary Stat Row ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-between gap-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
              <BarChart3 size={20} className="text-[#3C0078]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Avg Courses / Lecturer</span>
              <span className="text-4xl font-black italic text-gray-900">{loading ? "—" : avgCoursesPerLecturer}</span>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-between gap-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
              <Layers size={20} className="text-[#3C0078]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Unique Subjects</span>
              <span className="text-4xl font-black italic text-gray-900">{loading ? "—" : uniqueSubjects}</span>
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-between gap-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
              <Award size={20} className="text-[#3C0078]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Avg Students / Course</span>
              <span className="text-4xl font-black italic text-gray-900">
                {loading || courses.length === 0 ? "—" : (enrollments.length / courses.length).toFixed(1)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Main Grid: Courses per Lecturer + Lecturer Cards ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Courses per Lecturer table */}
          <motion.div variants={fadeUp} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Courses per Lecturer</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{lecturers.length} lecturers</span>
            </div>
            {loading ? (
              <div className="px-7 py-12 text-center text-gray-300 text-sm font-semibold">Loading…</div>
            ) : coursesPerLecturer.length === 0 ? (
              <div className="px-7 py-12 text-center text-gray-300 text-sm font-semibold">No lecturers found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30">
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Lecturer</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Courses</th>
                    <th className="px-7 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Course Codes</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesPerLecturer.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078]">
                            {l.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{l.fullName}</p>
                            <p className="text-xs text-gray-400">{l.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-7 py-4 text-center">
                        <span className="text-base font-black italic text-gray-900">{l.courseList.length}</span>
                      </td>
                      <td className="px-7 py-4">
                        <div className="flex flex-wrap gap-1">
                          {l.courseList.length === 0 ? (
                            <span className="text-xs text-gray-300">None</span>
                          ) : (
                            l.courseList.slice(0, 4).map((c, i) => (
                              <span key={c.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                                style={{ backgroundColor: `${COURSE_COLORS[i % COURSE_COLORS.length]}18`, color: COURSE_COLORS[i % COURSE_COLORS.length] }}>
                                {c.subject?.code || c.subjectId}
                              </span>
                            ))
                          )}
                          {l.courseList.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-gray-400 bg-gray-100">
                              +{l.courseList.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>

          {/* Right: Lecturer Overview Cards */}
          <motion.div variants={fadeUp} className="flex flex-col gap-4">
            <div className="bg-[#3C0078] rounded-[28px] p-6 text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Platform Summary</span>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black italic">{loading ? "—" : enrollments.length}</span>
                <span className="text-xl font-bold opacity-70">enrolments</span>
              </div>
              <p className="text-sm opacity-60">across {courses.length} courses taught by {lecturers.length} lecturers</p>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-1">Student Breakdown</h3>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm font-semibold text-gray-700">Students</span>
                <span className="text-base font-black italic text-gray-900">{loading ? "—" : students.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm font-semibold text-gray-700">Lecturers</span>
                <span className="text-base font-black italic text-gray-900">{loading ? "—" : lecturers.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm font-semibold text-gray-700">Admins</span>
                <span className="text-base font-black italic text-gray-900">
                  {loading ? "—" : users.filter(u => u.role?.toLowerCase() === "admin").length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-gray-700">Total Users</span>
                <span className="text-base font-black italic text-[#3C0078]">{loading ? "—" : users.length}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════════════════ LECTURER ANALYTICS SECTION ════════════════ */}
        <motion.div variants={fadeUp} className="flex flex-col gap-6">

          {/* Section header + lecturer picker */}
          <div className="rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  {selectedTeacher ? (
                    <motion.div
                      key={selectedTeacher.id}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="w-12 h-12 rounded-full bg-[#3C0078]/10 flex items-center justify-center font-black text-[#3C0078] text-base shrink-0"
                    >
                      {`${selectedTeacher.firstName?.[0] || ""}${selectedTeacher.lastName?.[0] || ""}`.toUpperCase()}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTeacher
                      ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                      : "Lecturer Analytics"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selectedTeacher
                      ? `${selectedTeacher.email} · ${teacherCourses.length} course${teacherCourses.length !== 1 ? "s" : ""}`
                      : "Select a lecturer to view their teaching analytics."}
                  </p>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="appearance-none rounded-full border border-gray-200 bg-white px-5 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-[#3C0078] focus:ring-2 focus:ring-[#3C0078]/20 transition-all cursor-pointer min-w-[220px]"
                >
                  <option value="">— Select a Lecturer —</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Teacher analytics panel */}
          <AnimatePresence>
            {!selectedTeacherId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-[28px] border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center text-center"
              >
                <BarChart3 size={36} className="text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">Select a lecturer above to view their analytics.</p>
              </motion.div>
            ) : teacherLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-[28px] border border-gray-100 bg-white p-16 flex flex-col items-center gap-3 text-center shadow-sm"
              >
                <div className="w-8 h-8 border-2 border-[#3C0078]/30 border-t-[#3C0078] rounded-full animate-spin" />
                <p className="text-sm font-semibold text-gray-400">Loading lecturer analytics…</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedTeacherId}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* Stat cards – mirrors TeacherAnalytics */}
                <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={stagger}>
                  <motion.div
                    variants={fadeUp}
                    className="rounded-[28px] p-6 flex flex-col justify-between gap-4 bg-[#3C0078] text-white hover:shadow-lg transition-all"
                  >
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15">
                      <Target size={20} className="text-white" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-white/60">Class Average</span>
                      <span className="text-4xl font-black italic text-white">{classAvg}%</span>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp} className="rounded-[28px] p-6 flex flex-col justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
                      <Users size={20} className="text-[#3C0078]" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Total Students</span>
                      <span className="text-4xl font-black italic text-gray-900">{studentRoster.length}</span>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp} className="rounded-[28px] p-6 flex flex-col justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
                      <CheckCircle size={20} className="text-[#3C0078]" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Grading Progress</span>
                      <span className="text-4xl font-black italic text-gray-900">{gradingPct}%</span>
                    </div>
                  </motion.div>
                  <motion.div variants={fadeUp} className="rounded-[28px] p-6 flex flex-col justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#3C0078]/5">
                      <Clock size={20} className="text-[#3C0078]" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] block mb-1 text-gray-400">Pending to Grade</span>
                      <span className="text-4xl font-black italic text-gray-900">{pendingGrading}</span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Courses grid */}
                {teacherCourses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Course Averages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {teacherCourses.map(course => {
                        const avg = gradedAssignments.filter(a => a.courseId === course.id);
                        const courseAvg = avg.length
                          ? Math.round(avg.reduce((s, a) => s + a.avgScore, 0) / avg.length)
                          : 0;
                        const enrolled = studentRoster.filter(s =>
                          teacherSubmissions.some(sub => sub.assignment?.courseId === course.id && sub.studentId === s.id)
                        ).length;
                        const yearLevel = parseInt(course.number, 10) >= 300
                          ? "3rd Year"
                          : parseInt(course.number, 10) >= 200
                            ? "2nd Year"
                            : "1st Year";
                        return (
                          <motion.div key={course.id} whileHover={{ y: -3 }}
                            className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 transition-all hover:border-[#3C0078]/20">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="relative shrink-0">
                                <ProgressRing percent={courseAvg} color={course.color} />
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-black italic text-gray-900">{courseAvg}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{course.label}</p>
                                <p className="text-xs text-gray-400 truncate">{course.subjectName}</p>
                              </div>
                            </div>
                            <div className="flex justify-between mt-3 text-xs text-gray-400">
                              <span>{enrolled} students</span>
                              <span>{yearLevel}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grading Progress Table */}
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Grading Progress</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{assignmentsWithStats.length} assignments</span>
                  </div>
                  {assignmentsWithStats.length === 0 ? (
                    <div className="px-7 py-10 text-center text-gray-300 text-sm font-semibold">No assignments found.</div>
                  ) : (
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
                        {assignmentsWithStats.map(a => {
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
                                {noGrades
                                  ? <span className="text-xs text-gray-300">—</span>
                                  : <span className="text-base font-black italic text-gray-900">{a.avgScore}%</span>}
                              </td>
                              <td className="px-7 py-4 text-xs text-gray-400">
                                {a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </td>
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
                  )}
                </div>

                {/* Student Roster */}
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-7 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Student Performance</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{studentRoster.length} students</span>
                  </div>
                  {studentRoster.length === 0 ? (
                    <div className="px-7 py-10 text-center text-gray-300 text-sm font-semibold">No student data yet.</div>
                  ) : (
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
                                <div className="w-10 h-10 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078]">
                                  {s.avatar}
                                </div>
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
                            <td className="px-7 py-4 text-center text-sm font-bold text-gray-700">{s.submissions}</td>
                            <td className="px-7 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                s.status === "Excellent" ? "bg-green-50 text-green-600" :
                                s.status === "Good" ? "bg-blue-50 text-blue-600" :
                                "bg-amber-50 text-amber-600"
                              }`}>{s.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </motion.div>
    </div>
  );
}