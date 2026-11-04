import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Avatar, Select } from "../../components/UI";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

const COURSE_COLORS = [
  "var(--color-koru-primary)", "#14B8A6", "#6366F1", "#F59E0B", "#EC4899",
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

/* ─── progress ring ─── */
function ProgressRing({ percent, size = 56, stroke = 5, color = "var(--color-koru-primary)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-koru-surface-container-high)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
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
        const allCoursesRes = await fetch(`${API_BASE}/Course`);
        const allCoursesData = allCoursesRes.ok ? await allCoursesRes.json() : [];
        const raw = Array.isArray(allCoursesData)
          ? allCoursesData.filter(c => c.teacherId === selectedTeacherId || c.teacher?.id === selectedTeacherId)
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

  const coursesPerLecturer = useMemo(
    () =>
      lecturers
        .map(l => ({
          ...l,
          fullName: `${l.firstName} ${l.lastName}`,
          avatar: `${l.firstName?.[0] || ""}${l.lastName?.[0] || ""}`.toUpperCase(),
          courseList: courses.filter(c => c.teacherId === l.id || c.teacher?.id === l.id),
        }))
        .sort((a, b) => b.courseList.length - a.courseList.length),
    [lecturers, courses]
  );

  const avgCoursesPerLecturer = lecturers.length ? (courses.length / lecturers.length).toFixed(1) : 0;

  const uniqueSubjects = useMemo(() => {
    const ids = new Set(courses.map(c => c.subjectId || c.subject?.id).filter(Boolean));
    return ids.size || courses.length;
  }, [courses]);

  /* ── derived teacher analytics stats ── */
  const selectedTeacher = useMemo(
    () => users.find(u => u.id === selectedTeacherId),
    [users, selectedTeacherId]
  );

  const assignmentsWithStats = useMemo(
    () =>
      teacherAssignments.map(a => {
        const subs = teacherSubmissions.filter(s => s.assignmentId === a.id);
        const gs = teacherGrades.filter(g => g.submission?.assignmentId === a.id);
        const avgScore =
          gs.length > 0
            ? Math.round(
                (gs.reduce((acc, g) => acc + g.pointsEarned, 0) /
                  gs.reduce((acc, g) => acc + (g.submission?.assignment?.maxPoints || 100), 0)) *
                  100
              )
            : null;
        return {
          ...a,
          totalSubmissions: subs.length,
          graded: gs.length,
          avgScore,
          courseCode: teacherCourses.find(c => c.id === a.courseId)?.label || "???",
        };
      }),
    [teacherAssignments, teacherSubmissions, teacherGrades, teacherCourses]
  );

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
          profileImageUrl: st.profileImageUrl,
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
      status:
        s.totalMax === 0
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

        {/* ── KPI Row ── */}
        <motion.div variants={fadeUp} className="flex flex-row divide-x divide-koru-outline-faint bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card px-6 py-5">
          {[
            { label: "Total Lecturers", value: loading ? "—" : lecturers.length, sub: "teaching staff" },
            { label: "Total Students", value: loading ? "—" : students.length, sub: "enrolled platform-wide" },
            { label: "Total Courses", value: loading ? "—" : courses.length, sub: "active courses" },
            { label: "Total Enrolments", value: loading ? "—" : enrollments.length, sub: "across all courses" },
          ].map((kpi, i) => (
            <div key={i} className={`flex flex-col gap-1 flex-1 ${i === 0 ? "pr-6" : "px-6"}`}>
              <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{kpi.label}</p>
              <p className="text-2xl font-medium leading-none text-koru-on-surface">{kpi.value}</p>
              <p className="text-xs text-koru-on-surface-variant truncate mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Main Grid: Courses per Lecturer + Sidebar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Courses per Lecturer table */}
          <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
            <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
              <h2 className="font-display text-base font-medium text-koru-on-surface">Courses per Lecturer</h2>
              <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                {lecturers.length} lecturers
              </span>
            </div>
            {loading ? (
              <div className="divide-y divide-koru-outline-faint animate-pulse">
                {[140, 180, 110, 160, 130].map((w, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-koru-surface-container-high shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-koru-surface-container-highest" style={{ width: w }} />
                    </div>
                    <div className="h-6 rounded-full bg-koru-surface-container-high w-8" />
                    <div className="h-5 rounded-full bg-koru-surface-container-high" style={{ width: `${70 + i * 18}px` }} />
                  </div>
                ))}
              </div>
            ) : coursesPerLecturer.length === 0 ? (
              <div className="px-6 py-12 text-center text-koru-outline text-sm font-medium">No lecturers found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-koru-surface-container-low">
                    <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Lecturer</th>
                    <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-center">Courses</th>
                    <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Course Codes</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesPerLecturer.map(l => (
                    <tr key={l.id} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={l} name={l.name} size={36} />
                          <div>
                            <p className="font-medium text-sm text-koru-on-surface">{l.fullName}</p>
                            <p className="text-xs text-koru-on-surface-variant">{l.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-koru-on-surface">{l.courseList.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {l.courseList.length === 0 ? (
                            <span className="text-xs text-koru-outline">None</span>
                          ) : (
                            l.courseList.slice(0, 4).map((c, i) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 rounded-full text-koru-caption font-medium uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${COURSE_COLORS[i % COURSE_COLORS.length]}18`,
                                  color: COURSE_COLORS[i % COURSE_COLORS.length],
                                }}
                              >
                                {c.subject?.code || c.subjectId}
                              </span>
                            ))
                          )}
                          {l.courseList.length > 4 && (
                            <span className="px-2 py-0.5 rounded-full text-koru-caption font-medium text-koru-on-surface-variant bg-koru-surface-container-high">
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

          {/* Right sidebar */}
          <motion.div variants={fadeUp} className="flex flex-col gap-4">

            {/* Platform at a Glance */}
            <div className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-4">Platform at a Glance</p>
              <div className="space-y-0">
                {[
                  { label: "Avg Courses / Lecturer", value: loading ? "—" : avgCoursesPerLecturer },
                  { label: "Unique Subjects", value: loading ? "—" : uniqueSubjects },
                  {
                    label: "Avg Students / Course",
                    value: loading || courses.length === 0 ? "—" : (enrollments.length / courses.length).toFixed(1),
                  },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between py-3 border-b border-koru-outline-faint last:border-0">
                    <span className="text-sm text-koru-on-surface-variant">{stat.label}</span>
                    <span className="text-base font-medium text-koru-on-surface">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Breakdown */}
            <div className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <h3 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-1">User Breakdown</h3>
              <div className="space-y-0">
                {[
                  { label: "Students", value: loading ? "—" : students.length },
                  { label: "Lecturers", value: loading ? "—" : lecturers.length },
                  { label: "Admins", value: loading ? "—" : users.filter(u => u.role?.toLowerCase() === "admin").length },
                  { label: "Total Users", value: loading ? "—" : users.length, highlight: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-koru-outline-faint last:border-0">
                    <span className="text-sm text-koru-on-surface-variant">{item.label}</span>
                    <span className={`text-base font-medium ${item.highlight ? "text-koru-primary" : "text-koru-on-surface"}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

        {/* ════════════════ LECTURER ANALYTICS SECTION ════════════════ */}
        <motion.div variants={fadeUp} className="flex flex-col gap-6">

          {/* Section header + lecturer picker */}
          <div className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  {selectedTeacher && (
                    <motion.div
                      key={selectedTeacher.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <Avatar user={selectedTeacher} name={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`} size={40} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <h2 className="font-display text-base font-medium text-koru-on-surface">
                    {selectedTeacher
                      ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                      : "Lecturer Analytics"}
                  </h2>
                  <p className="text-sm text-koru-on-surface-variant mt-0.5">
                    {selectedTeacher
                      ? `${selectedTeacher.email} · ${teacherCourses.length} course${teacherCourses.length !== 1 ? "s" : ""}`
                      : "Select a lecturer to view their teaching analytics."}
                  </p>
                </div>
              </div>
              <Select
                size="sm"
                containerClassName="w-auto min-w-[220px]"
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
              >
                <option value="">— Select a Lecturer —</option>
                {lecturers.map(l => (
                  <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* Teacher analytics panel */}
          <AnimatePresence>
            {!selectedTeacherId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-koru-lg border border-dashed border-koru-outline-variant bg-koru-surface-container-low flex flex-col items-center justify-center text-center py-16 gap-3"
              >
                <BarChart3 size={32} className="text-koru-outline" />
                <p className="text-sm font-medium text-koru-on-surface-variant">Select a lecturer above to view their analytics.</p>
              </motion.div>
            ) : teacherLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-6 animate-pulse"
              >
                <div className="h-20 rounded-koru-lg bg-koru-surface-container-high" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="rounded-koru-lg h-28 bg-koru-surface-container-high" />)}
                </div>
                <div className="rounded-koru-lg h-48 bg-koru-surface-container-high" />
                <div className="rounded-koru-lg h-48 bg-koru-surface-container-high" />
              </motion.div>
            ) : (
              <motion.div
                key={selectedTeacherId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* KPI row */}
                <div className="flex flex-row divide-x divide-koru-outline-faint bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card px-6 py-5">
                  {[
                    { label: "Class Average", value: `${classAvg}%`, sub: `across ${teacherCourses.length} course${teacherCourses.length !== 1 ? "s" : ""}` },
                    { label: "Total Students", value: studentRoster.length, sub: "enrolled" },
                    { label: "Grading Progress", value: `${gradingPct}%`, sub: `${totalGraded} of ${totalSubs} graded` },
                    { label: "Pending to Grade", value: pendingGrading, sub: "submissions" },
                  ].map((kpi, i) => (
                    <div key={i} className={`flex flex-col gap-1 flex-1 ${i === 0 ? "pr-6" : "px-6"}`}>
                      <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{kpi.label}</p>
                      <p className="text-2xl font-medium leading-none text-koru-on-surface">{kpi.value}</p>
                      <p className="text-xs text-koru-on-surface-variant truncate mt-0.5">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Course averages */}
                {teacherCourses.length > 0 && (
                  <div>
                    <h3 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-3">Course Averages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {teacherCourses.map(course => {
                        const avg = gradedAssignments.filter(a => a.courseId === course.id);
                        const courseAvg = avg.length
                          ? Math.round(avg.reduce((s, a) => s + a.avgScore, 0) / avg.length)
                          : 0;
                        const enrolled = studentRoster.filter(s =>
                          teacherSubmissions.some(
                            sub => sub.assignment?.courseId === course.id && sub.studentId === s.id
                          )
                        ).length;
                        const yearLevel =
                          parseInt(course.number, 10) >= 300
                            ? "3rd Year"
                            : parseInt(course.number, 10) >= 200
                            ? "2nd Year"
                            : "1st Year";
                        return (
                          <div key={course.id} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-5 hover:ring-koru-outline-variant transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative shrink-0">
                                <ProgressRing percent={courseAvg} color={course.color} />
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-koru-on-surface">
                                  {courseAvg}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-koru-on-surface truncate">{course.label}</p>
                                <p className="text-xs text-koru-on-surface-variant truncate">{course.subjectName}</p>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-koru-on-surface-variant">
                              <span>{enrolled} students</span>
                              <span>{yearLevel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grading Progress Table */}
                <div className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
                    <h3 className="font-display text-base font-medium text-koru-on-surface">Grading Progress</h3>
                    <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                      {assignmentsWithStats.length} assignments
                    </span>
                  </div>
                  {assignmentsWithStats.length === 0 ? (
                    <div className="px-6 py-10 text-center text-koru-outline text-sm font-medium">No assignments found.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-koru-surface-container-low">
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Assignment</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Course</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-center">Graded</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-center">Avg Score</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Due Date</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignmentsWithStats.map(a => {
                          const pct = a.totalSubmissions > 0 ? Math.round((a.graded / a.totalSubmissions) * 100) : 0;
                          const done = a.graded === a.totalSubmissions && a.totalSubmissions > 0;
                          const noGrades = a.avgScore === null;
                          return (
                            <tr key={a.id} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-medium text-sm text-koru-on-surface">{a.title}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-medium text-koru-on-surface-variant">{a.courseCode}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-medium text-koru-on-surface">{a.graded}/{a.totalSubmissions}</span>
                                  <div className="w-12 h-1 bg-koru-surface-container-high rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${done ? "bg-koru-success" : pct > 50 ? "bg-koru-accent" : "bg-koru-error"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {noGrades
                                  ? <span className="text-xs text-koru-outline">—</span>
                                  : <span className="text-sm font-medium text-koru-on-surface">{a.avgScore}%</span>}
                              </td>
                              <td className="px-6 py-4 text-xs text-koru-on-surface-variant">
                                {a.dueDate
                                  ? new Date(a.dueDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })
                                  : "—"}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-koru-caption font-medium uppercase tracking-widest ${
                                  done ? "bg-koru-success-soft text-koru-success" :
                                  noGrades ? "bg-koru-surface-container-high text-koru-on-surface-variant" :
                                  "bg-koru-warning-soft text-koru-warning"
                                }`}>
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
                <div className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
                    <h3 className="font-display text-base font-medium text-koru-on-surface">Student Performance</h3>
                    <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                      {studentRoster.length} students
                    </span>
                  </div>
                  {studentRoster.length === 0 ? (
                    <div className="px-6 py-10 text-center text-koru-outline text-sm font-medium">No student data yet.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-koru-surface-container-low">
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Student</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-center">Avg Grade</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-center">Submitted</th>
                          <th className="px-6 py-3.5 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentRoster.map(s => (
                          <tr key={s.id} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar user={s} name={s.name} size={36} />
                                <div>
                                  <p className="font-medium text-sm text-koru-on-surface">{s.name}</p>
                                  <p className="text-xs text-koru-on-surface-variant">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-medium text-koru-on-surface">{s.avgGrade}%</span>
                                <div className="w-12 h-1 bg-koru-surface-container-high rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${s.avgGrade >= 75 ? "bg-koru-success" : s.avgGrade >= 50 ? "bg-koru-accent" : "bg-koru-error"}`}
                                    style={{ width: `${s.avgGrade}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-medium text-koru-on-surface-variant">{s.submissions}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-koru-caption font-medium uppercase tracking-widest ${
                                s.status === "Excellent" ? "bg-koru-success-soft text-koru-success" :
                                s.status === "Good" ? "bg-koru-info-soft text-koru-info" :
                                "bg-koru-warning-soft text-koru-warning"
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
