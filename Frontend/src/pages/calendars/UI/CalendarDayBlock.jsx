import React, { useState } from "react";
import CalendarDayBlockEvent from "./CalendarDayBlockEvent";

/**
 * CalendarDayBlock
 *
 * A single cell inside the 7×4 calendar grid.
 *
 * Props:
 *  - day         (number | null) : Calendar date number. null = empty/padding cell.
 *  - date        (string)        : YYYY-MM-DD key for this cell (used by drag-and-drop).
 *  - isToday     (boolean)       : Highlight cell as today.
 *  - isOutside   (boolean)       : Day belongs to adjacent month (muted).
 *  - events      (array)         : Array of event objects for this day.
 *  - onDrop      (function)      : (date, eventId) => void — called when an event is dropped here.
 *  - onEditEvent (function)      : (event) => void — called when the edit button is clicked on a user task.
 *  - onDeleteEvent (function)    : (eventId) => void — called when the delete button is clicked on a user task.
 */
export default function CalendarDayBlock({
  day,
  date,
  isToday = false,
  isOutside = false,
  events = [],
  onDrop,
  onEditEvent,
  onDeleteEvent,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    // Only clear when truly leaving this element (not a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && date) {
      onDrop?.(date, eventId);
    }
  }

  return (
    <div
      className={[
        "min-h-[140px] p-2.5 flex flex-col gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors duration-150",
        // Overflow visible so tooltips can escape the cell
        "overflow-visible",
        isToday ? "bg-purple-100" : "bg-transparent",
        isOutside ? "opacity-40" : "",
        isDragOver ? "bg-purple-50 ring-2 ring-inset ring-purple-300" : "",
      ].join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day number badge */}
      {day !== null && (
        <span
          className={[
            "self-start w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] font-semibold leading-none shrink-0 mb-0.5",
            isToday ? "bg-purple-500 text-white" : "text-gray-600",
          ].join(" ")}
        >
          {day}
        </span>
      )}

      {/* Event pills — pass all fields so tooltip has full context */}
      {events.map((evt) => (
        <CalendarDayBlockEvent
          key={evt.id}
          id={evt.id}
          title={evt.title}
          startTime={evt.startTime}
          endTime={evt.endTime}
          type={evt.type}
          lecturer={evt.lecturer}
          location={evt.location}
          draggable={!!evt.id?.startsWith("task-local-")}
          isUserTask={!!evt.id?.startsWith("task-local-")}
          onEdit={() => onEditEvent?.(evt)}
          onDelete={() => onDeleteEvent?.(evt.id)}
        />
      ))}
    </div>
  );
}
