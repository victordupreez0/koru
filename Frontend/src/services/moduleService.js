import { parseStoredContent } from "../components/editor/pageDocument";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

// ─── Module Sections ────────────────────────────────────────────────────────

// GET /api/CourseModule/course/{courseId} – all sections (with nested items) for a course
export async function getCourseModules(courseId) {
  const res = await fetch(`${API_BASE}/CourseModule/course/${encodeURIComponent(courseId)}`);
  return handleResponse(res);
}

// GET /api/CourseModule/{id} – single module section (with nested items)
export async function getModuleById(id) {
  const res = await fetch(`${API_BASE}/CourseModule/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

// POST /api/CourseModule – create a new module section
export async function createModule(data) {
  const res = await fetch(`${API_BASE}/CourseModule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// PUT /api/CourseModule/{id} – update a module section's metadata
export async function updateModule(id, data) {
  const res = await fetch(`${API_BASE}/CourseModule/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// PUT /api/CourseModule/{id}/content – save NovelEditor page content for a module's own page
export async function updateModuleContent(id, content) {
  const res = await fetch(`${API_BASE}/CourseModule/${encodeURIComponent(id)}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// DELETE /api/CourseModule/{id} – remove a section and all its nested items
export async function deleteModule(id) {
  const res = await fetch(`${API_BASE}/CourseModule/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ─── Module Items ────────────────────────────────────────────────────────────

// GET /api/CourseModuleItem/{id} – single item by ID
export async function getModuleItem(id) {
  const res = await fetch(`${API_BASE}/CourseModuleItem/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

// POST /api/CourseModuleItem – create a new item inside a module section
export async function createModuleItem(data) {
  const res = await fetch(`${API_BASE}/CourseModuleItem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// PUT /api/CourseModuleItem/{id} – update an item's label, type, or publish state
export async function updateModuleItem(id, data) {
  const res = await fetch(`${API_BASE}/CourseModuleItem/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// PUT /api/CourseModuleItem/{id}/content – save NovelEditor page content for a document item
export async function updateModuleItemContent(id, content) {
  const res = await fetch(`${API_BASE}/CourseModuleItem/${encodeURIComponent(id)}/content`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// DELETE /api/CourseModuleItem/{id} – remove an item
export async function deleteModuleItem(id) {
  const res = await fetch(`${API_BASE}/CourseModuleItem/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ─── Unified page content (used by CourseItemView) ───────────────────────────

/**
 * Load the page content for an ID that may be a module item or a module section.
 * Throws when the page can't be loaded, so a failed request is never mistaken for an empty page.
 */
export async function getPageContent(pageId) {
  const kinds = [
    { pageType: "item", resource: "CourseModuleItem", titleField: "label" },
    { pageType: "module", resource: "CourseModule", titleField: "title" },
  ];
  for (const { pageType, resource, titleField } of kinds) {
    const res = await fetch(`${API_BASE}/${resource}/${encodeURIComponent(pageId)}`);
    if (res.status === 404) continue;
    if (!res.ok) throw new Error("The server couldn't load this page. Please try again.");
    const raw = await res.json();
    const parsed = parseStoredContent(raw.content);
    return { pageType, title: parsed?.title ?? raw[titleField] ?? "Untitled", sections: parsed?.sections ?? [], raw };
  }
  throw new Error("This page doesn't exist any more.");
}

/**
 * Persist the NovelEditor page content for a page ID.
 * pageType must be 'item' or 'module'.
 */
export async function savePageContent(pageId, pageType, contentPayload) {
  const content = JSON.stringify(contentPayload);
  if (pageType === "item") {
    return updateModuleItemContent(pageId, content);
  }
  return updateModuleContent(pageId, content);
}
