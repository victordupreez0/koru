import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TimelineNode from "./UI/timelineNode";
import TimelineEventExpanded from "./UI/timelineEventExpanded";
import TimelineEventCompressed from "./UI/timelineEventCompressed";
import AttendanceManageModal from "./AttendanceManageModal";
import CheckInModal from "./CheckInModal";

import { getAllEvents, getTeacherEvents } from "../services/eventService";
import { getStudentAssignments, getTeacherAssignments } from "../services/assignmentService";
import { getAvailableSessionsForStudent } from "../services/checkInService";
import { useAuth } from "../contexts/AuthContext";

function mapBackendEventToTimeline(evt) {
  // Normalise keys – backend may return PascalCase (model) or camelCase (anonymous projection)
  const startTime   = evt.startTime   ?? evt.StartTime;
  const endTime     = evt.endTime     ?? evt.EndTime;
  const courseId    = evt.courseId    ?? evt.CourseId;
  const title       = evt.title       ?? evt.Title       ?? "";
  const description = evt.description ?? evt.Description ?? "";
  const createdBy   = evt.createdBy   ?? evt.CreatedBy;

  const startDate = new Date(startTime);
  const endDate   = new Date(endTime);
  const durationMinutes = Math.round((endDate - startDate) / 60000);

  let subtitle = description;
  let location = "TBA";
  if (description.includes("|")) {
    const parts = description.split("|");
    subtitle = parts[0];
    location = parts[1] || "TBA";
  }

  return {
    id:         evt.id ?? evt.Id,
    courseId,
    title,
    subtitle,
    lecturer:   createdBy || "Unknown",
    duration:   `${durationMinutes}min`,
    location,
    startHour:  startDate.getHours(),
    startMin:   startDate.getMinutes(),
    endHour:    endDate.getHours(),
    endMin:     endDate.getMinutes(),
    isAssignment: false,
  };
}

function mapAssignmentToTimeline(assignment) {
  const due = new Date(assignment.dueDate);
  const courseCode = assignment.course?.subject?.code || assignment.course?.subject?.name || "Assignment";
  return {
    id:       `assign-${assignment.id}`,
    courseId: assignment.courseId,
    title:    assignment.title,
    subtitle: courseCode,
    lecturer: "Due",
    duration: "Due",
    location: "Online",
    startHour: due.getHours(),
    startMin:  due.getMinutes(),
    endHour:   due.getHours(),
    endMin:    due.getMinutes(),
    isAssignment: true,
  };
}

function fmt(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getNextEventIndex(evts, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < evts.length; i++) {
    if (evts[i].endHour * 60 + evts[i].endMin > nowMinutes) return i;
  }
  return -1;
}

function isPastEvent(evt, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return evt.endHour * 60 + evt.endMin <= nowMinutes;
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function inferSessionType(title = "") {
  if (/practical/i.test(title)) return "Practical";
  if (/tutorial/i.test(title)) return "Tutorial";
  return "Lecture";
}

export default function TodayTimeline() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [now, setNow]                     = useState(new Date());
  const [events, setEvents]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [availableSessions, setAvailable] = useState([]); // student: open check-in sessions
  const [manageModal, setManageModal]     = useState(null); // { courseId, sessionType, courseName }
  const [checkInModal, setCheckInModal]   = useState(null); // { courseName }

  // Fetch events & assignments
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [data, assignmentsData] = await Promise.all([
          isTeacher && user?.userId ? getTeacherEvents(user.userId) : getAllEvents(),
          isTeacher && user?.userId
            ? getTeacherAssignments(user.userId)
            : user?.userId
            ? getStudentAssignments(user.userId)
            : Promise.resolve([]),
        ]);

        const todayStr = new Date().toDateString();
        const todayEvents = data
          .filter(e => new Date(e.startTime).toDateString() === todayStr)
          .map(mapBackendEventToTimeline);
        const todayAssignments = assignmentsData
          .filter(a => new Date(a.dueDate).toDateString() === todayStr)
          .map(mapAssignmentToTimeline);

        const combined = [...todayEvents, ...todayAssignments].sort(
          (a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin)
        );
        if (mounted) setEvents(combined);
      } catch (err) {
        console.error("Failed to load timeline:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [user?.userId, user?.role]);

  // Student: poll for open check-in sessions every 5 s
  useEffect(() => {
    if (!user?.userId || isTeacher) return;
    const poll = () =>
      getAvailableSessionsForStudent(user.userId)
        .then(sessions => setAvailable(sessions ?? []))
        .catch(err => console.warn("Check-in poll failed:", err));
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [user?.userId, isTeacher]);

  // Clock tick every 30 s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nextIdx = getNextEventIndex(events, now);

  return (
    <div className="w-full h-full flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl p-4 drop-shadow-xl">
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="text-2xl font-['Gabarito']">Today</h2>
      </div>
      <p className="text-sm text-gray-400 mb-5 font-medium">{formatDate(now)}</p>
      <div className="h-5" />

      <div className="relative flex-1 overflow-y-auto scrollbar-black pr-1 flex flex-col">
        {loading ? (
          <div className="text-gray-500 text-center py-10 font-medium">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-10 font-medium">No events scheduled for today.</div>
        ) : (
          events.map((evt, idx) => {
            const isNext  = idx === nextIdx;
            const isPast  = isPastEvent(evt, now);
            const timeRange = evt.isAssignment
              ? `Due at ${fmt(evt.endHour, evt.endMin)}`
              : `${fmt(evt.startHour, evt.startMin)} – ${fmt(evt.endHour, evt.endMin)}`;

            // Teacher: show Manage Attendance on non-past class events
            const showManage = isTeacher && !evt.isAssignment && !isPast && !!evt.courseId;

            // Student: show Check In when a session is open for this course
            const openSession = !isTeacher && !evt.isAssignment && !isPast
              ? availableSessions.find(s => s.courseId === evt.courseId)
              : null;

            const manageProps = showManage
              ? { onManageAttendance: () => setManageModal({ courseId: evt.courseId, sessionType: inferSessionType(evt.title), courseName: evt.title }) }
              : {};

            const checkInProps = openSession
              ? { onCheckIn: () => setCheckInModal({ courseName: evt.title }) }
              : {};

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
                    {...manageProps}
                    {...checkInProps}
                  />
                ) : (
                  <TimelineEventCompressed
                    title={evt.title}
                    lecturer={evt.lecturer}
                    duration={evt.duration}
                    location={evt.location}
                    timeRange={timeRange}
                    isPast={isPast}
                    {...manageProps}
                    {...checkInProps}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {manageModal && (
          <AttendanceManageModal
            key="manage"
            courseId={manageModal.courseId}
            teacherId={user.userId}
            sessionType={manageModal.sessionType}
            courseName={manageModal.courseName}
            onClose={() => setManageModal(null)}
          />
        )}
        {checkInModal && (
          <CheckInModal
            key="checkin"
            courseName={checkInModal.courseName}
            onClose={() => setCheckInModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
