import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CalendarClock, ClipboardList, Activity } from "lucide-react";

import CourseGlance from "../../components/courseGlance";
import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";
import DashboardHeader from "../../components/DashboardHeader";

import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../contexts/CoursesContext";
import { getAllEvents } from "../../services/eventService";
import { getStudentAssignments } from "../../services/assignmentService";
import { getStudentSubmissions } from "../../services/submissionService";
import { getStudentStats } from "../../services/attendanceService";

const column = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { visibleCourses } = useCourses();

  const [classesToday, setClassesToday] = useState(0);
  const [dueSoon, setDueSoon] = useState(0);
  const [attendance, setAttendance] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.userId) return;
      try {
        setStatsLoading(true);
        const [events, assignments, subs, stats] = await Promise.all([
          getAllEvents().catch(() => []),
          getStudentAssignments(user.userId).catch(() => []),
          getStudentSubmissions(user.userId).catch(() => []),
          getStudentStats(user.userId).catch(() => null),
        ]);

        const todayStr = new Date().toDateString();
        const classes = events.filter(
          (e) => new Date(e.startTime ?? e.StartTime).toDateString() === todayStr
        ).length;

        const submittedIds = new Set((subs || []).map((s) => s.assignmentId));
        const now = new Date();
        const due = (assignments || []).filter((a) => {
          if (submittedIds.has(a.id) || a.isClosed) return false;
          const diffDays = (new Date(a.dueDate) - now) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }).length;

        if (!mounted) return;
        setClassesToday(classes);
        setDueSoon(due);
        if (stats && typeof stats.overallAttendanceRate === "number") {
          setAttendance(Math.round(stats.overallAttendanceRate));
        }
      } catch (err) {
        console.error("Failed loading dashboard stats:", err);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  const stats = useMemo(
    () => [
      {
        icon: BookOpen,
        label: "Active Courses",
        value: visibleCourses?.length ?? 0,
        variant: "purple",
      },
      {
        icon: CalendarClock,
        label: "Classes Today",
        value: classesToday,
        variant: "sky",
      },
      {
        icon: ClipboardList,
        label: "Due This Week",
        value: dueSoon,
        variant: "orange",
        hint: dueSoon > 0 ? "Action" : undefined,
      },
      {
        icon: Activity,
        label: "Attendance",
        value: attendance ?? "—",
        suffix: attendance !== null ? "%" : undefined,
        variant: "emerald",
      },
    ],
    [visibleCourses, classesToday, dueSoon, attendance]
  );

  return (
    <div className="flex flex-col gap-6 pb-2">
      <DashboardHeader
        stats={stats}
        loading={statsLoading}
        contextLine="Here's everything you've got going on today."
      />

      <motion.section
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto min-h-[520px]"
        aria-label="Student dashboard overview"
      >
        <motion.div variants={column} className="">
          <CourseGlance />
        </motion.div>
        <motion.div variants={column} className="">
          <TodayTimeline />
        </motion.div>
        <motion.div variants={column} className="">
          <AssignmentsProgress />
        </motion.div>
      </motion.section>
    </div>
  );
}
