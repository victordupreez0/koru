import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CalendarClock, ListTodo, GraduationCap } from "lucide-react";

import CourseGlance from "../../components/courseGlance";
import TodayTimeline from "../../components/todayTimeline";
import TeacherTodoProgress from "../../components/teacherTodoProgress";
import DashboardHeader from "../../components/DashboardHeader";

import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../contexts/CoursesContext";
import { getTeacherEvents } from "../../services/eventService";
import { getTeacherTodos } from "../../services/todoService";

const column = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { visibleCourses } = useCourses();

  const [classesToday, setClassesToday] = useState(0);
  const [openTodos, setOpenTodos] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.userId) return;
      try {
        setStatsLoading(true);
        const [events, todos] = await Promise.all([
          getTeacherEvents(user.userId).catch(() => []),
          getTeacherTodos(user.userId).catch(() => []),
        ]);

        const todayStr = new Date().toDateString();
        const classes = (events || []).filter(
          (e) => new Date(e.startTime ?? e.StartTime).toDateString() === todayStr
        ).length;

        const open = (todos || []).filter((t) => !t.isCompleted).length;

        if (!mounted) return;
        setClassesToday(classes);
        setOpenTodos(open);
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
        label: "Courses",
        value: visibleCourses?.length ?? 0,
        variant: "orange",
      },
      {
        icon: CalendarClock,
        label: "Classes Today",
        value: classesToday,
        variant: "purple",
      },
      {
        icon: ListTodo,
        label: "Open Tasks",
        value: openTodos,
        variant: "sky",
        hint: openTodos > 0 ? "Pending" : undefined,
      },
      {
        icon: GraduationCap,
        label: "Term",
        value: "Spring",
        variant: "emerald",
      },
    ],
    [visibleCourses, classesToday, openTodos]
  );

  return (
    <div className="flex flex-col gap-6 pb-2">
      <DashboardHeader
        stats={stats}
        loading={statsLoading}
        contextLine="Today's classes, tasks and course pulse — all in one view."
      />

      <motion.section
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto min-h-[520px]"
        aria-label="Lecturer dashboard overview"
      >
        <motion.div variants={column} className="">
          <CourseGlance />
        </motion.div>
        <motion.div variants={column} className="">
          <TodayTimeline />
        </motion.div>
        <motion.div variants={column} className="">
          <TeacherTodoProgress />
        </motion.div>
      </motion.section>
    </div>
  );
}
