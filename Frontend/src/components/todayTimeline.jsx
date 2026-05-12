import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TimelineNode from "./UI/timelineNode";
import TimelineEventExpanded from "./UI/timelineEventExpanded";
import TimelineEventCompressed from "./UI/timelineEventCompressed";

import { getAllEvents } from "../services/eventService";
import { getStudentAssignments } from "../services/assignmentService";
import { useAuth } from "../contexts/AuthContext";

// Helper: map backend event to timeline format
function mapBackendEventToTimeline(evt) {
  const startDate = new Date(evt.startTime);
  const endDate = new Date(evt.endTime);
  const durationMinutes = Math.round((endDate - startDate) / 60000);
  
  let subtitle = evt.description || "";
  let location = "TBA";
  
  if (evt.description && evt.description.includes("|")) {
      const parts = evt.description.split("|");
      subtitle = parts[0];
      location = parts[1] || "TBA";
  }

  return {
    id: evt.id,
    title: evt.title,
    subtitle: subtitle,
    lecturer: evt.createdBy || "Unknown",
    duration: `${durationMinutes}min`,
    location: location,
    startHour: startDate.getHours(),
    startMin: startDate.getMinutes(),
    endHour: endDate.getHours(),
    endMin: endDate.getMinutes(),
    isAssignment: false
  };
}

function mapAssignmentToTimeline(assignment) {
  const due = new Date(assignment.dueDate);
  return {
    id: `assign-${assignment.id}`,
    title: assignment.title,
    subtitle: assignment.course?.subject?.code || "Assignment",
    lecturer: "Submission",
    duration: "Due",
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
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events & assignments
  useEffect(() => {
    let mounted = true;
    async function fetch() {
      try {
        setLoading(true);
        const [data, assignmentsData] = await Promise.all([
          getAllEvents(),
          user?.userId ? getStudentAssignments(user.userId) : Promise.resolve([])
        ]);
        
        // Filter for events and assignments that happen today
        const todayStr = new Date().toDateString();
        
        const todayEvents = data
            .filter(e => new Date(e.startTime).toDateString() === todayStr)
            .map(mapBackendEventToTimeline);
            
        const todayAssignments = assignmentsData
            .filter(a => new Date(a.dueDate).toDateString() === todayStr)
            .map(mapAssignmentToTimeline);

        const combined = [...todayEvents, ...todayAssignments]
            .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin));

        if (mounted) setEvents(combined);
      } catch (err) {
        console.error("Failed bringing in today's timeline events:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetch();
    return () => { mounted = false; };
  }, []);

  // Re‑sync every 30 s so the "next" event updates automatically
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nextIdx = getNextEventIndex(events, now);

  return (
    <div className="w-full h-full flex flex-col bg-white border-1 border-gray-200 rounded-3xl p-4 drop-shadow-xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="text-2xl font-['Gabarito'] dark:text-slate-100">Today</h2>
      </div>
      <p className="text-sm text-gray-400 mb-5 font-medium">{formatDate(now)}</p>

      {/* ── Scrollable timeline with fade overlays ── */}
      <div className="relative">


        {/* Scrollable list */}
        <div className="max-h-[520px] overflow-y-auto scrollbar-black pr-1 flex flex-col">
          {events.map((evt, idx) => {
            const isNext = idx === nextIdx;
            const isPast = isPastEvent(evt, now);
            const timeRange = evt.isAssignment 
                ? `Due at ${fmt(evt.endHour, evt.endMin)}`
                : `${fmt(evt.startHour, evt.startMin)} – ${fmt(evt.endHour, evt.endMin)}`;

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
    </div>
  );
}
