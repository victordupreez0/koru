import React, { useState } from "react";

// ── Icons (same set as CalendarDayBlockEvent) ─────────────────
const ICONS = {
  class: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  meeting: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  task: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  personal: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// ── Time → Y pixel mapping ─────────────────────────────────────
const START_HOUR  = 7;   // 07:00
const TOTAL_HOURS = 13;  // 07:00 → 20:00
const TRACK_H     = 540; // px

function timeToY(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  const minutes = (h - START_HOUR) * 60 + m;
  return Math.max(0, (minutes / (TOTAL_HOURS * 60)) * TRACK_H);
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// ─────────────────────────────────────────────────────────────
/**
 * CalendarTimelineView
 *
 * Vertical weekly timeline: 7 day columns, events pinned by time.
 *
 * Props:
 *  - events (array) : Flat EVENTS array
 *  - weeks  (array) : GRID_WEEKS array — array of 4 week arrays
 */
export default function CalendarTimelineView({ events = [], weeks = [] }) {
  const [weekIdx, setWeekIdx] = useState(() => {
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    const idx = weeks.findIndex(week => week.some(d => d.date === todayStr));
    return idx >= 0 ? idx : 0;
  });
  const currentWeek = weeks[weekIdx] ?? [];

  // Week label e.g. "Mar 2 – 8"
  const weekLabel = currentWeek.length === 7
    ? `Mar ${currentWeek[0].day} – ${currentWeek[6].day}`
    : "";

  // Dot x-center (relative to column left edge) for the timeline axis
  const AXIS_X = 18; // px from left of each column

  return (
    <div>
      {/* ── Week navigation ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
          disabled={weekIdx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 text-sm border-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ‹
        </button>
        <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest min-w-[70px] text-center">
          {weekLabel}
        </span>
        <button
          onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
          disabled={weekIdx === weeks.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 text-sm border-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ›
        </button>
      </div>

      {/* ── 7-column timeline ── */}
      <div className="grid grid-cols-7">
        {currentWeek.map(({ date, day }, colIdx) => {
          const dayEvents = events
            .filter((e) => e.date === date)
            .map((e) => ({ ...e, y: timeToY(e.startTime) }))
            .sort((a, b) => a.y - b.y);

          return (
            <div key={date} className="flex flex-col">
              {/* Day header */}
              <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
                {DAY_LABELS[colIdx]}
              </p>

              {/* Timeline track */}
              <div className="relative" style={{ height: TRACK_H }}>

                {/* Vertical axis line */}
                <div
                  className="absolute top-0 bg-gray-200 dark:bg-slate-600"
                  style={{ left: AXIS_X, width: 1, bottom: 24 }}
                />

                {/* Events */}
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="absolute flex items-center"
                    style={{ top: evt.y, left: 0, right: 4 }}
                  >
                    {/* Filled dot on axis */}
                    <div
                      className="shrink-0 rounded-full bg-gray-400 dark:bg-slate-500"
                      style={{
                        width: 9,
                        height: 9,
                        marginLeft: AXIS_X - 4, // center dot on axis
                        marginRight: 6,
                      }}
                    />

                    {/* Pill + tooltip wrapper */}
                    <div className="relative group">

                      {/* ── Hover tooltip ── */}
                      {(evt.lecturer || evt.location || evt.startTime) && (
                        <div className={[
                          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
                          "w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-3",
                          "pointer-events-none",
                          "opacity-0 group-hover:opacity-100",
                          "translate-y-1.5 group-hover:translate-y-0",
                          "transition-all duration-200 ease-out",
                        ].join(" ")}>
                          {/* Icon + title */}
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-500 dark:text-slate-400">
                              {ICONS[evt.type] ?? ICONS.class}
                            </div>
                            <span className="font-semibold text-[13px] text-gray-900 dark:text-slate-100 leading-snug">{evt.title}</span>
                          </div>
                          {/* Divider */}
                          <div className="h-px bg-gray-100 dark:bg-slate-700 mb-2" />
                          {/* Meta rows */}
                          <div className="flex flex-col gap-1.5">
                            {evt.startTime && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                                <svg className="shrink-0 text-gray-400 dark:text-slate-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ""}</span>
                              </div>
                            )}
                            {evt.lecturer && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                                <svg className="shrink-0 text-gray-400 dark:text-slate-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                <span className="truncate">{evt.lecturer}</span>
                              </div>
                            )}
                            {evt.location && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
                                <svg className="shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span className="truncate">{evt.location}</span>
                              </div>
                            )}
                          </div>
                          {/* Caret */}
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 bg-white dark:bg-slate-800 rotate-45 shadow-[1px_1px_0px_rgba(0,0,0,0.04)]" />
                        </div>
                      )}

                      {/* ── Event pill ── */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-full px-2.5 py-[5px] text-[10px] font-medium text-gray-700 dark:text-slate-200 shadow-sm cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-md">
                        <span className="shrink-0 text-gray-400 dark:text-slate-500">
                          {ICONS[evt.type] ?? ICONS.class}
                        </span>
                        <span className="truncate max-w-[90px]">{evt.title}</span>
                        {(evt.startTime || evt.endTime) && (
                          <span className="shrink-0 text-[9px] text-gray-400 dark:text-slate-500 leading-tight text-right whitespace-nowrap ml-1">
                            {evt.startTime && <span className="block">{evt.startTime}</span>}
                            {evt.endTime   && <span className="block">{evt.endTime}</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bottom terminator circle */}
                <div
                  className="absolute rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  style={{
                    width: 12,
                    height: 12,
                    left: AXIS_X - 5.5,
                    bottom: 18,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
