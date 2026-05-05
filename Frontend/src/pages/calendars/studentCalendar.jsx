import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

import CalendarDayBlock        from "./UI/CalendarDayBlock";
import CalendarViewSelector    from "./UI/CalendarViewSelector";
import CalendarTimelineView    from "./UI/CalendarTimelineView";
import CalendarDayView         from "./UI/CalendarDayView";

import { getAllEvents } from "../../services/eventService";

// Helper: map backend event to calendar format
function mapBackendEventToCalendar(evt) {
  const startDate = new Date(evt.startTime);
  const endDate = new Date(evt.endTime);
  
  let location = "TBA";
  if (evt.description && evt.description.includes("|")) {
      location = evt.description.split("|")[1] || "TBA";
  }

  return {
    id: evt.id,
    date: startDate.toISOString().slice(0, 10),
    title: evt.title,
    startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
    endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
    type: evt.eventType || "class",
    lecturer: evt.createdBy || "Unknown",
    location: location
  };
}

// ─────────────────────────────────────────────────────────────
//  TASKS DATA  (To-Do panel in Day view)
//  Shape: { id, title, due, dueTime, course }
// ─────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, title: "High Fidelity Wireframes", due: "Next Mon",  dueTime: "20:00", course: "UX300" },
  { id: 2, title: "Essay Draft",              due: "Next Tue",  dueTime: "20:00", course: "VC300" },
];

// ─────────────────────────────────────────────────────────────
//  DYNAMIC GRID GENERATOR — 5 rows × 7 cols
// ─────────────────────────────────────────────────────────────
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function generateGridWeeks() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Find the first Monday on or before the 1st of the month
  const firstDayOfMonth = new Date(year, month, 1);
  let startDay = new Date(firstDayOfMonth);
  const dayOfWeek = startDay.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDay.setDate(startDay.getDate() + diff);

  const grid = [];
  for (let w = 0; w < 5; w++) { // 5 weeks
    const week = [];
    for (let d = 0; d < 7; d++) {
      const current = new Date(startDay);
      // To properly handle local timezone offset
      const isoDate = new Date(current.getTime() - (current.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
      week.push({
        date: isoDate,
        day: current.getDate(),
        isOutside: current.getMonth() !== month
      });
      startDay.setDate(startDay.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

const GRID_WEEKS = generateGridWeeks();
const CURRENT_MONTH_NAME = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

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
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const viewVariants = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────────────────────
export default function StudentCalendar() {
  const [activeView, setActiveView] = useState("month");
  const [events, setEvents] = useState([]);

  React.useEffect(() => {
    async function fetchCalendarEvents() {
      try {
        const backendEvents = await getAllEvents();
        const mapped = backendEvents.map(mapBackendEventToCalendar);
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load events for calendar:", err);
      }
    }
    fetchCalendarEvents();
  }, []);

  const eventMap = buildEventMap(events);
  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10);

  return (
    <>
      <Menu />
      <SideMenu />

      <motion.div
        className="max-w-[1400px] mx-auto px-8 pt-3 pb-10"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-between mb-5">

          {/* Month title — left */}
          <h1 className="font-['Gabarito'] text-[1.6rem] font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
            {CURRENT_MONTH_NAME}
            <span className="text-base text-gray-400 dark:text-slate-500">∨</span>
          </h1>

          {/* View selector — truly centred */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <CalendarViewSelector activeView={activeView} onChange={setActiveView} />
          </div>

          {/* Add Task — right */}
          <button
            id="cal-add-task-btn"
            aria-label="Add Task"
            className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 border-none cursor-pointer transition-all duration-150 hover:bg-gray-200 dark:hover:bg-slate-600 hover:-translate-y-px font-[inherit]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8"  x2="12" y2="16" />
              <line x1="8"  y1="12" x2="16" y2="12" />
            </svg>
            Add Task
          </button>
        </div>

        {/* ── View area ───────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* MONTH VIEW */}
          {activeView === "month" && (
            <motion.div
              key="month"
              className="w-full"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Day-of-week header */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700">
                {WEEK_DAYS.map((label, i) => (
                  <div key={i} className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 py-2.5">
                    {label}
                  </div>
                ))}
              </div>

              {/* 4 week rows */}
              <div className="flex flex-col">
                {GRID_WEEKS.map((week, wIdx) => (
                  <div key={wIdx} className={`grid grid-cols-7 ${wIdx > 0 ? "border-t border-gray-200 dark:border-slate-700" : ""}`}>
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
              key="timeline"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CalendarTimelineView events={events} weeks={GRID_WEEKS} />
            </motion.div>
          )}

          {/* DAY VIEW */}
          {activeView === "day" && (
            <motion.div
              key="day"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CalendarDayView
                events={events}
                tasks={TASKS}
                weeks={GRID_WEEKS}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </>
  );
}
