const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.title || `Request failed (${res.status})`);
    return data;
}

export async function openSession(courseId, teacherId, sessionType = "Lecture", lateAfterMinutes = null, autoCloseMinutes = null) {
    return handle(await fetch(`${API_BASE}/CheckIn/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, teacherId, sessionType, lateAfterMinutes, autoCloseMinutes }),
    }));
}

export async function closeSession(sessionId) {
    const res = await fetch(`${API_BASE}/CheckIn/sessions/${encodeURIComponent(sessionId)}/close`, {
        method: "PUT",
    });
    if (!res.ok) throw new Error("Failed to close session.");
}

export async function getSessionStatus(sessionId) {
    return handle(await fetch(`${API_BASE}/CheckIn/sessions/${encodeURIComponent(sessionId)}/status`));
}

// Returns the active session for a course, or null if none
export async function getActiveSession(courseId) {
    const res = await fetch(`${API_BASE}/CheckIn/sessions/active/${encodeURIComponent(courseId)}`);
    if (res.status === 404) return null;
    return handle(res);
}

export async function getAvailableSessionsForStudent(studentId) {
    return handle(await fetch(`${API_BASE}/CheckIn/sessions/available/${encodeURIComponent(studentId)}`));
}

export async function markStudentPresent(sessionId, studentId) {
    return handle(await fetch(
        `${API_BASE}/CheckIn/sessions/${encodeURIComponent(sessionId)}/mark/${encodeURIComponent(studentId)}`,
        { method: "POST" }
    ));
}

export async function checkIn(code, studentId) {
    return handle(await fetch(`${API_BASE}/CheckIn/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, studentId }),
    }));
}
