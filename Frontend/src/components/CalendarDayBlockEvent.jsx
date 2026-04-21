import React from "react";
import "./calendarDayBlock.css";

/**
 * CalendarDayBlockEvent
 *
 * Represents a single event pill inside a calendar day block.
 *
 * Props:
 *  - title   (string) : Event title e.g. "UX 300"
 *  - startTime (string) : e.g. "8:30"
 *  - endTime   (string) : e.g. "9:30"
 *  - type    (string) : "class" | "meeting" | "task" | "personal"
 *                       Controls the icon displayed.
 */
export default function CalendarDayBlockEvent({ title, startTime, endTime, type = "class" }) {
  const iconMap = {
    class: (
      // Monitor / screen icon
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    meeting: (
      // People / group icon
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    task: (
      // Checkbox icon
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    personal: (
      // Person icon
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return (
    <div className={`cal-event cal-event--${type}`}>
      <span className="cal-event__icon">{iconMap[type] ?? iconMap.class}</span>
      <span className="cal-event__title">{title}</span>
      {(startTime || endTime) && (
        <span className="cal-event__time">
          {startTime && <span>{startTime}</span>}
          {endTime && (
            <>
              <br />
              <span>{endTime}</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
