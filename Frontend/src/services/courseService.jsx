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

// GET /api/Course/teacher/:teacherId – fetch all courses assigned to a teacher
export async function getTeacherCourses(teacherId) {
  const res = await fetch(`${API_BASE}/Course/teacher/${encodeURIComponent(teacherId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  return handleResponse(res);
}

// GET /api/Course/{id} – fetch a course detail (includes subject and teacher)
export async function getCourseById(courseId) {
  const res = await fetch(`${API_BASE}/Course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// GET /api/Course/{id}/lecturers – fetch all lecturers for a course
export async function getCourseLecturers(courseId) {
  const res = await fetch(`${API_BASE}/Course/${encodeURIComponent(courseId)}/lecturers`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

// PUT /api/Course/{id}/content – update the homepage content for a course
export async function updateCourseContent(courseId, content) {
  const res = await fetch(`${API_BASE}/Course/${encodeURIComponent(courseId)}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  return handleResponse(res);
}
