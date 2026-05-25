const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export async function getStudentGrades(studentId) {
  const res = await fetch(`${API_BASE}/Grade/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function getCourseGrades(courseId) {
  const res = await fetch(`${API_BASE}/Grade/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function getAssignmentGrades(assignmentId) {
  const res = await fetch(`${API_BASE}/Grade/assignment/${encodeURIComponent(assignmentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function createGrade({ submissionId, pointsEarned, gradedBy }) {
  const res = await fetch(`${API_BASE}/Grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, pointsEarned, gradedBy }),
  });
  return handleResponse(res);
}

export async function updateGrade(gradeId, { submissionId, pointsEarned, gradedBy }) {
  const res = await fetch(`${API_BASE}/Grade/${encodeURIComponent(gradeId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, pointsEarned, gradedBy }),
  });
  if (!res.ok) throw new Error("Failed to update grade.");
}
