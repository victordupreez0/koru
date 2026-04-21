import React from "react";

/**
 * CalendarDayBlockEvent
 *
 * A single event pill inside a calendar day cell.
 *
 * Props:
 *  - title     (string) : e.g. "UX 300"
 *  - startTime (string) : e.g. "8:30"
 *  - endTime   (string) : e.g. "9:30"
 *  - type      (string) : "class" | "meeting" | "task" | "personal"
 */
export default function CalendarDayBlockEvent({ title, startTime, endTime, type = "class" }) {
  const iconMap = {
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

  return (
    <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 text-[11px] font-medium text-black cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-sm">
      {/* Icon */}
      <span className="shrink-0 text-gray-400 mt-px">
        {iconMap[type] ?? iconMap.class}
      </span>

      {/* Title */}
      <span className="flex-1 truncate">{title}</span>

      {/* Time — stacked start / end */}
      {(startTime || endTime) && (
        <span className="shrink-0 text-[10px] text-gray-400 text-right leading-tight whitespace-nowrap">
          {startTime && <span className="block">{startTime}</span>}
          {endTime   && <span className="block">{endTime}</span>}
        </span>
      )}
    </div>
  );
}
