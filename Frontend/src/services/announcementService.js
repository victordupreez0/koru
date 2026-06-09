const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export async function getCourseAnnouncements(courseId, userId = null) {
  const url = userId
    ? `${API_BASE}/Announcement/course/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/Announcement/course/${encodeURIComponent(courseId)}`;
  
  const res = await fetch(url, {
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

export async function markAnnouncementAsRead(announcementId, userId) {
  if (!userId) return;
  const res = await fetch(`${API_BASE}/Announcement/${encodeURIComponent(announcementId)}/read?userId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}

export async function markAllAnnouncementsAsRead(courseId, userId) {
  if (!userId) return;
  const res = await fetch(`${API_BASE}/Announcement/course/${encodeURIComponent(courseId)}/read-all?userId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  return handleResponse(res);
}
