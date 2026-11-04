import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Award, FileText } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { getTeacherCourses } from "../../services/courseService";
import { getCourseAssignments } from "../../services/assignmentService";
import { getCourseSubmissions } from "../../services/submissionService";
import { getCourseGrades } from "../../services/gradeService";
import { YEARS, SEMESTERS, YEAR_LEVELS } from "./teacherMockData";
import { Avatar, Select } from "../../components/UI";

/* ─── animation variants ─── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ─── filter select ─── */
function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{label}</span>
      <Select
        size="sm"
        containerClassName="w-auto min-w-40"
        value={value}
        onChange={e => onChange(e.target.value)}
        >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </Select>
    </label>
  );
}

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
          color: "var(--color-koru-primary)",
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

  return (
    <div className="w-full pb-16">
      <motion.div
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2"
        initial="hidden" animate="visible" variants={stagger}
      >

        {/* ─── Filter Bar ─── */}
        <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <FilterSelect
              label="Year"
              value={selectedYear}
              options={YEARS.map(String)}
              onChange={v => { setSelectedYear(v); setSelectedCourseId("all"); }}
            />
            <FilterSelect
              label="Semester"
              value={selectedSemester}
              options={SEMESTERS}
              onChange={v => { setSelectedSemester(v); setSelectedCourseId("all"); }}
            />
            <FilterSelect
              label="Level"
              value={selectedYearLevel}
              options={["All", ...YEAR_LEVELS]}
              onChange={v => { setSelectedYearLevel(v); setSelectedCourseId("all"); }}
            />
            <div className="ml-auto flex items-center gap-3 pl-6 border-l border-koru-outline-faint">
              <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Course</span>
              <Select
                size="sm"
                containerClassName="w-auto min-w-48"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                <option value="all">All Courses</option>
                {filteredCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                ))}
              </Select>
            </div>
          </div>
        </motion.div>

        {/* ─── KPI Row ─── */}
        <motion.div variants={fadeUp} className="flex flex-row divide-x divide-koru-outline-faint bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card px-6 py-5">
          {[
            {
              label: "Class Average",
              value: `${classAvg}%`,
              sub: `across ${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""}`,
            },
            { label: "Total Students", value: totalStudents, sub: "enrolled" },
            { label: "Grading Progress", value: `${gradingPct}%`, sub: `${totalGraded} of ${totalSubs} graded` },
            { label: "Pending to Grade", value: pendingGrading, sub: "submissions" },
          ].map((kpi, i) => (
            <div key={i} className={`flex flex-col gap-1 flex-1 ${i === 0 ? "pr-6" : "px-6"}`}>
              <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">{kpi.label}</p>
              <p className="text-2xl font-medium leading-none text-koru-on-surface">{kpi.value}</p>
              <p className="text-xs text-koru-on-surface-variant truncate mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-6">

            {/* Course Averages */}
            <motion.div variants={fadeUp}>
              <h2 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-3">Course Averages</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {filteredCourses.map(course => {
                  const avg = gradedAssignments.filter(a => a.courseId === course.id);
                  const courseAvg = avg.length ? Math.round(avg.reduce((s, a) => s + a.avgScore, 0) / avg.length) : 0;
                  const isSelected = selectedCourseId === course.id;
                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourseId(isSelected ? "all" : course.id)}
                      className={`bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset shadow-koru-card p-5 cursor-pointer transition-all ${isSelected ? "ring-2 ring-koru-primary" : "ring-koru-outline-faint hover:ring-koru-outline-variant"}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative shrink-0">
                          <ProgressRing percent={courseAvg} color={course.color} />
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-koru-on-surface">
                            {courseAvg}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-koru-on-surface truncate">{course.code}</p>
                          <p className="text-xs text-koru-on-surface-variant truncate">{course.name}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-koru-on-surface-variant">
                        <span>{course.enrolled} students</span>
                        <span>{course.yearLevel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Grading Progress Table */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
              <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
                <h2 className="font-display text-base font-medium text-koru-on-surface">Grading Progress</h2>
                <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                  {filteredAssignments.length} assignments
                </span>
              </div>
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
                  {filteredAssignments.map(a => {
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
                          {new Date(a.dueDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
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
            </motion.div>

            {/* Student Roster */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
              <div className="px-6 py-5 border-b border-koru-outline-faint flex justify-between items-center">
                <h2 className="font-display text-base font-medium text-koru-on-surface">Student Performance</h2>
                <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
                  {studentRoster.length} students
                </span>
              </div>
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
                      <td className="px-6 py-4 text-center text-sm font-medium text-koru-on-surface-variant">
                        {s.submissions}/{s.totalAssignments}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-koru-caption font-medium uppercase tracking-widest ${
                          s.status === "Excellent" ? "bg-koru-success-soft text-koru-success" :
                          s.status === "Good" ? "bg-koru-info-soft text-koru-info" :
                          s.status === "At Risk" ? "bg-koru-warning-soft text-koru-warning" :
                          "bg-koru-error-container text-koru-error"
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">

            {/* Class Summary */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-3">Class Summary</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-medium text-koru-on-surface">{classAvg}%</span>
                <span className="text-sm text-koru-on-surface-variant">class average</span>
              </div>
              <p className="text-xs text-koru-on-surface-variant">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} · {totalStudents} students
              </p>
              <div className="mt-4 pt-4 border-t border-koru-outline-faint flex items-center gap-2 text-xs text-koru-on-surface-variant">
                <Award size={14} className="text-koru-accent shrink-0" />
                <span>{studentRoster.filter(s => s.status === "Excellent").length} students performing excellently</span>
              </div>
            </motion.div>

            {/* Grade Distribution — real SA bands */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <h3 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-4">Grade Distribution</h3>
              <div className="space-y-2.5">
                {gradeDistribution.map(b => {
                  const maxCount = Math.max(...gradeDistribution.map(d => d.count), 1);
                  return (
                    <div key={b.range} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-koru-on-surface-variant w-14 text-right">{b.range}</span>
                      <div className="flex-1 h-4 bg-koru-surface-container-low rounded-koru-sm overflow-hidden ring-1 ring-inset ring-koru-outline-faint">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.count / maxCount) * 100}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-koru-sm bg-koru-primary/20"
                        />
                      </div>
                      <span className="text-xs font-medium text-koru-on-surface-variant w-5 text-right">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Grading Queue */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <h3 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-4">Grading Queue</h3>
              <div className="space-y-2">
                {filteredAssignments.filter(a => a.graded < a.totalSubmissions).map(a => {
                  const remaining = a.totalSubmissions - a.graded;
                  return (
                    <div key={a.id} className="rounded-koru-md ring-1 ring-inset ring-koru-outline-faint p-3.5 flex items-center gap-3 hover:ring-koru-outline-variant transition-colors">
                      <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-koru-md bg-koru-warning-soft">
                        <FileText size={15} className="text-koru-warning" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-koru-on-surface truncate">{a.title}</p>
                        <p className="text-xs text-koru-on-surface-variant mt-0.5">{a.courseCode}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-koru-warning">{remaining} left</p>
                      </div>
                    </div>
                  );
                })}
                {filteredAssignments.filter(a => a.graded < a.totalSubmissions).length === 0 && (
                  <div className="text-center py-6 text-koru-on-surface-variant text-sm">
                    <CheckCircle size={22} className="mx-auto mb-2 text-koru-success" />
                    All caught up!
                  </div>
                )}
              </div>
            </motion.div>

            {/* At-Risk Students */}
            <motion.div variants={fadeUp} className="bg-koru-surface-container-lowest rounded-koru-lg ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6">
              <h3 className="font-display text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-4">At-Risk Students</h3>
              <div className="space-y-2">
                {studentRoster
                  .filter(s => s.status === "At Risk" || s.status === "Critical")
                  .map(s => (
                    <div
                      key={s.id}
                      className={`rounded-koru-md border p-3.5 flex items-center gap-3 ${
                        s.status === "Critical" ? "border-koru-error/20 bg-koru-error-container/40" : "border-koru-warning/25 bg-koru-warning-soft/40"
                      }`}
                    >
                      <Avatar user={s} name={s.name} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-koru-on-surface truncate">{s.name}</p>
                        <p className="text-xs text-koru-on-surface-variant">{s.submissions}/{s.totalAssignments} submitted</p>
                      </div>
                      <span className={`text-sm font-medium ${s.avgGrade < 50 ? "text-koru-error" : "text-koru-warning"}`}>
                        {s.avgGrade}%
                      </span>
                    </div>
                  ))}
                {studentRoster.filter(s => s.status === "At Risk" || s.status === "Critical").length === 0 && (
                  <p className="text-center py-4 text-sm text-koru-on-surface-variant">No at-risk students</p>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
