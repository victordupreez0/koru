import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TimelineNode from "./UI/timelineNode";
import TimelineEventExpanded from "./UI/timelineEventExpanded";
import TimelineEventCompressed from "./UI/timelineEventCompressed";

// ──────────────────────────────────────────────
// Events data – easy to swap with backend later
// Each event needs: id, title, subtitle, lecturer,
// duration (string), location, startHour, startMin,
// endHour, endMin
// ──────────────────────────────────────────────
const events = [
  {
    id: 1,
    title: "DV300 – Theory",
    subtitle: "Project Proposal Pitch",
    lecturer: "Tsungai Katsuro",
    duration: "60min",
    location: "Online",
    startHour: 0,
    startMin: 0,
    endHour: 0,
    endMin: 0,
  },
  {
    id: 2,
    title: "Contact Session",
    subtitle: "",
    lecturer: "Laudette Sass",
    duration: "15min",
    location: "Online",
    startHour: 12,
    startMin: 30,
    endHour: 12,
    endMin: 45,
  },
  {
    id: 3,
    title: "ID300 – Practical",
    subtitle: "Wireframe Review",
    lecturer: "Mike Ross",
    duration: "90min",
    location: "Room 208",
    startHour: 14,
    startMin: 0,
    endHour: 15,
    endMin: 30,
  },
  {
    id: 4,
    title: "UX300 – Workshop",
    subtitle: "Usability Testing",
    lecturer: "Anna Pretorius",
    duration: "45min",
    location: "Online",
    startHour: 16,
    startMin: 0,
    endHour: 16,
    endMin: 45,
  },
];

// Helper: format hours & minutes into "HH:MM"
function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper: get the index of the next upcoming event
function getNextEventIndex(evts, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < evts.length; i++) {
    const endMinutes = evts[i].endHour * 60 + evts[i].endMin;
    if (nowMinutes < endMinutes) return i;
  }
  // All events are in the past → nothing to expand
  return -1;
}

// Helper: event has fully ended
function isPastEvent(evt, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return evt.endHour * 60 + evt.endMin <= nowMinutes;
}

// Helper: format today's date like "Mar 3"
function formatDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TodayTimeline() {
  const [now, setNow] = useState(new Date());

  // Re‑sync every 30 s so the "next" event updates automatically
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nextIdx = getNextEventIndex(events, now);

  return (
    <div className="w-full h-full flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl p-4 drop-shadow-xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="text-2xl font-['Gabarito']">Today</h2>
      </div>
      <p className="text-sm text-gray-400 mb-5 font-medium">{formatDate(now)}</p>
      {/* Spacer between header and footer */}
      <div className="h-5" />

      {/* ── Scrollable timeline with fade overlays ── */}
      <div className="relative flex-1 overflow-y-auto scrollbar-black pr-1 flex flex-col">
        {events.map((evt, idx) => {
          const isNext = idx === nextIdx;
          const isPast = isPastEvent(evt, now);
          const timeRange = `${fmt(evt.startHour, evt.startMin)} – ${fmt(evt.endHour, evt.endMin)}`;

          return (
            <div key={evt.id} className="flex items-stretch gap-4">
              {/* Vertical timeline track */}
              <TimelineNode
                isActive={isNext}
                isPast={isPast}
                isFirst={idx === 0}
                isLast={idx === events.length - 1}
              />

              {/* Event card */}
              {isNext ? (
                <TimelineEventExpanded
                  title={evt.title}
                  subtitle={evt.subtitle}
                  lecturer={evt.lecturer}
                  duration={evt.duration}
                  location={evt.location}
                  timeRange={timeRange}
                  isPast={isPast}
                />
              ) : (
                <TimelineEventCompressed
                  title={evt.title}
                  lecturer={evt.lecturer}
                  duration={evt.duration}
                  location={evt.location}
                  timeRange={timeRange}
                  isPast={isPast}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
