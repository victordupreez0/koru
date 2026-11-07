import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardList, GraduationCap, Hourglass, Layers,
  TrendingUp, UserRound, Users,
} from "lucide-react";
import { Avatar, Badge, Card, Select, Skeleton } from "../../components/UI";
import { KoruDonut, KoruGauge } from "../../components/UI/charts/KoruCharts";
import { koruSeriesPalette } from "../../components/UI/charts/koruChartTheme";
import {
  CountUp, AnalyticsHeader, DataTable, Panel, PanelEmpty, ScoreMeter, SectionLabel, StatTiles,
} from "./components/AnalyticsUI";
import { rise, stagger, td, tdWrap, tr } from "./components/analyticsStyles";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

const COURSE_COLORS = [
  "#3C0078", "#14B8A6", "#6366F1", "#F59E0B", "#EC4899",
  "#10B981", "#8B5CF6", "#EF4444", "#3B82F6", "#84CC16",
];

const CHIP_VARIANTS = ["primary", "info", "accent", "success", "secondary", "tertiary"];
const STATUS_BADGE = { Excellent: "success", Good: "info", "At Risk": "warning", Critical: "error" };

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
  const lecturerSectionRef = useRef(null);

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
  const adminCount = users.filter(u => u.role?.toLowerCase() === "admin").length;
  const avgStudentsPerCourse = courses.length ? (enrollments.length / courses.length).toFixed(1) : "0";
  const userSlices = [
    { label: "Students", value: students.length, color: koruSeriesPalette[0] },
    { label: "Lecturers", value: lecturers.length, color: koruSeriesPalette[1] },
    { label: "Admins", value: adminCount, color: koruSeriesPalette[2] },
  ];

  const openLecturer = id => {
    setSelectedTeacherId(id);
    requestAnimationFrame(() =>
      lecturerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <motion.div
      className="flex w-full flex-col gap-6 pb-16"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <AnalyticsHeader
        title="Platform insights"
        subtitle="People, courses and teaching activity across Koru."
      />

      <StatTiles
        loading={loading}
        stats={[
          { icon: UserRound, label: "Lecturers", value: lecturers.length, variant: "purple" },
          { icon: Users, label: "Students", value: students.length, variant: "sky" },
          { icon: BookOpen, label: "Courses", value: courses.length, variant: "orange" },
          { icon: Layers, label: "Enrolments", value: enrollments.length, variant: "emerald" },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Courses per lecturer"
          description="Select a lecturer to see their teaching analytics"
          action={<Badge>{lecturers.length} lecturers</Badge>}
        >
          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton variant="circle" className="h-9 w-9" />
                  <Skeleton variant="text" className="w-40" />
                  <Skeleton variant="text" className="ml-auto w-24" />
                </div>
              ))}
            </div>
          ) : coursesPerLecturer.length === 0 ? (
            <PanelEmpty icon={UserRound}>No lecturers found.</PanelEmpty>
          ) : (
            <DataTable
              columns={[
                { label: "Lecturer" },
                { label: "Courses", className: "text-right" },
                { label: "Course codes" },
                { label: "", className: "w-10" },
              ]}
            >
              {coursesPerLecturer.map(l => {
                const selected = selectedTeacherId === l.id;
                return (
                  <tr
                    key={l.id}
                    tabIndex={0}
                    onClick={() => openLecturer(l.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLecturer(l.id);
                      }
                    }}
                    aria-selected={selected}
                    className={`${tr} group cursor-pointer outline-none focus-visible:bg-koru-primary-subtle ${selected ? "bg-koru-primary-subtle" : ""}`}
                  >
                    <td className={tdWrap}>
                      <div className="flex items-center gap-3">
                        <Avatar user={l} name={l.fullName} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-koru-on-surface">{l.fullName}</p>
                          <p className="truncate text-koru-caption text-koru-on-surface-variant">{l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} text-right font-display text-lg tabular-nums text-koru-on-surface`}>
                      {l.courseList.length}
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        {l.courseList.length === 0 ? (
                          <span className="text-sm text-koru-on-surface-variant">None</span>
                        ) : (
                          l.courseList.slice(0, 4).map((c, i) => (
                            <Badge key={c.id} variant={CHIP_VARIANTS[i % CHIP_VARIANTS.length]}>
                              {c.subject?.code || c.subjectId}
                            </Badge>
                          ))
                        )}
                        {l.courseList.length > 4 && <Badge>+{l.courseList.length - 4}</Badge>}
                      </div>
                    </td>
                    <td className={td}>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="text-koru-outline transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-koru-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="User breakdown" description={`${users.length} accounts in total`}>
            <div className="flex items-center gap-5">
              <KoruDonut items={userSlices} size={148} centerValue={loading ? "—" : <CountUp value={users.length} />} centerLabel="users" />
              <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
                {userSlices.map(sl => (
                  <li key={sl.label} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sl.color }} aria-hidden="true" />
                    <span className="flex-1 text-koru-on-surface-variant">{sl.label}</span>
                    <span className="font-semibold tabular-nums text-koru-on-surface">{loading ? "—" : sl.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="At a glance">
            <dl className="grid grid-cols-1 gap-2">
              {[
                { label: "Avg courses per lecturer", value: avgCoursesPerLecturer, decimals: 1 },
                { label: "Unique subjects", value: uniqueSubjects, decimals: 0 },
                { label: "Avg students per course", value: avgStudentsPerCourse, decimals: 1 },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between rounded-koru-md bg-koru-surface-container-low px-3 py-2.5">
                  <dt className="text-sm text-koru-on-surface-variant">{stat.label}</dt>
                  <dd className="font-display text-lg text-koru-on-surface">
                    {loading ? "—" : <CountUp value={Number(stat.value)} decimals={stat.decimals} />}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      {/* ════════════════ LECTURER ANALYTICS ════════════════ */}
      <motion.section variants={rise} ref={lecturerSectionRef} className="flex scroll-mt-6 flex-col gap-6">
        <Card variant="outlined" tone="low" radius="lg" padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTeacher?.id || "none"}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
              >
                {selectedTeacher ? (
                  <Avatar user={selectedTeacher} name={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`} size="lg" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-koru-primary-container text-koru-on-primary-container">
                    <BarChart3 size={20} aria-hidden="true" />
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="min-w-0">
              <h2 className="font-display text-koru-heading text-koru-on-surface">
                {selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : "Lecturer analytics"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-koru-on-surface-variant">
                {selectedTeacher
                  ? `${selectedTeacher.email} · ${teacherCourses.length} course${teacherCourses.length !== 1 ? "s" : ""}`
                  : "Pick a lecturer to see their courses, grading and students."}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-64">
            <Select
              size="sm"
              label="Lecturer"
              labelClassName="text-koru-caption uppercase tracking-wider"
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="cursor-pointer font-medium"
            >
              <option value="">Select a lecturer</option>
              {lecturers.map(l => (
                <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
              ))}
            </Select>
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {!selectedTeacherId ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-koru-lg border border-dashed border-koru-outline-variant bg-koru-surface-container-low"
            >
              <PanelEmpty icon={BarChart3}>Select a lecturer above, or click a row in the table.</PanelEmpty>
            </motion.div>
          ) : teacherLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[92px] rounded-koru-lg" />)}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-koru-lg" />)}
              </div>
              <Skeleton className="h-56 rounded-koru-lg" />
            </motion.div>
          ) : (
            <motion.div
              key={selectedTeacherId}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8 }}
              variants={stagger}
              className="flex flex-col gap-6"
            >
              <StatTiles
                stats={[
                  { icon: TrendingUp, label: "Class average", value: classAvg, suffix: "%", variant: "purple" },
                  { icon: Users, label: "Students", value: studentRoster.length, variant: "sky" },
                  { icon: CheckCircle2, label: "Graded", value: gradingPct, suffix: "%", variant: "emerald", hint: `${totalGraded} of ${totalSubs}` },
                  { icon: Hourglass, label: "Left to grade", value: pendingGrading, variant: "orange" },
                ]}
              />

              {teacherCourses.length > 0 && (
                <motion.div variants={rise}>
                  <SectionLabel>Course averages</SectionLabel>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {teacherCourses.map(course => {
                      const avg = gradedAssignments.filter(a => a.courseId === course.id);
                      const courseAvg = avg.length ? Math.round(avg.reduce((sum, a) => sum + a.avgScore, 0) / avg.length) : 0;
                      const enrolled = studentRoster.filter(st =>
                        teacherSubmissions.some(sub => sub.assignment?.courseId === course.id && sub.studentId === st.id),
                      ).length;
                      const n = parseInt(course.number, 10);
                      const yearLevel = n >= 300 ? "3rd Year" : n >= 200 ? "2nd Year" : "1st Year";
                      return (
                        <Card
                          key={course.id}
                          variant="interactive"
                          tone="surface"
                          radius="lg"
                          padding="sm"
                          className="flex items-center gap-4 bg-koru-surface-container-lowest"
                        >
                          <KoruGauge value={courseAvg} size={60} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-koru-on-surface">{course.label}</p>
                            <p className="truncate text-sm text-koru-on-surface-variant">{course.subjectName}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge>{enrolled} students</Badge>
                              <Badge variant="secondary">{yearLevel}</Badge>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <Panel title="Grading progress" description={`${assignmentsWithStats.length} assignments`}>
                {assignmentsWithStats.length === 0 ? (
                  <PanelEmpty icon={ClipboardList}>No assignments yet.</PanelEmpty>
                ) : (
                  <DataTable
                    columns={[
                      { label: "Assignment" },
                      { label: "Course" },
                      { label: "Graded", className: "w-44" },
                      { label: "Avg score", className: "text-right" },
                      { label: "Due" },
                      { label: "Status" },
                    ]}
                  >
                    {assignmentsWithStats.map(a => {
                      const pct = a.totalSubmissions > 0 ? Math.round((a.graded / a.totalSubmissions) * 100) : 0;
                      const done = a.graded === a.totalSubmissions && a.totalSubmissions > 0;
                      const noGrades = a.avgScore === null;
                      return (
                        <tr key={a.id} className={tr}>
                          <td className={tdWrap}><span className="font-medium text-koru-on-surface">{a.title}</span></td>
                          <td className={td}><Badge variant="primary">{a.courseCode}</Badge></td>
                          <td className={td}>
                            <ScoreMeter
                              value={pct}
                              label={`${a.graded}/${a.totalSubmissions}`}
                              tone={a.totalSubmissions === 0 ? "neutral" : done ? "success" : pct > 50 ? "warning" : "error"}
                            />
                          </td>
                          <td className={`${td} text-right`}>
                            {noGrades ? (
                              <span className="text-koru-on-surface-variant">—</span>
                            ) : (
                              <span className="font-semibold tabular-nums text-koru-on-surface">{a.avgScore}%</span>
                            )}
                          </td>
                          <td className={`${td} text-sm text-koru-on-surface-variant`}>
                            {a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }) : "—"}
                          </td>
                          <td className={td}>
                            <Badge variant={done ? "success" : noGrades ? "neutral" : "warning"} dot>
                              {done ? "Complete" : noGrades ? "Not started" : "In progress"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTable>
                )}
              </Panel>

              <Panel title="Student performance" description={`${studentRoster.length} students, sorted by average grade`}>
                {studentRoster.length === 0 ? (
                  <PanelEmpty icon={GraduationCap}>No student submissions yet.</PanelEmpty>
                ) : (
                  <DataTable
                    columns={[
                      { label: "Student" },
                      { label: "Avg grade", className: "w-48" },
                      { label: "Submitted", className: "text-right" },
                      { label: "Status" },
                    ]}
                  >
                    {[...studentRoster].sort((a, b) => b.avgGrade - a.avgGrade).map(st => (
                      <tr key={st.id} className={tr}>
                        <td className={tdWrap}>
                          <div className="flex items-center gap-3">
                            <Avatar user={st} name={st.name} size={36} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-koru-on-surface">{st.name}</p>
                              <p className="truncate text-koru-caption text-koru-on-surface-variant">{st.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={td}><ScoreMeter value={st.avgGrade} /></td>
                        <td className={`${td} text-right text-sm tabular-nums text-koru-on-surface`}>{st.submissions}</td>
                        <td className={td}><Badge variant={STATUS_BADGE[st.status]} dot>{st.status}</Badge></td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
