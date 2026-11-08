const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function handle(res) {
  const data = await res.text().then((t) => (t ? JSON.parse(t) : {})).catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

const blockUrl = (pageId, blockId) =>
  `${API_BASE}/Attempt/pages/${encodeURIComponent(pageId)}/blocks/${encodeURIComponent(blockId)}`;

// POST – the server marks the answer and returns { passed, score, maxScore, message, details, recorded }
export async function submitAttempt(pageId, blockId, userId, answer) {
  const res = await fetch(blockUrl(pageId, blockId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, answer }),
  });
  return handle(res);
}

// GET – this student's progress on every block of a page
export async function getMyAttempts(pageId, userId) {
  const res = await fetch(`${API_BASE}/Attempt/pages/${encodeURIComponent(pageId)}/mine?userId=${encodeURIComponent(userId)}`);
  return handle(res);
}

// GET – who has tried a block (lecturers only)
export async function getBlockResults(pageId, blockId, userId) {
  const res = await fetch(`${blockUrl(pageId, blockId)}/results?userId=${encodeURIComponent(userId)}`);
  return handle(res);
}
