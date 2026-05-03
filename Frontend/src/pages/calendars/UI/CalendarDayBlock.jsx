import React from "react";
import CalendarDayBlockEvent from "./CalendarDayBlockEvent";

/**
 * CalendarDayBlock
 *
 * A single cell inside the 7×4 calendar grid.
 *
 * Props:
 *  - day       (number | null) : Calendar date number. null = empty/padding cell.
 *  - isToday   (boolean)       : Highlight cell as today.
 *  - isOutside (boolean)       : Day belongs to adjacent month (muted).
 *  - events    (array)         : Array of event objects for this day.
 *                                Shape: { id, title, startTime, endTime, type, lecturer?, location? }
 */
export default function CalendarDayBlock({ day, isToday = false, isOutside = false, events = [] }) {
  return (
    <div
      className={[
        "min-h-[140px] p-2.5 flex flex-col gap-1.5 border-r border-gray-200 dark:border-slate-700 last:border-r-0 transition-colors duration-150",
        // Overflow visible so tooltips can escape the cell
        "overflow-visible",
        isToday   ? "bg-gray-100 dark:bg-slate-700/50"  : "bg-transparent",
        isOutside ? "opacity-40"   : "",
      ].join(" ")}
    >
      {/* Day number badge */}
      {day !== null && (
        <span
          className={[
            "self-start w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-semibold leading-none shrink-0 mb-0.5",
            isToday ? "bg-gray-700 dark:bg-slate-500 text-white" : "text-gray-600 dark:text-slate-300",
          ].join(" ")}
        >
          {day}
        </span>
      )}

      {/* Event pills — pass all fields so tooltip has full context */}
      {events.map((evt) => (
        <CalendarDayBlockEvent
          key={evt.id}
          title={evt.title}
          startTime={evt.startTime}
          endTime={evt.endTime}
          type={evt.type}
          lecturer={evt.lecturer}
          location={evt.location}
        />
      ))}
    </div>
  );
}
