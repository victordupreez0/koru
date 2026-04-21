import React from "react";
import CalendarDayBlockEvent from "./CalendarDayBlockEvent";
import "./calendarDayBlock.css";

/**
 * CalendarDayBlock
 *
 * A single cell inside the 7×4 calendar grid.
 *
 * Props:
 *  - day      (number | null) : Calendar date number. null = empty/padding cell.
 *  - isToday  (boolean)       : Highlight as today.
 *  - isOutside (boolean)      : Day belongs to adjacent month (muted).
 *  - events   (array)         : Array of event objects for this day.
 *                               Shape: { id, title, startTime, endTime, type }
 */
export default function CalendarDayBlock({ day, isToday = false, isOutside = false, events = [] }) {
  const classNames = [
    "cal-day",
    isToday ? "cal-day--today" : "",
    isOutside ? "cal-day--outside" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {day !== null && (
        <span className="cal-day__num">{day}</span>
      )}

      {events.map((evt) => (
        <CalendarDayBlockEvent
          key={evt.id}
          title={evt.title}
          startTime={evt.startTime}
          endTime={evt.endTime}
          type={evt.type}
        />
      ))}
    </div>
  );
}
