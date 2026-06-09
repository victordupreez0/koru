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


const MAX_VISIBLE = 3;

export default function CalendarDayBlock({
  day,
  date,
  isToday = false,
  isOutside = false,
  events = [],
  onDrop,
  onEditEvent,
  onDeleteEvent,
  onDayClick,
  tooltipPosition = "up",
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasOverflow = events.length > MAX_VISIBLE;
  const visibleEvents = expanded ? events : events.slice(0, MAX_VISIBLE);
  const hiddenCount = events.length - MAX_VISIBLE;

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
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
        "min-h-[140px] p-2.5 flex flex-col gap-1.5 border-r border-gray-200 last:border-r-0 transition-colors duration-150 cursor-pointer",
        "overflow-visible",
        isToday ? "bg-purple-50/80" : "bg-transparent",
        isOutside ? "opacity-40" : "",
        isDragOver ? "bg-purple-50 ring-2 ring-inset ring-purple-300" : "",
      ].join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => day !== null && onDayClick?.(date)}
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

      {visibleEvents.map((evt) => (
        <div key={evt.id} onClick={e => e.stopPropagation()}>
          <CalendarDayBlockEvent
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
            tooltipPosition={tooltipPosition}
          />
        </div>
      ))}

      {hasOverflow && !expanded && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setExpanded(true); }}
          className="self-start text-[10px] font-semibold text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-purple-50"
        >
          +{hiddenCount} more
        </button>
      )}

      {hasOverflow && expanded && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setExpanded(false); }}
          className="self-start text-[10px] font-semibold text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer px-1 py-0.5 rounded transition-colors hover:bg-gray-50"
        >
          Show less
        </button>
      )}
    </div>
  );
}
