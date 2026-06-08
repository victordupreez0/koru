const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.title || data.message || "Something went wrong.");
  return data;
}

// GET /api/Enrollment/course/:courseId/count – active student count for a course
export async function getCourseStudentCount(courseId) {
  const res = await fetch(`${API_BASE}/Enrollment/course/${encodeURIComponent(courseId)}/count`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// GET /api/Enrollment/course/:courseId – all active enrollments with student info
export async function getCourseEnrollments(courseId) {
  const res = await fetch(`${API_BASE}/Enrollment/course/${encodeURIComponent(courseId)}`);
  return handleResponse(res);
}
