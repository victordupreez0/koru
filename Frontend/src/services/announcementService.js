const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export async function getCourseAnnouncements(courseId) {
  const res = await fetch(`${API_BASE}/Announcement/course/${encodeURIComponent(courseId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function createAnnouncement(announcement) {
  const res = await fetch(`${API_BASE}/Announcement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(announcement)
  });
  return handleResponse(res);
}

export async function deleteAnnouncement(announcementId) {
  const res = await fetch(`${API_BASE}/Announcement/${encodeURIComponent(announcementId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}
