const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// GET /api/Assignment/student/:studentId – fetch global assignments across all enrolled active courses
export async function getStudentAssignments(studentId) {
  const res = await fetch(`${API_BASE}/Assignment/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/Assignment/course/:courseId – fetch assignments strictly for a single course
export async function getCourseAssignments(courseId) {
  const res = await fetch(`${API_BASE}/Assignment/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}
