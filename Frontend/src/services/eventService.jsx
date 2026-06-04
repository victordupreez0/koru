const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

// GET /api/Event – fetch all events
export async function getAllEvents() {
  const res = await fetch(`${API_BASE}/Event`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// GET /api/Event/teacher/:teacherId – fetch all events for courses taught by this teacher
export async function getTeacherEvents(teacherId) {
  const res = await fetch(`${API_BASE}/Event/teacher/${encodeURIComponent(teacherId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// Alias kept for any callers that imported the older name
export const getEvents = getAllEvents;

// GET /api/Event/:id – fetch a single event by its ID
export async function getEventById(id) {
  const res = await fetch(`${API_BASE}/Event/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

// POST /api/Event – create a new event
export async function createEvent(event) {
  const res = await fetch(`${API_BASE}/Event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  return handleResponse(res);
}

// PUT /api/Event/:id – update an existing event
export async function updateEvent(id, event) {
  const res = await fetch(`${API_BASE}/Event/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Failed to update event (${res.status})`);
}

// DELETE /api/Event/:id – delete an event
export async function deleteEvent(id) {
  const res = await fetch(`${API_BASE}/Event/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete event (${res.status})`);
}
