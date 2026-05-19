import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

import CalendarDayBlock from "./UI/CalendarDayBlock";
import CalendarViewSelector from "./UI/CalendarViewSelector";
import CalendarTimelineView from "./UI/CalendarTimelineView";
import CalendarDayView from "./UI/CalendarDayView";

// ─────────────────────────────────────────────────────────────
//  WEEKLY EVENT TEMPLATE
//  dayOfWeek: 0 = Sunday, 1 = Monday, … 6 = Saturday
//  These repeat every week in every month.
// ─────────────────────────────────────────────────────────────
const WEEKLY_TEMPLATE = [
  // Monday
  { dayOfWeek: 1, title: "UX 300", startTime: "8:30", endTime: "9:30", type: "class", lecturer: "Laudette Sass", location: "On Campus - C4" },
  { dayOfWeek: 1, title: "VC 300", startTime: "9:00", endTime: "10:00", type: "class", lecturer: "Matt Williams", location: "Online" },
  { dayOfWeek: 1, title: "DV 300", startTime: "14:00", endTime: "16:00", type: "class", lecturer: "Tsungai Katsuro", location: "On Campus - B2" },
  // Tuesday
  { dayOfWeek: 2, title: "Group Meeting", startTime: "9:00", endTime: "10:00", type: "meeting", lecturer: "Study Group", location: "Online" },
  // Wednesday
  { dayOfWeek: 3, title: "UX 300", startTime: "9:00", endTime: "13:00", type: "class", lecturer: "Laudette Sass", location: "On Campus - C4" },
  // Thursday
  { dayOfWeek: 4, title: "DV 300", startTime: "13:00", endTime: "17:00", type: "class", lecturer: "Tsungai Katsuro", location: "On Campus - B2" },
];

// ─────────────────────────────────────────────────────────────
//  TASKS DATA  (To-Do panel in Day view)
// ─────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, title: "High Fidelity Wireframes", due: "Mar 2", dueTime: "20:00", course: "UX300" },
  { id: 2, title: "Essay Draft", due: "Mar 10", dueTime: "20:00", course: "VC300" },
  { id: 3, title: "Progress Mark", due: "Mar 21", dueTime: "10:00", course: "DV300" },
];

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

/**
 * Generate events for ALL visible dates in the grid from the weekly template.
 * This ensures overflow days from adjacent months also have events.
 */
function generateEventsForGrid(gridWeeks) {
  const events = [];
  let idCounter = 1;

  const allDates = gridWeeks.flat();
  allDates.forEach(({ date }) => {
    const d = new Date(date + 'T00:00:00'); // parse as local
    const dow = d.getDay();

    WEEKLY_TEMPLATE.forEach((tmpl) => {
      if (tmpl.dayOfWeek === dow) {
        events.push({
          id: idCounter++,
          date,
          title: tmpl.title,
          startTime: tmpl.startTime,
          endTime: tmpl.endTime,
          type: tmpl.type,
          lecturer: tmpl.lecturer,
          location: tmpl.location,
        });
      }
    });
  });

  return events;
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
export default function StudentCalendar() {
  const [activeView, setActiveView] = useState("month");
  // Track current month as { year, month } (month is 0-indexed)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

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

  // Compute grid & events for the active month
  const gridWeeks = useMemo(
    () => buildGridWeeks(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month]
  );

  const events = useMemo(
    () => generateEventsForGrid(gridWeeks),
    [gridWeeks]
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
                tasks={TASKS}
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

