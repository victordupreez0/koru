const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

export const classService = {
  // GET /api/Class – all class slots with teacher/course info (for admin calendar)
  async getAll() {
    const res = await fetch(`${API_BASE}/Class`);
    return handleResponse(res);
  },

  // GET /api/Class/course/{courseId}/unassigned – slots not yet assigned to any group
  async getUnassignedByCourse(courseId) {
    const res = await fetch(`${API_BASE}/Class/course/${encodeURIComponent(courseId)}/unassigned`);
    return handleResponse(res);
  },

  // GET /api/Class/group/{groupId} – slots for a specific group
  async getByGroup(groupId) {
    const res = await fetch(`${API_BASE}/Class/group/${encodeURIComponent(groupId)}`);
    return handleResponse(res);
  },

  // POST /api/Class – create a class slot
  async create(data) {
    const res = await fetch(`${API_BASE}/Class`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // PUT /api/Class/{id} – update a class slot
  async update(id, data) {
    const res = await fetch(`${API_BASE}/Class/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 204) return { success: true };
    return handleResponse(res);
  },

  // DELETE /api/Class/{id}
  async delete(id) {
    const res = await fetch(`${API_BASE}/Class/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.status === 204) return { success: true };
    return handleResponse(res);
  },
};
