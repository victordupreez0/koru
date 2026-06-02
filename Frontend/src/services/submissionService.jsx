const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// GET /api/Submission/student/:studentId – fetch all submissions for a student
export async function getStudentSubmissions(studentId) {
  const res = await fetch(`${API_BASE}/Submission/student/${encodeURIComponent(studentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// GET /api/Submission/assignment/:assignmentId – fetch all submissions for an assignment
export async function getAssignmentSubmissions(assignmentId) {
  const res = await fetch(`${API_BASE}/Submission/assignment/${encodeURIComponent(assignmentId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// GET /api/Submission/course/:courseId – fetch all submissions for a course
export async function getCourseSubmissions(courseId) {
  const res = await fetch(`${API_BASE}/Submission/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// Convenience: find the current student's submission for a given assignment via the filtered endpoint
export async function getSubmissionForAssignment(studentId, assignmentId) {
  const submissions = await getStudentSubmissions(studentId);
  return submissions.find((s) => s.assignmentId === assignmentId) || null;
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

// POST /api/Submission/upload – upload a file and get back its server URL
export async function uploadSubmissionFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/Submission/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

// PUT /api/Submission/{id} – resubmit / update an existing submission
export async function updateSubmission(id, { fileUrl, status, assignmentId, studentId }) {
  const res = await fetch(`${API_BASE}/Submission/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl, status, assignmentId, studentId }),
  });
  if (!res.ok) throw new Error("Failed to update submission.");
}
