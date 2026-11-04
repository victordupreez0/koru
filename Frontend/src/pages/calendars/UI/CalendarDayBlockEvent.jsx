import React from "react";

// ── Type icons (for pill + tooltip) ──────────────────────────
const ICONS = {
  class: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  meeting: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  task: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  personal: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// Larger versions for the tooltip header
const ICONS_LG = {
  class: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  meeting: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  task: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  personal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

// Meta icons used inside the tooltip
const PersonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * CalendarDayBlockEvent
 *
 * A single event pill inside a calendar day cell.
 * On hover, a floating tooltip appears above it with full details.
 *
 * Props:
 *  - id        (string)  : event id — used as drag payload
 *  - title     (string)
 *  - startTime (string)
 *  - endTime   (string)
 *  - type      (string)  : "class" | "meeting" | "task" | "personal"
 *  - lecturer  (string)  : optional
 *  - location  (string)  : optional
 *  - draggable (boolean) : whether the pill is draggable
 *  - isUserTask (boolean): true for locally-created tasks (amber theme + edit/delete)
 *  - onEdit    (function): called when the edit button is clicked
 *  - onDelete  (function): called when the delete button is clicked
 */
export default function CalendarDayBlockEvent({
  id,
  title,
  startTime,
  endTime,
  type = "class",
  lecturer,
  location,
  draggable: isDraggable = false,
  isUserTask = false,
  onEdit,
  onDelete,
  tooltipPosition = "up",
}) {
  const hasTooltipDetails = lecturer || location || startTime;

  return (
    <div className="relative group">

      {/* ── Hover tooltip ──────────────────────────────────── */}
      {hasTooltipDetails && (
        <div
          className={[
            // Position: above or below the pill, centred on it
            tooltipPosition === "down"
              ? "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
              : "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
            // Sizing & appearance
            "w-52 bg-koru-inverse-surface rounded-koru-lg shadow-koru-md p-3",
            // Pointer events: don't interfere with mouse
            "pointer-events-none",
            // Fade + lift animation driven by group-hover
            "opacity-0 group-hover:opacity-100",
            tooltipPosition === "down"
              ? "-translate-y-1.5 group-hover:translate-y-0"
              : "translate-y-1.5 group-hover:translate-y-0",
            "transition-all duration-200 ease-out",
          ].join(" ")}
        >
          {/* ── Title row with icon ── */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-koru-md bg-koru-surface-container flex items-center justify-center shrink-0 text-koru-on-surface-variant">
              {ICONS_LG[type] ?? ICONS_LG.class}
            </div>
            <span className="font-medium text-koru-label text-koru-inverse-on-surface leading-snug">{title}</span>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-koru-inverse-on-surface/20 mb-2" />

          {/* ── Meta rows ── */}
          <div className="flex flex-col gap-1.5">
            {startTime && (
              <div className="flex items-center gap-1.5 text-koru-caption text-koru-inverse-on-surface">
                <span className="text-koru-inverse-on-surface shrink-0"><ClockIcon /></span>
                <span>
                  {startTime}
                  {endTime ? ` – ${endTime}` : ""}
                </span>
              </div>
            )}
            {lecturer && (
              <div className="flex items-center gap-1.5 text-koru-caption text-koru-inverse-on-surface">
                <span className="text-koru-inverse-on-surface shrink-0"><PersonIcon /></span>
                <span className="truncate">{lecturer}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-koru-caption text-koru-inverse-on-surface">
                <span className="shrink-0"><PinIcon /></span>
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* ── Caret (pointing down or up) ── */}
          <div className={[
            "absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-koru-inverse-surface rotate-45",
            tooltipPosition === "down" ? "-top-[5px]" : "-bottom-[5px]"
          ].join(" ")} />
        </div>
      )}

      {/* ── Event pill ─────────────────────────────────────── */}
      <div
        className={[
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-koru-caption font-medium transition-all duration-150 shadow-koru-xs hover:-translate-y-px hover:shadow-koru-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          isUserTask
            ? "bg-koru-accent-soft text-koru-accent-ink hover:bg-koru-accent-soft/70"
            : type === "scheduled"
            ? "bg-koru-success-soft text-koru-success hover:bg-koru-success-soft/70"
            : "bg-koru-surface-container-lowest text-koru-on-surface hover:bg-koru-primary-container",
          isDraggable ? "cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95" : "cursor-pointer",
        ].join(" ")}
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => {
          e.dataTransfer.setData("text/plain", id);
          e.dataTransfer.effectAllowed = "move";
        } : undefined}
      >
        {/* Type icon */}
        <span className={["shrink-0 mt-px", isUserTask ? "text-koru-accent-ink" : type === "scheduled" ? "text-koru-success" : "text-koru-primary"].join(" ")}>
          {ICONS[type] ?? ICONS.class}
        </span>

        {/* Title */}
        <span className="flex-1 truncate">{title}</span>

        {/* Right side: time for regular events; time + edit/delete for user tasks */}
        {isUserTask ? (
          <>
            {/* Time: hidden on hover */}
            {(startTime || endTime) && (
              <span className="group-hover:hidden shrink-0 text-koru-caption text-koru-accent-ink/70 text-right leading-tight whitespace-nowrap">
                {startTime && <span className="block">{startTime}</span>}
                {endTime && <span className="block">{endTime}</span>}
              </span>
            )}
            {/* Edit / Delete: visible on hover */}
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                title="Edit task"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                className="w-[18px] h-[18px] flex items-center justify-center rounded-koru-xs text-koru-accent-ink hover:bg-koru-accent-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                title="Delete task"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="w-[18px] h-[18px] flex items-center justify-center rounded-koru-xs text-koru-error hover:bg-koru-error-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </>
        ) : onDelete ? (
          <>
            {(startTime || endTime) && (
              <span className={`group-hover:hidden shrink-0 text-koru-caption text-right leading-tight whitespace-nowrap ${type === "scheduled" ? "text-koru-success" : "text-koru-on-surface-variant"}`}>
                {startTime && <span className="block">{startTime}</span>}
                {endTime && <span className="block">{endTime}</span>}
              </span>
            )}
            <button
              type="button"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="hidden group-hover:flex w-[18px] h-[18px] items-center justify-center rounded-koru-xs shrink-0 text-koru-error hover:bg-koru-error-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </>
        ) : (
          (startTime || endTime) && (
            <span className={`shrink-0 text-koru-caption text-right leading-tight whitespace-nowrap ${type === "scheduled" ? "text-koru-success" : "text-koru-on-surface-variant"}`}>
              {startTime && <span className="block">{startTime}</span>}
              {endTime && <span className="block">{endTime}</span>}
            </span>
          )
        )}
      </div>
    </div>
  );
}
