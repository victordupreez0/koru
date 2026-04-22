import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

import CalendarDayBlock        from "./UI/CalendarDayBlock";
import CalendarViewSelector    from "./UI/CalendarViewSelector";
import CalendarTimelineView    from "./UI/CalendarTimelineView";
import CalendarDayView         from "./UI/CalendarDayView";

// ─────────────────────────────────────────────────────────────
//  EVENTS DATA
//  Shape: { id, date, title, startTime, endTime, type, lecturer?, location? }
//  type: "class" | "meeting" | "task" | "personal"
// ─────────────────────────────────────────────────────────────
const EVENTS = [
  // ── Week 1 (Mar 2 – 8) ──────────────────────────────────
  { id: 1,  date: "2026-03-02", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 2,  date: "2026-03-02", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class",    lecturer: "Matt Williams",   location: "Online"          },
  { id: 3,  date: "2026-03-02", title: "DV 300",        startTime: "14:00", endTime: "16:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 4,  date: "2026-03-03", title: "Group Meeting", startTime: "9:00",  endTime: "10:00", type: "meeting",  lecturer: "Study Group",     location: "Online"          },
  { id: 5,  date: "2026-03-04", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 6,  date: "2026-03-05", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },

  // ── Week 2 (Mar 9 – 15) ─────────────────────────────────
  { id: 7,  date: "2026-03-09", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 8,  date: "2026-03-09", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class",    lecturer: "Matt Williams",   location: "Online"          },
  { id: 9,  date: "2026-03-09", title: "DV 300",        startTime: "14:00", endTime: "16:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 10, date: "2026-03-11", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 11, date: "2026-03-12", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 12, date: "2026-03-13", title: "Task 1 Due",    startTime: "11:00", endTime: null,     type: "task",                                                              },
  { id: 13, date: "2026-03-14", title: "Grandma B Day", startTime: "10:00", endTime: "11:00", type: "personal",                                                          },

  // ── Week 3 (Mar 16 – 22) ────────────────────────────────
  { id: 14, date: "2026-03-16", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 15, date: "2026-03-16", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class",    lecturer: "Matt Williams",   location: "Online"          },
  { id: 16, date: "2026-03-16", title: "DV 300",        startTime: "14:00", endTime: "16:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 17, date: "2026-03-18", title: "Group Meeting", startTime: "7:00",  endTime: "9:00",  type: "meeting",  lecturer: "Study Group",     location: "Online"          },
  { id: 18, date: "2026-03-18", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 19, date: "2026-03-19", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 20, date: "2026-03-20", title: "Coffee Date",   startTime: "10:00", endTime: "11:00", type: "personal",                                                          },

  // ── Week 4 (Mar 23 – 29) ────────────────────────────────
  { id: 21, date: "2026-03-23", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 22, date: "2026-03-23", title: "VC 300",        startTime: "14:00", endTime: "18:00", type: "class",    lecturer: "Matt Williams",   location: "Online"          },
  { id: 23, date: "2026-03-23", title: "DV 300",        startTime: "14:00", endTime: "16:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 24, date: "2026-03-24", title: "Group Meeting", startTime: "9:00",  endTime: "10:00", type: "meeting",  lecturer: "Study Group",     location: "Online"          },
  { id: 25, date: "2026-03-25", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class",    lecturer: "Laudette Sass",   location: "On Campus - C4"  },
  { id: 26, date: "2026-03-26", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class",    lecturer: "Tsungai Katsuro", location: "On Campus - B2"  },
  { id: 27, date: "2026-03-29", title: "Work on UX",    startTime: "10:00", endTime: "11:00", type: "personal",                                                          },
];

// ─────────────────────────────────────────────────────────────
//  TASKS DATA  (To-Do panel in Day view)
//  Shape: { id, title, due, dueTime, course }
// ─────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, title: "High Fidelity Wireframes", due: "Mar 2",  dueTime: "20:00", course: "UX300" },
  { id: 2, title: "Essay Draft",              due: "Mar 10", dueTime: "20:00", course: "VC300" },
  { id: 3, title: "Progress Mark",            due: "Mar 21", dueTime: "10:00", course: "DV300" },
];

// ─────────────────────────────────────────────────────────────
//  MARCH 2026 GRID — 4 rows × 7 cols (Mon Mar 2 → Sun Mar 29)
// ─────────────────────────────────────────────────────────────
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const GRID_WEEKS = [
  [
    { date: "2026-03-02", day: 2  },
    { date: "2026-03-03", day: 3  },
    { date: "2026-03-04", day: 4  },
    { date: "2026-03-05", day: 5  },
    { date: "2026-03-06", day: 6  },
    { date: "2026-03-07", day: 7  },
    { date: "2026-03-08", day: 8  },
  ],
  [
    { date: "2026-03-09", day: 9  },
    { date: "2026-03-10", day: 10 },
    { date: "2026-03-11", day: 11 },
    { date: "2026-03-12", day: 12 },
    { date: "2026-03-13", day: 13 },
    { date: "2026-03-14", day: 14 },
    { date: "2026-03-15", day: 15 },
  ],
  [
    { date: "2026-03-16", day: 16 },
    { date: "2026-03-17", day: 17 },
    { date: "2026-03-18", day: 18 },
    { date: "2026-03-19", day: 19 },
    { date: "2026-03-20", day: 20 },
    { date: "2026-03-21", day: 21 },
    { date: "2026-03-22", day: 22 },
  ],
  [
    { date: "2026-03-23", day: 23 },
    { date: "2026-03-24", day: 24 },
    { date: "2026-03-25", day: 25 },
    { date: "2026-03-26", day: 26 },
    { date: "2026-03-27", day: 27 },
    { date: "2026-03-28", day: 28 },
    { date: "2026-03-29", day: 29 },
  ],
];

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

  const eventMap = buildEventMap(EVENTS);
  const todayStr = new Date().toISOString().slice(0, 10);

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
          <h1 className="font-['Gabarito'] text-[1.6rem] font-bold text-gray-900 flex items-center gap-1.5">
            March 2026
            <span className="text-base text-gray-400">∨</span>
          </h1>

          {/* View selector — truly centred */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <CalendarViewSelector activeView={activeView} onChange={setActiveView} />
          </div>

          {/* Add Task — right */}
          <button
            id="cal-add-task-btn"
            aria-label="Add Task"
            className="flex items-center gap-2 bg-gray-100 rounded-full px-5 py-2.5 text-sm font-semibold text-gray-700 border-none cursor-pointer transition-all duration-150 hover:bg-gray-200 hover:-translate-y-px font-[inherit]"
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
              <div className="grid grid-cols-7 border-b border-gray-200">
                {WEEK_DAYS.map((label, i) => (
                  <div key={i} className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400 py-2.5">
                    {label}
                  </div>
                ))}
              </div>

              {/* 4 week rows */}
              <div className="flex flex-col">
                {GRID_WEEKS.map((week, wIdx) => (
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
              key="timeline"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <CalendarTimelineView events={EVENTS} weeks={GRID_WEEKS} />
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
                events={EVENTS}
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
