// Admin calendar – currently mirrors the student calendar exactly.
// Kept as a separate file so teacher-specific features (e.g. scheduling,
// class management) can be layered on later without touching the student view.
import StudentCalendar from "./studentCalendar";

export default function AdminCalendar() {
  return <StudentCalendar />;
}