import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, ClipboardList, FileText, GraduationCap, Hourglass, RotateCcw, TrendingUp, Users,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { getTeacherCourses } from "../../services/courseService";
import { getCourseAssignments } from "../../services/assignmentService";
import { getCourseSubmissions } from "../../services/submissionService";
import { getCourseGrades } from "../../services/gradeService";
import { YEARS, SEMESTERS, YEAR_LEVELS } from "./teacherMockData";
import { Avatar, Badge, Button, Card } from "../../components/UI";
import { KoruBarList, KoruGauge } from "../../components/UI/charts/KoruCharts";
import { koruChartColors } from "../../components/UI/charts/koruChartTheme";
import {
  AnalyticsHeader, DataTable, FilterSelect, Panel, PanelEmpty, ScoreMeter, SectionLabel, StatTiles,
} from "./components/AnalyticsUI";
import { rise, stagger, td, tdWrap, tr } from "./components/analyticsStyles";

const STATUS_BADGE = { Excellent: "success", Good: "info", "At Risk": "warning", Critical: "error" };
const ROSTER_FILTERS = ["All", "Excellent", "Good", "At Risk", "Critical"];
const BAND_COLORS = [
  koruChartColors.success,
  "#1e9e57", // koru-stat-green
  koruChartColors.info,
  koruChartColors.accent,
  koruChartColors.error,
];

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function TeacherAnalytics() {
  const { user } = useAuth();

  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedSemester, setSelectedSemester] = useState("Semester 1");
  const [selectedYearLevel, setSelectedYearLevel] = useState("All");
  const [selectedCourseId, setSelectedCourseId] = useState("all");

  const [teacherCourses, setTeacherCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterFilter, setRosterFilter] = useState("All");

  useEffect(() => {
    let mounted = true;
    async function fetchCourses() {
      if (!user?.userId) return;
      try {
        const data = await getTeacherCourses(user.userId);
        const mapped = (data || []).map(c => ({
          id: c.id,
          code: c.subject?.code || c.code || "???",
          name: c.subject?.name || c.name || "Course",
          label: c.subject?.code || c.code || "???",
          yearLevel: c.yearLevel || "3rd Year",
          semester: c.term || c.semester || "Semester 1",
          year: String(c.year || c.academicYear || new Date().getFullYear()),
          enrolled: c.enrollments?.length || 0,
          color: "#3C0078",
        }));
        if (mounted) setTeacherCourses(mapped);
      } catch (err) {
        console.error("Failed to load teacher courses:", err);
      }
    }
    fetchCourses();
    return () => { mounted = false; };
  }, [user?.userId]);

  const filteredCourses = useMemo(
    () =>
      teacherCourses.filter(
        c =>
          c.year === selectedYear &&
          c.semester === selectedSemester &&
          (selectedYearLevel === "All" || c.yearLevel === selectedYearLevel)
      ),
    [teacherCourses, selectedYear, selectedSemester, selectedYearLevel]
  );

  const activeCourseIds = useMemo(
    () => selectedCourseId === "all" ? filteredCourses.map(c => c.id) : [selectedCourseId],
    [selectedCourseId, filteredCourses]
  );

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (filteredCourses.length === 0) { setLoading(false); return; }
      try {
        setLoading(true);
        const promises = filteredCourses.map(async c => {
          const [a, s, g] = await Promise.all([
            getCourseAssignments(c.id).catch(() => []),
            getCourseSubmissions(c.id).catch(() => []),
            getCourseGrades(c.id).catch(() => []),
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
        courseCode: filteredCourses.find(c => c.id === a.courseId)?.label || "???",
      };
    });
  }, [assignments, submissions, grades, activeCourseIds, filteredCourses]);

  const studentRoster = useMemo(() => {
    const studentMap = {};
    submissions
      .filter(s => activeCourseIds.includes(s.assignment?.courseId))
      .forEach(s => {
        const student = s.student;
        if (!student) return;
        if (!studentMap[student.id]) {
          studentMap[student.id] = {
            id: student.id,
            name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student",
            email: student.email,
            profileImageUrl: student.profileImageUrl,
            avatar:
              (student.name || `${student.firstName || ""} ${student.lastName || ""}`)
                .split(" ")
                .filter(Boolean)
                .map(n => n[0])
                .join("")
                .toUpperCase() || "S",
            totalEarned: 0,
            totalMax: 0,
            submissions: 0,
            totalAssignments: filteredAssignments.filter(a => a.courseId === s.assignment?.courseId).length,
          };
        }
        studentMap[student.id].submissions++;
        const grade = grades.find(g => g.submissionId === s.id);
        if (grade && s.assignment) {
          studentMap[student.id].totalEarned += grade.pointsEarned || 0;
          studentMap[student.id].totalMax += s.assignment.maxPoints || 0;
        }
      });
    return Object.values(studentMap).map(s => ({
      ...s,
      avgGrade: s.totalMax > 0 ? Math.round((s.totalEarned / s.totalMax) * 100) : 0,
      status:
        s.totalMax === 0
          ? "Good"
          : s.totalEarned / s.totalMax >= 0.85
          ? "Excellent"
          : s.totalEarned / s.totalMax >= 0.7
          ? "Good"
          : s.totalEarned / s.totalMax >= 0.5
          ? "At Risk"
          : "Critical",
    }));
  }, [submissions, grades, activeCourseIds, filteredAssignments]);

  /* ─── derived stats ─── */
  const gradedAssignments = filteredAssignments.filter(a => a.avgScore !== null);
  const classAvg = gradedAssignments.length
    ? Math.round(gradedAssignments.reduce((s, a) => s + a.avgScore, 0) / gradedAssignments.length)
    : 0;
  const totalStudents =
    filteredCourses.filter(c => activeCourseIds.includes(c.id)).reduce((s, c) => s + (c.enrolled || 0), 0) ||
    studentRoster.length;
  const totalSubs = filteredAssignments.reduce((s, a) => s + a.totalSubmissions, 0);
  const totalGraded = filteredAssignments.reduce((s, a) => s + a.graded, 0);
  const pendingGrading = totalSubs - totalGraded;
  const gradingPct = totalSubs > 0 ? Math.round((totalGraded / totalSubs) * 100) : 0;

  /* ─── SA grade distribution from real data ─── */
  const gradeDistribution = useMemo(() => {
    const bands = [
      { range: "80%+",   count: 0 },
      { range: "70–79%", count: 0 },
      { range: "60–69%", count: 0 },
      { range: "50–59%", count: 0 },
      { range: "<50%",   count: 0 },
    ];
    grades.forEach(g => {
      if (g.pointsEarned == null) return;
      const maxPts = g.submission?.assignment?.maxPoints;
      if (!maxPts) return;
      const pct = (g.pointsEarned / maxPts) * 100;
      if (pct >= 80) bands[0].count++;
      else if (pct >= 70) bands[1].count++;
      else if (pct >= 60) bands[2].count++;
      else if (pct >= 50) bands[3].count++;
      else bands[4].count++;
    });
    return bands;
  }, [grades]);

  const filtersChanged =
    selectedYear !== "2026" || selectedSemester !== "Semester 1" || selectedYearLevel !== "All" || selectedCourseId !== "all";
  const resetFilters = () => {
    setSelectedYear("2026");
    setSelectedSemester("Semester 1");
    setSelectedYearLevel("All");
    setSelectedCourseId("all");
  };
  const rosterCounts = ROSTER_FILTERS.reduce(
    (acc, f) => ({ ...acc, [f]: f === "All" ? studentRoster.length : studentRoster.filter(s => s.status === f).length }),
    {},
  );
  const visibleRoster = [...studentRoster]
    .filter(s => rosterFilter === "All" || s.status === rosterFilter)
    .sort((a, b) => b.avgGrade - a.avgGrade);
  const queue = filteredAssignments.filter(a => a.graded < a.totalSubmissions);
  const atRisk = studentRoster.filter(s => s.status === "At Risk" || s.status === "Critical");

  return (
    <motion.div
      className="flex w-full flex-col gap-6 pb-16"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <AnalyticsHeader
        title="Teaching insights"
        subtitle="How your classes are doing, and what still needs grading."
      />

      {/* Filters */}
      <Card
        as={motion.div}
        variants={rise}
        variant="outlined"
        tone="low"
        radius="lg"
        padding="sm"
        className="flex flex-wrap items-end gap-3"
      >
        <FilterSelect
          label="Year"
          value={selectedYear}
          options={YEARS.map(String)}
          onChange={v => { setSelectedYear(v); setSelectedCourseId("all"); }}
          className="w-28"
        />
        <FilterSelect
          label="Semester"
          value={selectedSemester}
          options={SEMESTERS}
          onChange={v => { setSelectedSemester(v); setSelectedCourseId("all"); }}
          className="w-40"
        />
        <FilterSelect
          label="Level"
          value={selectedYearLevel}
          options={["All", ...YEAR_LEVELS]}
          onChange={v => { setSelectedYearLevel(v); setSelectedCourseId("all"); }}
          className="w-36"
        />
        <FilterSelect
          label="Course"
          value={selectedCourseId}
          options={[{ value: "all", label: "All courses" }, ...filteredCourses.map(c => ({ value: c.id, label: `${c.code} · ${c.name}` }))]}
          onChange={setSelectedCourseId}
          className="min-w-56 flex-1 shrink sm:max-w-sm"
        />
        <AnimatePresence>
          {filtersChanged && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className="ml-auto">
              <Button variant="text" size="sm" startIcon={<RotateCcw size={14} />} onClick={resetFilters}>
                Reset
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <StatTiles
        loading={loading}
        stats={[
          { icon: TrendingUp, label: "Class average", value: classAvg, suffix: "%", variant: "purple" },
          { icon: Users, label: "Students", value: totalStudents, variant: "sky" },
          { icon: CheckCircle2, label: "Graded", value: gradingPct, suffix: "%", variant: "emerald", hint: `${totalGraded} of ${totalSubs}` },
          {
            icon: Hourglass,
            label: "Left to grade",
            value: pendingGrading,
            variant: "orange",
            hint: pendingGrading > 0 ? "In your queue" : undefined,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-6">
          <motion.section variants={rise}>
            <SectionLabel
              action={<span className="text-sm text-koru-on-surface-variant">Select a course to filter everything</span>}
            >
              Course averages
            </SectionLabel>
            {filteredCourses.length === 0 ? (
              <Card variant="outlined" tone="low" radius="lg">
                <PanelEmpty icon={GraduationCap}>No courses match these filters.</PanelEmpty>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCourses.map(course => {
                  const avg = gradedAssignments.filter(a => a.courseId === course.id);
                  const courseAvg = avg.length ? Math.round(avg.reduce((sum, a) => sum + a.avgScore, 0) / avg.length) : 0;
                  const selected = selectedCourseId === course.id;
                  return (
                    <Card
                      key={course.id}
                      as={motion.button}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCourseId(selected ? "all" : course.id)}
                      aria-pressed={selected}
                      variant="interactive"
                      tone="surface"
                      radius="lg"
                      padding="sm"
                      className={`flex w-full items-center gap-4 bg-koru-surface-container-lowest text-left outline-none focus-visible:ring-2 focus-visible:ring-koru-primary ${
                        selected ? "!ring-2 !ring-koru-primary bg-koru-primary-subtle" : ""
                      }`}
                    >
                      <KoruGauge value={courseAvg} size={60} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-koru-on-surface">{course.code}</p>
                        <p className="truncate text-sm text-koru-on-surface-variant">{course.name}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{course.enrolled} students</Badge>
                          <Badge variant="secondary">{course.yearLevel}</Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.section>

          <Panel title="Grading progress" description={`${filteredAssignments.length} assignments`}>
            {filteredAssignments.length === 0 ? (
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
                {filteredAssignments.map(a => {
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
                        {new Date(a.dueDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
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

          <Panel
            title="Student performance"
            description="Sorted by average grade"
            action={
              <div className="flex flex-wrap justify-end gap-1.5" role="group" aria-label="Filter students by status">
                {ROSTER_FILTERS.map(f => {
                  const active = rosterFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRosterFilter(f)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-koru-pill px-3 text-xs font-medium transition ${
                        active
                          ? "bg-koru-primary text-koru-on-primary shadow-koru-xs"
                          : "bg-koru-surface-container-high text-koru-on-surface-variant hover:bg-koru-surface-container-highest"
                      }`}
                    >
                      {f}
                      <span className={`tabular-nums ${active ? "text-koru-on-primary/75" : "text-koru-outline"}`}>{rosterCounts[f]}</span>
                    </button>
                  );
                })}
              </div>
            }
          >
            {visibleRoster.length === 0 ? (
              <PanelEmpty icon={Users}>No students in this group.</PanelEmpty>
            ) : (
              <DataTable
                columns={[
                  { label: "Student" },
                  { label: "Avg grade", className: "w-48" },
                  { label: "Submitted", className: "text-right" },
                  { label: "Status" },
                ]}
              >
                {visibleRoster.map(s => (
                  <motion.tr key={s.id} layout="position" className={tr}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar user={s} name={s.name} size={36} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-koru-on-surface">{s.name}</p>
                          <p className="truncate text-koru-caption text-koru-on-surface-variant">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={td}><ScoreMeter value={s.avgGrade} /></td>
                    <td className={`${td} text-right text-sm tabular-nums text-koru-on-surface`}>
                      {s.submissions}/{s.totalAssignments}
                    </td>
                    <td className={td}>
                      <Badge variant={STATUS_BADGE[s.status]} dot>{s.status}</Badge>
                    </td>
                  </motion.tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card as={motion.section} variants={rise} tone="brand" radius="lg" padding="lg">
            <p className="text-koru-label text-koru-on-primary-container">Class summary</p>
            <div className="mt-3 flex items-center gap-4">
              <KoruGauge value={classAvg} size={84} />
              <div>
                <p className="font-display text-koru-heading text-koru-on-primary-container">Class average</p>
                <p className="text-sm text-koru-on-primary-container/75">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} · {totalStudents} students
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-koru-md bg-koru-surface-container-lowest/70 px-3 py-2 text-sm text-koru-on-primary-container">
              <span className="font-semibold">{rosterCounts.Excellent}</span> student{rosterCounts.Excellent !== 1 ? "s" : ""} performing excellently
            </p>
          </Card>

          <Panel title="Grade distribution" description="All graded submissions">
            <KoruBarList
              label="Grades"
              labelWidth={60}
              items={gradeDistribution.map((b, i) => ({ label: b.range, value: b.count, color: BAND_COLORS[i] }))}
            />
          </Panel>

          <Panel title="Grading queue" description={queue.length ? `${queue.length} assignment${queue.length !== 1 ? "s" : ""} waiting` : undefined}>
            {queue.length === 0 ? (
              <PanelEmpty icon={CheckCircle2}>All caught up!</PanelEmpty>
            ) : (
              <ul className="flex flex-col gap-2">
                {queue.map(a => {
                  const remaining = a.totalSubmissions - a.graded;
                  return (
                    <li key={a.id} className="flex items-center gap-3 rounded-koru-md bg-koru-surface-container-low p-3 transition-colors hover:bg-koru-surface-container">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-koru-md bg-koru-accent-soft text-koru-accent-ink">
                        <FileText size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-koru-on-surface">{a.title}</p>
                        <p className="mt-0.5 text-koru-caption text-koru-on-surface-variant">{a.courseCode}</p>
                      </div>
                      <Badge variant="accent">{remaining} left</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Students at risk">
            {atRisk.length === 0 ? (
              <PanelEmpty icon={CheckCircle2}>No students at risk.</PanelEmpty>
            ) : (
              <ul className="flex flex-col gap-2">
                {atRisk.map(s => {
                  const critical = s.status === "Critical";
                  return (
                    <li
                      key={s.id}
                      className={`flex items-center gap-3 rounded-koru-md p-3 ${critical ? "bg-koru-error-container/60" : "bg-koru-warning-soft/60"}`}
                    >
                      <Avatar user={s} name={s.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-koru-on-surface">{s.name}</p>
                        <p className="text-koru-caption text-koru-on-surface-variant">{s.submissions}/{s.totalAssignments} submitted</p>
                      </div>
                      <span className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${critical ? "text-koru-error" : "text-koru-warning"}`}>
                        <AlertTriangle size={14} aria-hidden="true" />
                        {s.avgGrade}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </motion.div>
  );
}
