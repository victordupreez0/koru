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
const START_HOUR = 7;   // 07:00
const TOTAL_HOURS = 13; // 07:00 → 20:00
const TRACK_H = 540;    // px

function timeToY(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  const minutes = (h - START_HOUR) * 60 + m;
  return Math.max(0, (minutes / (TOTAL_HOURS * 60)) * TRACK_H);
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// ── Hour labels for the left gutter ────────────────────────────
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = START_HOUR + i;
  return h <= 12 ? `${h} AM` : `${h - 12} PM`;
});

// ─────────────────────────────────────────────────────────────
/**
 * CalendarTimelineView
 *
 * Vertical weekly timeline: 7 day columns, events pinned by time.
 * Styled to match the month view card (white bg, rounded, shadow).
 *
 * Props:
 *  - events (array) : Flat EVENTS array
 *  - weeks  (array) : GRID_WEEKS array — array of week arrays
 */
export default function CalendarTimelineView({ events = [], weeks = [] }) {
  const [weekIdx, setWeekIdx] = useState(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const idx = weeks.findIndex(week => week.some(day => day.date === today));
    return idx >= 0 ? idx : 0;
  });
  const currentWeek = weeks[weekIdx] ?? [];

  // Build a dynamic week label from dates like "May 5 – 11"
  const formatWeekLabel = () => {
    if (currentWeek.length !== 7) return "";
    const first = new Date(currentWeek[0].date);
    const last = new Date(currentWeek[6].date);
    const monthName = first.toLocaleDateString("en-US", { month: "short" });
    const lastMonthName = last.toLocaleDateString("en-US", { month: "short" });
    if (monthName === lastMonthName) {
      return `${monthName} ${first.getDate()} – ${last.getDate()}`;
    }
    return `${monthName} ${first.getDate()} – ${lastMonthName} ${last.getDate()}`;
  };

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Dot x-center (relative to column left edge) for the timeline axis
  const AXIS_X = 18; // px from left of each column

  return (
    <div className="bg-white/70 rounded-3xl shadow-xl border border-gray-200 overflow-hidden">

      {/* ── Week navigation header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
            disabled={weekIdx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-sm border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center select-none">
            {formatWeekLabel()}
          </span>
          <button
            onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
            disabled={weekIdx === weeks.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-sm border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Week {weekIdx + 1} of {weeks.length}
        </span>
      </div>

      {/* ── 7-column timeline with hour gutter ── */}
      <div className="flex">

        {/* Hour labels gutter */}
        <div className="shrink-0 w-14 pt-10 pr-2" style={{ height: TRACK_H + 40 }}>
          {HOUR_LABELS.map((label, i) => (
            <div
              key={i}
              className="text-[10px] text-gray-400 text-right font-medium"
              style={{
                position: "absolute",
                top: 40 + (i / TOTAL_HOURS) * TRACK_H - 6,
              }}
            />
          ))}
          {/* Render hour labels at their Y positions */}
          <div className="relative" style={{ height: TRACK_H }}>
            {HOUR_LABELS.map((label, i) => (
              <span
                key={i}
                className="absolute right-2 text-[10px] text-gray-300 font-medium leading-none"
                style={{ top: (i / TOTAL_HOURS) * TRACK_H - 5 }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 flex-1">
          {currentWeek.map(({ date, day }, colIdx) => {
            const isToday = date === todayStr;
            const PILL_HEIGHT = 30; // approximate height of one event pill in px
            const dayEvents = events
              .filter((e) => e.date === date)
              .map((e) => ({ ...e, y: timeToY(e.startTime) }))
              .sort((a, b) => a.y - b.y);

            // Stack events that would overlap: push each down if it collides with the previous
            for (let i = 1; i < dayEvents.length; i++) {
              const prev = dayEvents[i - 1];
              if (dayEvents[i].y < prev.y + PILL_HEIGHT) {
                dayEvents[i].y = prev.y + PILL_HEIGHT;
              }
            }

            return (
              <div
                key={date}
                className={[
                  "flex flex-col border-l border-gray-100 first:border-l-0",
                  isToday ? "bg-purple-100" : "",
                ].join(" ")}
              >
                {/* Day header */}
                <div className="text-center py-2.5 border-b border-gray-100">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block">
                    {DAY_LABELS[colIdx]}
                  </span>
                  <span
                    className={[
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-0.5",
                      isToday ? "bg-purple-500 text-white" : "text-gray-600",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                </div>

                {/* Timeline track */}
                <div className="relative px-1" style={{ height: TRACK_H }}>

                  {/* Horizontal hour gridlines */}
                  {HOUR_LABELS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: (i / TOTAL_HOURS) * TRACK_H }}
                    />
                  ))}

                  {/* Vertical axis line */}
                  <div
                    className="absolute top-0 bg-gray-200"
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
                        className="shrink-0 rounded-full bg-purple-400"
                        style={{
                          width: 9,
                          height: 9,
                          marginLeft: AXIS_X - 4,
                          marginRight: 6,
                        }}
                      />

                      {/* Pill + tooltip wrapper */}
                      <div className="relative group">

                        {/* ── Hover tooltip ── */}
                        {(evt.lecturer || evt.location || evt.startTime) && (
                          <div className={[
                            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
                            "w-52 bg-purple-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-3",
                            "pointer-events-none",
                            "opacity-0 group-hover:opacity-100",
                            "translate-y-1.5 group-hover:translate-y-0",
                            "transition-all duration-200 ease-out",
                          ].join(" ")}>
                            {/* Icon + title */}
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="w-8 h-8 rounded-xl border border-purple-600 bg-purple-700 flex items-center justify-center shrink-0 text-white">
                                {ICONS[evt.type] ?? ICONS.class}
                              </div>
                              <span className="font-semibold text-[13px] text-white leading-snug">{evt.title}</span>
                            </div>
                            {/* Divider */}
                            <div className="h-px bg-white/20 mb-2" />
                            {/* Meta rows */}
                            <div className="flex flex-col gap-1.5">
                              {evt.startTime && (
                                <div className="flex items-center gap-1.5 text-[11px] text-white">
                                  <svg className="shrink-0 text-white" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  <span>{evt.startTime}{evt.endTime ? ` – ${evt.endTime}` : ""}</span>
                                </div>
                              )}
                              {evt.lecturer && (
                                <div className="flex items-center gap-1.5 text-[11px] text-white">
                                  <svg className="shrink-0 text-white" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                  <span className="truncate">{evt.lecturer}</span>
                                </div>
                              )}
                              {evt.location && (
                                <div className="flex items-center gap-1.5 text-[11px] text-white">
                                  <svg className="shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                  <span className="truncate">{evt.location}</span>
                                </div>
                              )}
                            </div>
                            {/* Caret */}
                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 bg-purple-800 rotate-45 shadow-[1px_1px_0px_rgba(0,0,0,0.04)]" />
                          </div>
                        )}

                        {/* ── Event pill ── */}
                        <div className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-[5px] text-[10px] font-medium text-gray-700 shadow-xs cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-md hover:bg-purple-100">
                          <span className="shrink-0 text-purple-700">
                            {ICONS[evt.type] ?? ICONS.class}
                          </span>
                          <span className="truncate max-w-[90px]">{evt.title}</span>
                          {(evt.startTime || evt.endTime) && (
                            <span className="shrink-0 text-[9px] text-gray-400 leading-tight text-right whitespace-nowrap ml-1">
                              {evt.startTime && <span className="block">{evt.startTime}</span>}
                              {evt.endTime && <span className="block">{evt.endTime}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom terminator circle */}
                  <div
                    className="absolute rounded-full border border-purple-300 bg-white"
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
    </div>
  );
}
