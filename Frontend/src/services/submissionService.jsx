const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// GET /api/Submission – fetch all submissions, then filter client-side by student + assignment
// Note: Backend does not yet expose a filtered endpoint, so we filter in memory
export async function getSubmissionForAssignment(studentId, assignmentId) {
  const res = await fetch(`${API_BASE}/Submission`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const all = await handleResponse(res);
  return all.find(
    (s) => s.studentId === studentId && s.assignmentId === assignmentId
  ) || null;
}

// POST /api/Submission – submit work for an assignment
export async function createSubmission({ assignmentId, studentId, fileUrl, status = "Submitted" }) {
  const res = await fetch(`${API_BASE}/Submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignmentId, studentId, fileUrl, status }),
  });
  return handleResponse(res);
}

// PUT /api/Submission/{id} – resubmit / update an existing submission
export async function updateSubmission(id, { fileUrl, status }) {
  const res = await fetch(`${API_BASE}/Submission/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl, status }),
  });
  if (!res.ok) throw new Error("Failed to update submission.");
}
