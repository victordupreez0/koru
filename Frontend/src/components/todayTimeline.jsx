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
    isAssignment: false,
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
    startHour: due.getHours(),
    startMin: due.getMinutes(),
    endHour: due.getHours(),
    endMin: due.getMinutes(),
    isAssignment: true,
  };
}

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
    async function fetchData() {
      try {
        setLoading(true);
        const [data, assignmentsData] = await Promise.all([
          getAllEvents(),
          user?.userId ? getStudentAssignments(user.userId) : Promise.resolve([]),
        ]);

        const todayStr = new Date().toDateString();

        const todayEvents = data
          .filter((e) => new Date(e.startTime).toDateString() === todayStr)
          .map(mapBackendEventToTimeline);

        const todayAssignments = assignmentsData
          .filter((a) => new Date(a.dueDate).toDateString() === todayStr)
          .map(mapAssignmentToTimeline);

        const combined = [...todayEvents, ...todayAssignments].sort(
          (a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin)
        );

        if (mounted) setEvents(combined);
      } catch (err) {
        console.error("Failed bringing in today's timeline events:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

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
      <div className="h-5" />

      {/* ── Scrollable timeline ── */}
      <div className="relative flex-1 overflow-y-auto scrollbar-black pr-1 flex flex-col">
        {loading ? (
          <div className="text-gray-500 text-center py-10 font-medium">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-10 font-medium">No events scheduled for today.</div>
        ) : (
          events.map((evt, idx) => {
            const isNext = idx === nextIdx;
            const isPast = isPastEvent(evt, now);
            const timeRange = evt.isAssignment
              ? `Due at ${fmt(evt.endHour, evt.endMin)}`
              : `${fmt(evt.startHour, evt.startMin)} – ${fmt(evt.endHour, evt.endMin)}`;

            return (
              <div key={evt.id} className="flex items-stretch gap-4">
                <TimelineNode
                  isActive={isNext}
                  isPast={isPast}
                  isFirst={idx === 0}
                  isLast={idx === events.length - 1}
                />

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
          })
        )}
      </div>
    </div>
  );
}
