const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// GET /api/Todo/teacher/{teacherId}
export async function getTeacherTodos(teacherId) {
  const res = await fetch(`${API_BASE}/Todo/teacher/${encodeURIComponent(teacherId)}`);
  return handleResponse(res);
}

// POST /api/Todo
export async function createTodo({ title, dueDate, courseCode, teacherId, createdByAdminId = null }) {
  const res = await fetch(`${API_BASE}/Todo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, dueDate, courseCode, teacherId, createdByAdminId }),
  });
  return handleResponse(res);
}

// PATCH /api/Todo/{id}/toggle
export async function toggleTodo(id) {
  const res = await fetch(`${API_BASE}/Todo/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// DELETE /api/Todo/{id}
export async function deleteTodo(id) {
  const res = await fetch(`${API_BASE}/Todo/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong.");
  }
}
