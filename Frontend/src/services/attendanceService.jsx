const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// POST /api/Attendance/session – Create an attendance session
export async function createAttendanceSession(sessionData) {
  const res = await fetch(`${API_BASE}/Attendance/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData)
  });
  return handleResponse(res);
}

// GET /api/Attendance/session/{sessionId} – Get session details and student statuses
export async function getSessionDetails(sessionId) {
  const res = await fetch(`${API_BASE}/Attendance/session/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// POST /api/Attendance/submit – Submit a list of student records
export async function submitAttendance(records) {
  const res = await fetch(`${API_BASE}/Attendance/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records)
  });
  return handleResponse(res);
}

// GET /api/Attendance/stats/course/{courseId} – Get course cohort attendance rates
export async function getCourseStats(courseId) {
  const res = await fetch(`${API_BASE}/Attendance/stats/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/Attendance/stats/student/{studentId} – Get student overall and course attendance rates
export async function getStudentStats(studentId) {
  const res = await fetch(`${API_BASE}/Attendance/stats/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/Attendance/sessions/cohort/{cohortId} – Get all sessions recorded for a cohort
export async function getCohortSessions(cohortId) {
  const res = await fetch(`${API_BASE}/Attendance/sessions/cohort/${encodeURIComponent(cohortId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}
