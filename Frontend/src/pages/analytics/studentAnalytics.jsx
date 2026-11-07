import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, BookOpen, CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck,
  FileText, Hourglass, MessageSquareQuote, Sparkles, TrendingUp, X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../contexts/CoursesContext";
import { getStudentGrades } from "../../services/gradeService";
import { getStudentSubmissions } from "../../services/submissionService";
import { getCourseAssignments } from "../../services/assignmentService";
import { Badge, Card } from "../../components/UI";
import { KoruBarList, KoruGauge, KoruTrendChart } from "../../components/UI/charts/KoruCharts";
import { koruChartColors } from "../../components/UI/charts/koruChartTheme";
import {
  AnalyticsHeader, CountUp, DataTable, DeltaBadge, Panel, PanelEmpty, ScoreMeter,
  SectionLabel, StatTiles,
} from "./components/AnalyticsUI";
import { rise, stagger, td, tdWrap, tr } from "./components/analyticsStyles";

/* ──────────────────────────── helper components ──────────────────────────── */

/* ──────────────────────────── main page ──────────────────────────── */

export default function StudentAnalytics() {
  const { user } = useAuth();
  const { visibleCourses } = useCourses();
  const [gradesData, setGradesData] = useState([]);
  const [submissionsData, setSubmissionsData] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [focusCourseId, setFocusCourseId] = useState(null);

  // Grades scoped to the focused course (or all courses) for the trend and table.
  const scopedGrades = useMemo(
    () => (focusCourseId ? gradesData.filter(g => g.submission?.assignment?.courseId === focusCourseId) : gradesData),
    [gradesData, focusCourseId],
  );

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!user?.userId || visibleCourses.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [grades, submissions] = await Promise.all([
          getStudentGrades(user.userId),
          getStudentSubmissions(user.userId),
        ]);
        const assignmentPromises = visibleCourses.map(c => getCourseAssignments(c.id).catch(() => []));
        const assignmentsArrays = await Promise.all(assignmentPromises);
        const assignments = assignmentsArrays.flat();
        if (mounted) {
          setGradesData(grades || []);
          setSubmissionsData(submissions || []);
          setAllAssignments(assignments);
        }
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [user?.userId, visibleCourses]);

  const monthlyTrendData = useMemo(() => {
    const today = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return {
        label: d.toLocaleDateString("en-ZA", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        totalEarned: 0,
        totalMax: 0,
      };
    });
    scopedGrades.forEach(g => {
      if (!g.gradedAt || g.pointsEarned == null || !g.submission?.assignment?.maxPoints) return;
      const date = new Date(g.gradedAt);
      const m = last12Months.find(lm => lm.year === date.getFullYear() && lm.month === date.getMonth());
      if (m) {
        m.totalEarned += g.pointsEarned;
        m.totalMax += g.submission.assignment.maxPoints;
      }
    });
    let lastValue = 0;
    const data = last12Months.map(m => {
      if (m.totalMax > 0) lastValue = Math.round((m.totalEarned / m.totalMax) * 100);
      return lastValue;
    });
    let firstNonZero = data.find(v => v > 0) || 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === 0) data[i] = firstNonZero;
      else break;
    }
    const allZeros = data.every(v => v === 0);
    return {
      labels: last12Months.map(m => m.label),
      data: allZeros ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : data,
      overallTrend: allZeros ? 0 : data[11] - data[10],
    };
  }, [scopedGrades]);

  const stats = useMemo(() => {
    let totalPoints = 0;
    let earnedPoints = 0;
    gradesData.forEach(g => {
      if (g.pointsEarned != null && g.submission?.assignment?.maxPoints) {
        totalPoints += g.submission.assignment.maxPoints;
        earnedPoints += g.pointsEarned;
      }
    });
    const pending = submissionsData.filter(s => s.status === "Submitted").length;
    return {
      overallAverage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0,
      totalGraded: gradesData.length,
      pending,
    };
  }, [gradesData, submissionsData]);

  const coursePerformance = useMemo(() => {
    return visibleCourses.map(course => {
      const courseGrades = gradesData.filter(g => g.submission?.assignment?.courseId === course.id);
      let cTotal = 0;
      let cEarned = 0;
      courseGrades.forEach(g => {
        if (g.pointsEarned != null && g.submission?.assignment?.maxPoints) {
          cTotal += g.submission.assignment.maxPoints;
          cEarned += g.pointsEarned;
        }
      });
      const sortedGrades = [...courseGrades]
        .filter(g => g.pointsEarned != null && g.submission?.assignment?.maxPoints)
        .sort((a, b) => new Date(a.gradedAt) - new Date(b.gradedAt));
      let trend = 0;
      if (sortedGrades.length > 1) {
        const latest = sortedGrades[sortedGrades.length - 1];
        const previous = sortedGrades[sortedGrades.length - 2];
        const latestPct = (latest.pointsEarned / latest.submission.assignment.maxPoints) * 100;
        const prevPct = (previous.pointsEarned / previous.submission.assignment.maxPoints) * 100;
        trend = parseFloat((latestPct - prevPct).toFixed(1));
      }
      return { ...course, average: cTotal > 0 ? Math.round((cEarned / cTotal) * 100) : 0, trend };
    });
  }, [visibleCourses, gradesData]);

  const upcomingAssignments = useMemo(() => {
    return allAssignments
      .filter(a => !submissionsData.some(s => s.assignmentId === a.id))
      .filter(a => new Date(a.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3)
      .map(a => ({ ...a, course: visibleCourses.find(c => c.id === a.courseId)?.label || "Course" }));
  }, [allAssignments, submissionsData, visibleCourses]);

  const recentGrades = useMemo(() => {
    return [...scopedGrades]
      .sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt))
      .slice(0, 6)
      .map(g => ({
        id: g.id,
        course:
          g.submission?.assignment?.course?.label ||
          visibleCourses.find(c => c.id === g.submission?.assignment?.courseId)?.label ||
          "N/A",
        assignment: g.submission?.assignment?.title || "Assignment",
        pointsEarned: g.pointsEarned,
        maxPoints: g.submission?.assignment?.maxPoints || 100,
        gradedAt: g.gradedAt,
        status: "Graded",
      }));
  }, [scopedGrades, visibleCourses]);

  const highestCourse =
    coursePerformance.length > 0
      ? coursePerformance.reduce((a, b) => (a.average > b.average ? a : b))
      : { average: 0, label: "N/A", subjectName: "None" };

  const submissionsSummary = {
    total: submissionsData.length,
    graded: gradesData.length,
    pending: stats.pending,
    late: submissionsData.filter(s => s.status === "Late").length,
  };

  const feedback = useMemo(() => {
    return gradesData
      .filter(g => g.feedback)
      .sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt))
      .slice(0, 3)
      .map(g => ({
        id: g.id,
        assignment: g.submission?.assignment?.title,
        course: visibleCourses.find(c => c.id === g.submission?.assignment?.courseId)?.label,
        teacher: "Teacher",
        content: g.feedback,
        createdAt: g.gradedAt,
      }));
  }, [gradesData, visibleCourses]);

  const focusCourse = coursePerformance.find(c => c.id === focusCourseId);

  return (
    <motion.div
      className="flex w-full flex-col gap-6 pb-16"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <AnalyticsHeader
        title="Your progress"
        subtitle="Grades, trends and what's due next, across all your courses."
      />

      <StatTiles
        loading={loading}
        stats={[
          {
            icon: TrendingUp,
            label: "Overall average",
            value: stats.overallAverage,
            suffix: "%",
            variant: "purple",
            hint:
              monthlyTrendData.overallTrend !== 0
                ? `${monthlyTrendData.overallTrend > 0 ? "+" : ""}${monthlyTrendData.overallTrend}% this month`
                : undefined,
          },
          { icon: BookOpen, label: "Courses enrolled", value: visibleCourses.length, variant: "sky" },
          { icon: ClipboardCheck, label: "Assignments graded", value: stats.totalGraded, variant: "emerald" },
          {
            icon: Hourglass,
            label: "Pending review",
            value: submissionsSummary.pending,
            variant: "orange",
            hint: submissionsSummary.pending > 0 ? "Awaiting grades" : undefined,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Grade trend"
            description={focusCourse ? `Monthly average in ${focusCourse.subjectName || focusCourse.label}` : "Monthly average over the past year"}
            action={
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {focusCourse && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setFocusCourseId(null)}
                      className="inline-flex h-6 items-center gap-1 rounded-koru-pill bg-koru-primary-container px-2.5 text-[11px] font-medium text-koru-on-primary-container transition hover:bg-koru-inverse-primary"
                    >
                      {focusCourse.label}
                      <X size={12} aria-label="Show all courses" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <DeltaBadge value={monthlyTrendData.overallTrend} />
              </div>
            }
          >
            <div className="-mx-2">
              <KoruTrendChart
                data={monthlyTrendData.data}
                labels={monthlyTrendData.labels}
                label="Average grade"
                height={220}
              />
            </div>
          </Panel>

          {/* Course performance */}
          <motion.section variants={rise}>
            <SectionLabel
              action={<span className="text-sm text-koru-on-surface-variant">Select a course to focus the trend</span>}
            >
              Course performance
            </SectionLabel>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {coursePerformance.map(course => {
                const selected = focusCourseId === course.id;
                return (
                  <Card
                    key={course.id}
                    as={motion.button}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFocusCourseId(selected ? null : course.id)}
                    aria-pressed={selected}
                    variant="interactive"
                    tone="surface"
                    radius="lg"
                    padding="sm"
                    className={`flex w-full items-center gap-4 bg-koru-surface-container-lowest text-left outline-none focus-visible:ring-2 focus-visible:ring-koru-primary ${
                      selected ? "!ring-2 !ring-koru-primary bg-koru-primary-subtle" : ""
                    }`}
                  >
                    <KoruGauge value={course.average} size={60} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-koru-on-surface">{course.subjectName || course.label}</p>
                      <p className="mt-0.5 truncate text-sm text-koru-on-surface-variant">
                        {course.label} · {course.lecturerName || "Lecturer"}
                      </p>
                    </div>
                    <DeltaBadge value={course.trend} />
                  </Card>
                );
              })}
            </div>
          </motion.section>

          <Panel
            title="Recent grades"
            description={focusCourse ? `Latest results in ${focusCourse.label}` : `Your last ${recentGrades.length} results`}
          >
            {recentGrades.length === 0 ? (
              <PanelEmpty icon={FileText}>No graded work yet.</PanelEmpty>
            ) : (
              <DataTable
                columns={[
                  { label: "Assignment" },
                  { label: "Course" },
                  { label: "Score", className: "w-48" },
                  { label: "Graded" },
                ]}
              >
                {recentGrades.map(g => {
                  const pct = g.pointsEarned != null ? Math.round((g.pointsEarned / g.maxPoints) * 100) : 0;
                  return (
                    <tr key={g.id} className={tr}>
                      <td className={tdWrap}>
                        <span className="font-medium text-koru-on-surface">{g.assignment}</span>
                      </td>
                      <td className={td}>
                        <Badge variant="primary">{g.course}</Badge>
                      </td>
                      <td className={td}>
                        <ScoreMeter value={pct} />
                      </td>
                      <td className={`${td} text-sm text-koru-on-surface-variant`}>
                        {g.gradedAt
                          ? new Date(g.gradedAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Top course */}
          <Card
            as={motion.section}
            variants={rise}
            tone="brand"
            radius="lg"
            padding="lg"
            className="relative isolate overflow-hidden"
          >
            <Sparkles
              size={120}
              strokeWidth={1.5}
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-6 -z-10 rotate-12 text-koru-primary opacity-10"
            />
            <p className="flex items-center gap-1.5 text-koru-label text-koru-on-primary-container">
              <Award size={16} aria-hidden="true" /> Top course
            </p>
            <div className="mt-3 flex items-center gap-4">
              <KoruGauge value={highestCourse.average} size={76} />
              <div className="min-w-0">
                <p className="font-display text-koru-heading text-koru-on-primary-container">
                  {highestCourse.subjectName}
                </p>
                <p className="text-sm text-koru-on-primary-container/75">{highestCourse.label}</p>
              </div>
            </div>
          </Card>

          <Panel title="Submissions" description={`${submissionsSummary.total} submitted in total`}>
            <KoruBarList
              label="Submissions"
              labelWidth={64}
              xMax={Math.max(submissionsSummary.total, 1)}
              valueFormatter={v => `${v ?? 0} of ${submissionsSummary.total}`}
              items={[
                { label: "Graded", value: submissionsSummary.graded, color: koruChartColors.success },
                { label: "Pending", value: submissionsSummary.pending, color: koruChartColors.accent },
                { label: "Late", value: submissionsSummary.late, color: koruChartColors.error },
              ]}
            />
          </Panel>

          <Panel title="Upcoming deadlines">
            {upcomingAssignments.length === 0 ? (
              <PanelEmpty icon={CheckCircle2}>Nothing due. Enjoy the breather.</PanelEmpty>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcomingAssignments.map(a => {
                  const dueDate = new Date(a.dueDate);
                  const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                  const urgent = daysLeft <= 7;
                  return (
                    <li
                      key={a.id}
                      className={`flex items-center gap-3 rounded-koru-md p-3 transition-colors ${
                        urgent ? "bg-koru-accent-soft" : "bg-koru-surface-container-low hover:bg-koru-surface-container"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-koru-md ${
                          urgent ? "bg-koru-accent text-white" : "bg-koru-surface-container-highest text-koru-on-surface-variant"
                        }`}
                      >
                        <CalendarClock size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-koru-on-surface">{a.title}</p>
                        <p className="mt-0.5 text-koru-caption text-koru-on-surface-variant">
                          {a.course} · {a.maxPoints} pts
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-semibold ${urgent ? "text-koru-accent-ink" : "text-koru-on-surface"}`}>
                          {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                        </p>
                        <p className="text-koru-caption text-koru-on-surface-variant">
                          {dueDate.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Recent feedback">
            {feedback.length === 0 ? (
              <PanelEmpty icon={MessageSquareQuote}>No feedback yet.</PanelEmpty>
            ) : (
              <ul className="flex flex-col gap-2">
                {feedback.map(fb => {
                  const open = expandedFeedback === fb.id;
                  return (
                    <motion.li key={fb.id} layout className="overflow-hidden rounded-koru-md bg-koru-surface-container-low">
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setExpandedFeedback(open ? null : fb.id)}
                        className="flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-koru-surface-container"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-koru-on-surface">{fb.assignment}</p>
                          <p className="mt-0.5 text-koru-caption text-koru-on-surface-variant">{fb.course}</p>
                        </div>
                        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-koru-on-surface-variant">
                          <ChevronDown size={16} aria-hidden="true" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-l-2 border-koru-primary mx-3 mb-3 pl-3 text-sm leading-relaxed text-koru-on-surface-variant"
                          >
                            {fb.content}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.li>
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
