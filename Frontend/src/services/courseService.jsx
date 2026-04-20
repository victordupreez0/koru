// Base URL for the authentication endpoints exposed by the ASP.NET backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// GET /api/Enrollment/student/:studentId – fetch all courses the student is currently enrolled in
export async function getStudentCourses(studentId) {
  const res = await fetch(`${API_BASE}/Enrollment/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  return handleResponse(res);
}
