import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

import CalendarDayBlock from "./UI/CalendarDayBlock";
import CalendarViewSelector from "./UI/CalendarViewSelector";
import CalendarTimelineView from "./UI/CalendarTimelineView";
import CalendarDayView from "./UI/CalendarDayView";

import { getAllEvents } from "../../services/eventService";
import { getCourseAssignments } from "../../services/assignmentService";
import { getTeacherCourses } from "../../services/courseService";
import { useAuth } from "../../contexts/AuthContext";

// ─────────────────────────────────────────────────────────────
//  Mappers — convert backend payloads into the shape the calendar
//  UI components already expect (CalendarDayBlock, CalendarTimelineView, CalendarDayView)
// ─────────────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, "0"); }

function localDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function mapBackendEventToCalendar(evt) {
  const startDate = new Date(evt.startTime);
  const endDate = new Date(evt.endTime);

  let location = "TBA";
  if (evt.description && evt.description.includes("|")) {
    location = evt.description.split("|")[1] || "TBA";
  }

  return {
    id: `evt-${evt.id}`,
    date: localDateKey(startDate),
    title: evt.title,
    startTime: `${pad2(startDate.getHours())}:${pad2(startDate.getMinutes())}`,
    endTime: `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`,
    type: evt.eventType?.toLowerCase() === "meeting" ? "meeting" : "class",
    lecturer: evt.createdBy || "",
    location
  };
}

function mapAssignmentToCalendarEvent(assignment) {
  const due = new Date(assignment.dueDate);
  return {
    id: `assign-${assignment.id}`,
    date: localDateKey(due),
    title: assignment.title,
    startTime: `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    endTime: `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    type: "task",
    lecturer: "Assignment Due",
    location: assignment.course?.subject?.code || ""
  };
}

function mapAssignmentToTask(assignment) {
  const due = new Date(assignment.dueDate);
  return {
    id: assignment.id,
    title: assignment.title,
    due: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    dueTime: `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    course: assignment.course?.subject?.code || "",
    isSubmitted: false,
    isGraded: false
  };
}

// ─────────────────────────────────────────────────────────────
//  HELPERS — dynamic grid & event generation
// ─────────────────────────────────────────────────────────────
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format a Date to YYYY-MM-DD using local timezone (avoids UTC shift from toISOString) */
function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Build the calendar grid for a given year/month.
 * Returns an array of week arrays (each week = 7 day objects).
 * Weeks start on Monday. Days from adjacent months are marked isOutside.
 */
function buildGridWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];
  const startDate = new Date(year, month, 1 - startDow);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    cells.push({
      date: formatLocalDate(d),
      day: d.getDate(),
      isOutside: d.getMonth() !== month,
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  while (weeks.length > 0 && weeks[weeks.length - 1].every(c => c.isOutside)) {
    weeks.pop();
  }

  return weeks;
}

// Build a date → events[] lookup map
function buildEventMap(events) {
  return events.reduce((map, evt) => {
    if (!map[evt.date]) map[evt.date] = [];
    map[evt.date].push(evt);
    return map;
  }, {});
}

// Framer Motion variants
const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const viewVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────────────────────
export default function TeacherCalendar() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("month");
  // Track current month as { year, month } (month is 0-indexed)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Live data pulled from the backend
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        if (!user?.userId) return;

        // 1. Pull all events + the teacher's courses in parallel
        const [backendEvents, teacherCourses] = await Promise.all([
          getAllEvents(),
          getTeacherCourses(user.userId)
        ]);

        const teacherCourseIds = new Set(
          (Array.isArray(teacherCourses) ? teacherCourses : []).map(c => c.id)
        );

        // 2. Filter events down to courses this teacher teaches
        const ownEvents = (Array.isArray(backendEvents) ? backendEvents : [])
          .filter(evt => !evt.courseId || teacherCourseIds.has(evt.courseId));

        const classEvents = ownEvents.map(mapBackendEventToCalendar);

        // 3. Pull assignments for each course the teacher teaches
        const assignmentsByCourse = await Promise.all(
          Array.from(teacherCourseIds).map(cid =>
            getCourseAssignments(cid).catch(() => [])
          )
        );
        const allAssignments = assignmentsByCourse.flat();

        const assignmentEvents = allAssignments.map(mapAssignmentToCalendarEvent);

        if (mounted) setEvents([...classEvents, ...assignmentEvents]);

        const taskRows = allAssignments.map(a => mapAssignmentToTask(a));
        if (mounted) setTasks(taskRows);
      } catch (err) {
        console.error("Failed to load teacher calendar data:", err);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [user?.userId]);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Compute grid for the active month
  const gridWeeks = useMemo(
    () => buildGridWeeks(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  const eventMap = useMemo(() => buildEventMap(events), [events]);
  const todayStr = formatLocalDate(new Date());
  const monthLabel = `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`;

  return (
    <>
      <Menu />
      <SideMenu />

      <motion.div
        className="max-w-[1400px] mx-auto px-8 pt-5 pb-10"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-between mb-5">

          {/* Month title + arrows — left */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-['Gabarito'] !text-3xl text-gray-900 select-none text-center">
              {monthLabel}
            </h1>
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* View selector — truly centred */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <CalendarViewSelector activeView={activeView} onChange={setActiveView} />
          </div>

          {/* Add Task — right */}
          <button
            id="cal-add-task-btn"
            aria-label="Add Task"
            className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm border-none cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-px font-[inherit]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Task
          </button>
        </div>

        {/* ── View area ───────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* MONTH VIEW */}
          {activeView === "month" && (
            <motion.div
              key={`month-${currentMonth.year}-${currentMonth.month}`}
              className="w-full bg-white/70 rounded-3xl shadow-xl border border-1 border-gray-200"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Day-of-week header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {WEEK_DAYS.map((label, i) => (
                  <div key={i} className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400 py-2.5">
                    {label}
                  </div>
                ))}
              </div>

              {/* Week rows */}
              <div className="flex flex-col">
                {gridWeeks.map((week, wIdx) => (
                  <div key={wIdx} className={`grid grid-cols-7 ${wIdx > 0 ? "border-t border-gray-200" : ""}`}>
                    {week.map(({ date, day, isOutside }) => (
                      <CalendarDayBlock
                        key={date}
                        day={day}
                        isToday={date === todayStr}
                        isOutside={!!isOutside}
                        events={eventMap[date] ?? []}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TIMELINE VIEW */}
          {activeView === "timeline" && (
            <motion.div
              key={`timeline-${currentMonth.year}-${currentMonth.month}`}
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CalendarTimelineView events={events} weeks={gridWeeks} />
            </motion.div>
          )}

          {/* DAY VIEW — commented out, felt redundant
          {activeView === "day" && (
            <motion.div
              key={`day-${currentMonth.year}-${currentMonth.month}`}
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CalendarDayView
                events={events}
                tasks={tasks}
                weeks={gridWeeks}
              />
            </motion.div>
          )}
          */}

        </AnimatePresence>
      </motion.div>
    </>
  );
}
