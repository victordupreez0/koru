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
