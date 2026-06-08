const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// GET /api/ClassGroup – Fetch all cohorts
export async function getClassGroups() {
  const res = await fetch(`${API_BASE}/ClassGroup`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/ClassGroup/{id} – Fetch a single cohort's student roster and schedule
export async function getCohortDetails(cohortId) {
  const res = await fetch(`${API_BASE}/ClassGroup/${encodeURIComponent(cohortId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// POST /api/ClassGroup – Create a new cohort
export async function createClassGroup(groupData) {
  const res = await fetch(`${API_BASE}/ClassGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(groupData)
  });
  return handleResponse(res);
}

// PUT /api/ClassGroup/{id}/assign-students – Save cohort student assignments
export async function assignStudents(cohortId, studentIds) {
  const res = await fetch(`${API_BASE}/ClassGroup/${encodeURIComponent(cohortId)}/assign-students`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentIds)
  });
  return handleResponse(res);
}

// DELETE /api/ClassGroup/{id} – Delete a cohort
export async function deleteClassGroup(cohortId) {
  const res = await fetch(`${API_BASE}/ClassGroup/${encodeURIComponent(cohortId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  if (res.status === 204) return { success: true };
  return handleResponse(res);
}

// GET /api/ClassGroup/course/{courseId} – Get cohorts for a specific course
export async function getCourseCohorts(courseId) {
  const res = await fetch(`${API_BASE}/ClassGroup/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/ClassGroup/course/{courseId}/students – Get all students in a course with cohort assignments
export async function getCourseStudents(courseId) {
  const res = await fetch(`${API_BASE}/ClassGroup/course/${encodeURIComponent(courseId)}/students`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}
