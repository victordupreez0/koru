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

// GET /api/Assignment/{id} – fetch a single assignment by ID
export async function getAssignmentById(assignmentId) {
  const res = await fetch(`${API_BASE}/Assignment/${encodeURIComponent(assignmentId)}`, {
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

// POST /api/Assignment – create a new assignment
export async function createAssignment(assignment) {
  const res = await fetch(`${API_BASE}/Assignment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  return handleResponse(res);
}

// PUT /api/Assignment/:id – update an existing assignment
export async function updateAssignment(id, assignment) {
  const res = await fetch(`${API_BASE}/Assignment/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  if (!res.ok) throw new Error("Failed to update assignment.");
}

// DELETE /api/Assignment/:id – delete an assignment
export async function deleteAssignment(id) {
  const res = await fetch(`${API_BASE}/Assignment/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to delete assignment.");
}

// PATCH /api/Assignment/:id/close – toggle closed state
export async function closeAssignment(id) {
  const res = await fetch(`${API_BASE}/Assignment/${encodeURIComponent(id)}/close`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

