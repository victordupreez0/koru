const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export async function getStudentSubmissions(studentId) {
  const res = await fetch(`${API_BASE}/Submission/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function getAssignmentSubmissions(assignmentId) {
  const res = await fetch(`${API_BASE}/Submission/assignment/${encodeURIComponent(assignmentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function getCourseSubmissions(courseId) {
  const res = await fetch(`${API_BASE}/Submission/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function submitAssignment(assignmentId, studentId, fileUrl) {
  const res = await fetch(`${API_BASE}/Submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignmentId, studentId, fileUrl, status: "Submitted" })
  });
  return handleResponse(res);
}
