import React from "react";
import { motion } from "framer-motion";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import CalendarDayBlock from "../../components/CalendarDayBlock";
import "../../components/calendarDayBlock.css";

// ─────────────────────────────────────────────────────────────
//  EVENTS DATA
//  Each event belongs to a specific date in "YYYY-MM-DD" format.
//  Shape: { id, date, title, startTime, endTime, type }
//  type: "class" | "meeting" | "task" | "personal"
//  Easy to replace with a backend fetch later.
// ─────────────────────────────────────────────────────────────
const EVENTS = [
  // ── Week 1 (Mar 2 – 8) ──────────────────────────────────
  { id: 1,  date: "2026-03-02", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class" },
  { id: 2,  date: "2026-03-02", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class" },
  { id: 3,  date: "2026-03-02", title: "DV 300",        startTime: "2:00",  endTime: "4:00",  type: "class" },
  { id: 4,  date: "2026-03-03", title: "Group Meeting",  startTime: "9:00",  endTime: "10:00", type: "meeting" },
  { id: 5,  date: "2026-03-04", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class" },
  { id: 6,  date: "2026-03-05", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class" },

  // ── Week 2 (Mar 9 – 15) ─────────────────────────────────
  { id: 7,  date: "2026-03-09", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class" },
  { id: 8,  date: "2026-03-09", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class" },
  { id: 9,  date: "2026-03-09", title: "DV 300",        startTime: "2:00",  endTime: "4:00",  type: "class" },
  { id: 10, date: "2026-03-11", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class" },
  { id: 11, date: "2026-03-12", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class" },
  { id: 12, date: "2026-03-13", title: "Task 1 Due",    startTime: "11:00", endTime: null,     type: "task" },
  { id: 13, date: "2026-03-14", title: "Grandma B Day", startTime: "10:00", endTime: "11:00", type: "personal" },

  // ── Week 3 (Mar 16 – 22) ────────────────────────────────
  { id: 14, date: "2026-03-16", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class" },
  { id: 15, date: "2026-03-16", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class" },
  { id: 16, date: "2026-03-16", title: "DV 300",        startTime: "2:00",  endTime: "4:00",  type: "class" },
  { id: 17, date: "2026-03-18", title: "Group Meeting",  startTime: "7:00",  endTime: "9:00",  type: "meeting" },
  { id: 18, date: "2026-03-18", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class" },
  { id: 19, date: "2026-03-19", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class" },
  { id: 20, date: "2026-03-20", title: "Coffee Date",   startTime: "10:00", endTime: "11:00", type: "personal" },

  // ── Week 4 (Mar 23 – 29) ────────────────────────────────
  { id: 21, date: "2026-03-23", title: "UX 300",        startTime: "8:30",  endTime: "9:30",  type: "class" },
  { id: 22, date: "2026-03-23", title: "VC 300",        startTime: "9:00",  endTime: "10:00", type: "class" },
  { id: 23, date: "2026-03-23", title: "DV 300",        startTime: "2:00",  endTime: "4:00",  type: "class" },
  { id: 24, date: "2026-03-24", title: "Group Meeting",  startTime: "9:00",  endTime: "10:00", type: "meeting" },
  { id: 25, date: "2026-03-25", title: "UX 300",        startTime: "9:00",  endTime: "13:00", type: "class" },
  { id: 26, date: "2026-03-26", title: "DV 300",        startTime: "13:00", endTime: "17:00", type: "class" },
  { id: 27, date: "2026-03-29", title: "Work on UX",    startTime: "10:00", endTime: "11:00", type: "personal" },
];

// ─────────────────────────────────────────────────────────────
//  CALENDAR GRID CONFIG
//  March 2026: March 1 is a Sunday.
//  Grid runs Mon → Sun across 4 rows, starting Mar 2.
//  Days outside March are marked isOutside = true.
// ─────────────────────────────────────────────────────────────
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// 4 rows × 7 cols  –  Mon 2 Mar to Sun 29 Mar
// (Mar 1 = Sunday falls before this grid; Mar 30–31 fall after)
const GRID_WEEKS = [
  [
    { date: "2026-03-02", day: 2 },
    { date: "2026-03-03", day: 3 },
    { date: "2026-03-04", day: 4 },
    { date: "2026-03-05", day: 5 },
    { date: "2026-03-06", day: 6 },
    { date: "2026-03-07", day: 7 },
    { date: "2026-03-08", day: 8 },
  ],
  [
    { date: "2026-03-09",  day: 9  },
    { date: "2026-03-10",  day: 10 },
    { date: "2026-03-11",  day: 11 },
    { date: "2026-03-12",  day: 12 },
    { date: "2026-03-13",  day: 13 },
    { date: "2026-03-14",  day: 14 },
    { date: "2026-03-15",  day: 15 },
  ],
  [
    { date: "2026-03-16",  day: 16 },
    { date: "2026-03-17",  day: 17 },
    { date: "2026-03-18",  day: 18 },
    { date: "2026-03-19",  day: 19 },
    { date: "2026-03-20",  day: 20 },
    { date: "2026-03-21",  day: 21 },
    { date: "2026-03-22",  day: 22 },
  ],
  [
    { date: "2026-03-23",  day: 23 },
    { date: "2026-03-24",  day: 24 },
    { date: "2026-03-25",  day: 25 },
    { date: "2026-03-26",  day: 26 },
    { date: "2026-03-27",  day: 27 },
    { date: "2026-03-28",  day: 28 },
    { date: "2026-03-29",  day: 29 },
  ],
];

// Build a quick lookup: date string → array of events
function buildEventMap(events) {
  return events.reduce((map, evt) => {
    if (!map[evt.date]) map[evt.date] = [];
    map[evt.date].push(evt);
    return map;
  }, {});
}

// Page entrance animation
const pageVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// ─────────────────────────────────────────────────────────────
export default function StudentCalendar() {
  const eventMap = buildEventMap(EVENTS);

  // Detect today so the correct cell can be highlighted
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  return (
    <>
      {/* Top navigation bar */}
      <Menu />
      {/* Side navigation bar */}
      <SideMenu />

      <motion.div
        className="student-cal-page"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{
          padding: "80px 32px 40px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* ── Top bar: Month title + Add Task ── */}
        <div className="cal-topbar">
          <h1 className="cal-month-title">
            March 2026
            <span className="cal-month-title__caret">∨</span>
          </h1>

          <button className="cal-add-btn" id="cal-add-task-btn" aria-label="Add Task">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Task
          </button>
        </div>

        {/* ── Calendar grid ── */}
        <div className="cal-grid-wrapper">

          {/* Day-of-week header */}
          <div className="cal-header-row">
            {WEEK_DAYS.map((label, i) => (
              <div key={i} className="cal-header-cell">{label}</div>
            ))}
          </div>

          {/* 4 week rows */}
          <div className="cal-body">
            {GRID_WEEKS.map((week, wIdx) => (
              <div key={wIdx} className="cal-week-row">
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

        </div>
      </motion.div>
    </>
  );
}
