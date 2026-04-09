// Base URL for our backend API
const API_BASE = "http://localhost:5299/api";

// GET /api/Event – fetch all events from the backend
export async function getEvents() {
  const res = await fetch(`${API_BASE}/Event`);
  if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
  return res.json();
}

// GET /api/Event/:id – fetch a single event by its ID
export async function getEventById(id) {
  const res = await fetch(`${API_BASE}/Event/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Event not found (${res.status})`);
  return res.json();
}

// POST /api/Event – create a new event
export async function createEvent(event) {
  const res = await fetch(`${API_BASE}/Event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Failed to create event (${res.status})`);
  return res.json();
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
