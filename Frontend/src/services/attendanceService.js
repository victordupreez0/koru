const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.title || data.message || "Something went wrong.");
    return data;
}

// GET /api/Attendance/course/{courseId}
export async function getCourseAttendance(courseId) {
    const res = await fetch(`${API_BASE}/Attendance/course/${encodeURIComponent(courseId)}`);
    return handleResponse(res);
}

// POST /api/Attendance/bulk – record a full session at once
export async function bulkCreateAttendance(records) {
    const res = await fetch(`${API_BASE}/Attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
    });
    return handleResponse(res);
}

// PUT /api/Attendance/{id} – change a single student's status for a session
export async function updateAttendanceRecord(id, status) {
    const res = await fetch(`${API_BASE}/Attendance/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update attendance record.");
}

// DELETE /api/Attendance/{id}
export async function deleteAttendanceRecord(id) {
    const res = await fetch(`${API_BASE}/Attendance/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete attendance record.");
}

// POST /api/Attendance/session – Create an attendance session
export async function createAttendanceSession(sessionData) {
    const res = await fetch(`${API_BASE}/Attendance/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
    });
    return handleResponse(res);
}

// GET /api/Attendance/session/{sessionId} – Get session details and student statuses
export async function getSessionDetails(sessionId) {
    const res = await fetch(`${API_BASE}/Attendance/session/${encodeURIComponent(sessionId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
}

// POST /api/Attendance/submit – Submit a list of student records
export async function submitAttendance(records) {
    const res = await fetch(`${API_BASE}/Attendance/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
    });
    return handleResponse(res);
}

// GET /api/Attendance/stats/course/{courseId} – Get course cohort attendance rates
export async function getCourseStats(courseId) {
    const res = await fetch(`${API_BASE}/Attendance/stats/course/${encodeURIComponent(courseId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
}

// GET /api/Attendance/stats/student/{studentId} – Get student overall and course attendance rates
export async function getStudentStats(studentId) {
    const res = await fetch(`${API_BASE}/Attendance/stats/student/${encodeURIComponent(studentId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
}

// GET /api/Attendance/sessions/cohort/{cohortId} – Get all sessions recorded for a cohort
export async function getCohortSessions(cohortId) {
    const res = await fetch(`${API_BASE}/Attendance/sessions/cohort/${encodeURIComponent(cohortId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
}
