import React, { useState } from "react";

// ── Constants ─────────────────────────────────────────────────
const START_HOUR  = 7;    // 07:00
const TOTAL_HOURS = 13;   // 07:00 → 20:00
const TRACK_H_PER_HOUR = 58; // px per hour
const CARD_H      = 90;   // fixed card height (px) — overlap guard uses this
const AXIS_X      = 16;   // px from left edge where the vertical line lives

function timeToY(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return Math.max(0, ((h - START_HOUR) * 60 + m) / 60 * TRACK_H_PER_HOUR);
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Icons ────────────────────────────────────────────────────
const MonitorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const PersonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AssignmentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="12" y2="16" />
  </svg>
);

const TYPE_ICONS = {
  class:      <MonitorIcon />,
  meeting:    <PeopleIcon />,
  task:       <CheckIcon />,
  personal:   <PersonIcon />,
  assignment: <AssignmentIcon />,
};

// ─────────────────────────────────────────────────────────────
/**
 * CalendarDayView
 *
 * Two-column layout:
 *  Left  — vertical timeline with large event cards (classes + assignments)
 *  Right — To-Do list showing only assignments due/were due on selected day
 *
 * Props:
 *  - events   (array) : Flat EVENTS array (with optional lecturer, location, isAssignment)
 *  - allTasks (array) : Array of assignment tasks with submission state
 *  - weeks    (array) : GRID_WEEKS — used to build the day nav list
 */
export default function CalendarDayView({ events = [], allTasks = [], weeks = [] }) {
  // Flatten all dates in the month into a navigable list
  const allDates = weeks.flat(); // [{ date, day }, ...]
  const [dateIdx, setDateIdx] = useState(() => {
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    const idx = allDates.findIndex(d => d.date === todayStr);
    return idx >= 0 ? idx : 0;
  });

  const selected = allDates[dateIdx];
  if (!selected) return <p className="text-gray-400 text-sm pt-8">No dates available.</p>;

  const { date, day } = selected;
  const jsDate  = new Date(date + "T00:00:00");
  const dayName = DAY_NAMES[jsDate.getDay()].toUpperCase();

  // Filter + sort events for the selected day
  const raw = events
    .filter((e) => e.date === date)
    .map((e) => ({ ...e, _y: timeToY(e.startTime) }))
    .sort((a, b) => a._y - b._y);

  // Overlap guard: push events down so cards never visually collide
  let prevBottom = -Infinity;
  const dayEvents = raw.map((evt) => {
    const y = Math.max(evt._y, prevBottom + 10);
    prevBottom = y + CARD_H;
    return { ...evt, y };
  });

  const trackH = Math.max(
    TOTAL_HOURS * TRACK_H_PER_HOUR,
    prevBottom + 20
  );

  // Filter tasks to only those due on the selected day
  const dayTasks = allTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskDateStr = new Date(taskDate.getTime() - (taskDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    return taskDateStr === date;
  });

  return (
    <div>
      {/* ── Day navigation header ──────────────────────────── */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => setDateIdx((i) => Math.max(0, i - 1))}
          disabled={dateIdx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-base border-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-25 disabled:cursor-not-allowed transition font-[inherit]"
          aria-label="Previous day"
        >
          ‹
        </button>

        <p className="text-[13px] font-semibold tracking-widest text-gray-500 dark:text-slate-400 uppercase leading-none">
          {dayName}&nbsp;
          <span className="text-gray-900 dark:text-slate-100 text-xl font-black tracking-normal normal-case">
            {day}
          </span>
        </p>

        <button
          onClick={() => setDateIdx((i) => Math.min(allDates.length - 1, i + 1))}
          disabled={dateIdx === allDates.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-base border-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-25 disabled:cursor-not-allowed transition font-[inherit]"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {/* ── Two-column body ───────────────────────────────── */}
      <div className="grid gap-10" style={{ gridTemplateColumns: "55% 1fr" }}>

        {/* ── LEFT: Vertical timeline ── */}
        <div className="relative" style={{ height: trackH }}>

          {/* Axis line */}
          <div
            className="absolute top-0 bottom-0 bg-gray-200 dark:bg-slate-600"
            style={{ left: AXIS_X, width: 1 }}
          />

          {dayEvents.length === 0 && (
            <p className="absolute text-sm text-gray-400 dark:text-slate-500" style={{ left: AXIS_X + 20, top: 12 }}>
              No events this day.
            </p>
          )}

          {dayEvents.map((evt) => (
            <div
              key={evt.id}
              className="absolute flex items-center"
              style={{ top: evt.y, left: 0, right: 0 }}
            >
              {/* Dot on axis */}
              <div
                className={`shrink-0 rounded-full ${evt.isAssignment ? 'bg-orange-400' : 'bg-gray-400 dark:bg-slate-500'}`}
                style={{
                  width: 9,
                  height: 9,
                  marginLeft: AXIS_X - 4,
                  marginRight: 14,
                }}
              />

              {/* Event card */}
              <div
                className={`flex-1 flex items-stretch rounded-2xl overflow-hidden mr-2 ${evt.isAssignment ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40' : 'bg-gray-100 dark:bg-slate-800'}`}
                style={{ minHeight: CARD_H }}
              >
                {/* Icon box */}
                <div className="flex items-center justify-center px-4 py-3 shrink-0">
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${evt.isAssignment ? 'border-orange-300 dark:border-orange-700 text-orange-500 dark:text-orange-400' : 'border-gray-400 dark:border-slate-600 text-gray-500 dark:text-slate-400'}`}>
                    {TYPE_ICONS[evt.type] ?? <MonitorIcon />}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 flex flex-col justify-center py-3 pr-2 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-slate-100 text-sm leading-tight truncate">
                    {evt.title}
                  </p>
                  {evt.isAssignment ? (
                    <p className="text-orange-500 dark:text-orange-400 text-xs mt-1 truncate font-semibold">
                      {evt.courseCode} · Due
                    </p>
                  ) : (
                    <>
                      {evt.lecturer && (
                        <p className="text-gray-500 dark:text-slate-400 text-xs mt-1 truncate">{evt.lecturer}</p>
                      )}
                      {evt.location && (
                        <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5 truncate">{evt.location}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Time column */}
                <div className="flex flex-col justify-between items-end px-4 py-4 border-l border-gray-200 dark:border-slate-700 shrink-0">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                    {evt.isAssignment ? 'Due' : evt.startTime}
                  </span>
                  {!evt.isAssignment && evt.endTime && (
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">{evt.endTime}</span>
                  )}
                  {evt.isAssignment && (
                    <span className="text-[11px] text-orange-500 dark:text-orange-400 font-semibold">{evt.startTime}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT: To-Do panel (assignments due this day) ── */}
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-['Gabarito'] text-2xl font-bold text-gray-900 dark:text-slate-100">
              To - Do
            </h2>
          </div>

          {/* Task list */}
          <div className="flex flex-col gap-3">
            {dayTasks.map((task) => {
              const now = new Date();
              const due = new Date(task.dueDate);
              const diffDays = (due - now) / (1000 * 60 * 60 * 24);
              
              // Determine UI state
              let uiState = "Due";
              let uiColor = "bg-blue-50 text-blue-600";
              if (task.isGraded) {
                uiState = "Graded";
                uiColor = "bg-green-50 text-green-600";
              } else if (task.isSubmitted) {
                uiState = "Submitted";
                uiColor = "bg-green-50 text-green-600";
              } else if (diffDays < -7) {
                uiState = "Closed";
                uiColor = "bg-gray-100 text-gray-500";
              } else if (diffDays < 0) {
                uiState = "Late";
                uiColor = "bg-red-50 text-red-600";
              } else if (diffDays <= 5) {
                uiState = "Due Soon";
                uiColor = "bg-orange-50 text-orange-600";
              }

              const isCompleted = task.isSubmitted || task.isGraded;

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all duration-300
                    ${isCompleted ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 opacity-50' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-md'}`}
                >
                  {/* Assignment icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-gray-100 dark:bg-slate-700' : 'bg-[#3C0078]/8 dark:bg-[#9BE9EA]/10'}`}>
                    <ClipboardIcon />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-tight font-['Gabarito'] ${isCompleted ? 'text-gray-400 dark:text-slate-600 line-through' : 'text-gray-800 dark:text-slate-100'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        <span className="font-bold text-gray-500 dark:text-slate-400">DUE</span> {task.due} at {task.dueTime}
                      </span>
                      {task.course && (
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded px-1.5 py-0.5">
                          {task.course}
                        </span>
                      )}
                      {uiState && !isCompleted && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${uiColor}`}>{uiState}</span>
                      )}
                    </div>
                  </div>

                  {/* Submit / completed button (same as dashboard) */}
                  {isCompleted ? (
                    <div
                      className="w-7 h-7 rounded-lg border-2 border-[#3C0078] dark:border-[#9BE9EA] bg-[#3C0078] dark:bg-[#0f766e] flex items-center justify-center shrink-0"
                      aria-label="Completed"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-4 py-2 bg-[#3C0078] dark:bg-[#0f766e] rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-gray-800 dark:hover:bg-[#14b8a6] transition-all shadow-sm shrink-0"
                    >
                      {uiState === 'Closed' ? 'View' : 'Submit'}
                    </button>
                  )}
                </div>
              );
            })}

            {dayTasks.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-slate-500 pl-1">No assignments due this day.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
