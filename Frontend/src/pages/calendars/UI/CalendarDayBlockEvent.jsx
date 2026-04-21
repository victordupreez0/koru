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
 *  - title     (string)
 *  - startTime (string)
 *  - endTime   (string)
 *  - type      (string) : "class" | "meeting" | "task" | "personal"
 *  - lecturer  (string) : optional
 *  - location  (string) : optional
 */
export default function CalendarDayBlockEvent({
  title,
  startTime,
  endTime,
  type = "class",
  lecturer,
  location,
}) {
  const hasTooltipDetails = lecturer || location || startTime;

  return (
    <div className="relative group">

      {/* ── Hover tooltip ──────────────────────────────────── */}
      {hasTooltipDetails && (
        <div
          className={[
            // Position: above the pill, centred on it
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
            // Sizing & appearance
            "w-52 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-3",
            // Pointer events: don't interfere with mouse
            "pointer-events-none",
            // Fade + lift animation driven by group-hover
            "opacity-0 group-hover:opacity-100",
            "translate-y-1.5 group-hover:translate-y-0",
            "transition-all duration-200 ease-out",
          ].join(" ")}
        >
          {/* ── Title row with icon ── */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-500">
              {ICONS_LG[type] ?? ICONS_LG.class}
            </div>
            <span className="font-semibold text-[13px] text-gray-900 leading-snug">{title}</span>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gray-100 mb-2" />

          {/* ── Meta rows ── */}
          <div className="flex flex-col gap-1.5">
            {startTime && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="text-gray-400 shrink-0"><ClockIcon /></span>
                <span>
                  {startTime}
                  {endTime ? ` – ${endTime}` : ""}
                </span>
              </div>
            )}
            {lecturer && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="text-gray-400 shrink-0"><PersonIcon /></span>
                <span className="truncate">{lecturer}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="shrink-0"><PinIcon /></span>
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* ── Caret (pointing down) ── */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 bg-white rotate-45 shadow-[1px_1px_0px_rgba(0,0,0,0.04)]" />
        </div>
      )}

      {/* ── Event pill ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 text-[11px] font-medium text-black cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-sm">
        {/* Type icon */}
        <span className="shrink-0 text-gray-400 mt-px">
          {ICONS[type] ?? ICONS.class}
        </span>

        {/* Title */}
        <span className="flex-1 truncate">{title}</span>

        {/* Stacked time */}
        {(startTime || endTime) && (
          <span className="shrink-0 text-[10px] text-gray-400 text-right leading-tight whitespace-nowrap">
            {startTime && <span className="block">{startTime}</span>}
            {endTime   && <span className="block">{endTime}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
