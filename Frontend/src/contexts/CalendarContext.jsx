import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

import { getAllEvents } from "../services/eventService";
import { getStudentAssignments, getCourseAssignments } from "../services/assignmentService";
import { getStudentSubmissions } from "../services/submissionService";
import { getTeacherCourses } from "../services/courseService";

// ── Shared mapper helpers ──────────────────────────────────────
// Exported so teacher calendar can re-use them when persisting new events.
function pad2(n) { return String(n).padStart(2, "0"); }

function localDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function mapBackendEventToCalendar(evt) {
  const startDate = new Date(evt.startTime);
  const endDate   = new Date(evt.endTime);
  let location = "TBA";
  if (evt.description && evt.description.includes("|")) {
    location = evt.description.split("|")[1] || "TBA";
  }
  return {
    id:        `evt-${evt.id}`,
    date:      localDateKey(startDate),
    title:     evt.title,
    startTime: `${pad2(startDate.getHours())}:${pad2(startDate.getMinutes())}`,
    endTime:   `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`,
    type:      evt.eventType?.toLowerCase() === "meeting" ? "meeting" : "class",
    lecturer:  evt.createdBy || "",
    location,
    courseId:    evt.courseId,
    description: evt.description || "",
  };
}

export function mapAssignmentToCalendarEvent(assignment) {
  const due = new Date(assignment.dueDate);
  return {
    id:        `assign-${assignment.id}`,
    date:      localDateKey(due),
    title:     assignment.title,
    startTime: `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    endTime:   `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    type:      "task",
    lecturer:  "Assignment Due",
    location:  assignment.course?.subject?.code || "",
  };
}

export function mapAssignmentToTask(assignment, submission) {
  const due = new Date(assignment.dueDate);
  return {
    id:          assignment.id,
    title:       assignment.title,
    due:         due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    dueTime:     `${pad2(due.getHours())}:${pad2(due.getMinutes())}`,
    course:      assignment.course?.subject?.code || "",
    isSubmitted: !!submission,
    isGraded:    submission?.status === "Graded",
  };
}

// ── Context ────────────────────────────────────────────────────
const CalendarContext = createContext(null);

export function useCalendar() {
  return useContext(CalendarContext);
}

/**
 * CalendarProvider
 *
 * Starts fetching calendar data as soon as the user is authenticated —
 * before they even open the calendar page — so the view can render
 * instantly (or with a very short skeleton flash) on first visit.
 *
 * The raw setEvents / setTasks setters are exposed so the calendar pages
 * can continue to handle local mutations (add, edit, delete, drag-drop)
 * exactly as before; they just no longer own the initial fetch.
 */
export function CalendarProvider({ children }) {
  const { user } = useAuth();

  const [events,  setEvents]  = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [courses, setCourses] = useState([]); // populated for teacher role
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function prefetch() {
      setLoading(true);
      try {
        // ── Student ──────────────────────────────────────────────
        if (user.role === "student") {
          const [backendEvents, assignmentsData, submissionsData] = await Promise.all([
            getAllEvents().catch(() => []),
            getStudentAssignments(user.userId).catch(() => []),
            getStudentSubmissions(user.userId).catch(() => []),
          ]);

          const classEvents      = (Array.isArray(backendEvents) ? backendEvents : [])
            .filter(evt => evt.eventType?.toLowerCase() !== "task")
            .map(mapBackendEventToCalendar);
          const assignmentEvents = (Array.isArray(assignmentsData)   ? assignmentsData   : []).map(mapAssignmentToCalendarEvent);

          if (mounted) setEvents([...classEvents, ...assignmentEvents]);

          const taskRows = (Array.isArray(assignmentsData) ? assignmentsData : []).map(a => {
            const sub = (Array.isArray(submissionsData) ? submissionsData : []).find(s => s.assignmentId === a.id);
            return mapAssignmentToTask(a, sub);
          });
          if (mounted) setTasks(taskRows);

        // ── Teacher ──────────────────────────────────────────────
        } else if (user.role === "teacher") {
          const [backendEvents, teacherCourses] = await Promise.all([
            getAllEvents().catch(() => []),
            getTeacherCourses(user.userId).catch(() => []),
          ]);

          const teacherCourseIds = new Set(
            (Array.isArray(teacherCourses) ? teacherCourses : []).map(c => c.id)
          );
          const ownEvents = (Array.isArray(backendEvents) ? backendEvents : [])
            .filter(evt => !evt.courseId || teacherCourseIds.has(evt.courseId));

          const classEvents = ownEvents.map(mapBackendEventToCalendar);

          const assignmentsByCourse = await Promise.all(
            Array.from(teacherCourseIds).map(cid => getCourseAssignments(cid).catch(() => []))
          );
          const allAssignments = assignmentsByCourse.flat();
          const assignmentEvents = allAssignments.map(mapAssignmentToCalendarEvent);

          if (mounted) {
            setEvents([...classEvents, ...assignmentEvents]);
            setCourses(Array.isArray(teacherCourses) ? teacherCourses : []);
          }

          const taskRows = allAssignments.map(a => mapAssignmentToTask(a));
          if (mounted) setTasks(taskRows);

        // ── Admin (mirrors student — read-only event view) ───────
        } else {
          const backendEvents = await getAllEvents().catch(() => []);
          const classEvents = (Array.isArray(backendEvents) ? backendEvents : [])
            .filter(evt => evt.eventType?.toLowerCase() !== "task")
            .map(mapBackendEventToCalendar);
          if (mounted) setEvents(classEvents);
        }
      } catch (err) {
        console.error("Calendar pre-load failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prefetch();
    return () => { mounted = false; };
  }, [user?.userId, user?.role]);

  return (
    <CalendarContext.Provider value={{ events, setEvents, tasks, setTasks, courses, setCourses, loading }}>
      {children}
    </CalendarContext.Provider>
  );
}
