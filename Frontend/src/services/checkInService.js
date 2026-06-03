const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handle(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Something went wrong.");
    return data;
}

export async function openSession(courseId, teacherId, sessionType = "Lecture") {
    return handle(await fetch(`${API_BASE}/CheckIn/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, teacherId, sessionType }),
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

export async function getAvailableSessionsForStudent(studentId) {
    return handle(await fetch(`${API_BASE}/CheckIn/sessions/available/${encodeURIComponent(studentId)}`));
}

export async function checkIn(code, studentId) {
    return handle(await fetch(`${API_BASE}/CheckIn/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, studentId }),
    }));
}
