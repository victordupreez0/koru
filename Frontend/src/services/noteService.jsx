const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  // Try to parse JSON, if it fails return empty object
  const data = await res.text().then(text => text ? JSON.parse(text) : {}).catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

/**
 * Get all notes
 * @returns {Promise<Array>} Array of notes
 */
export const getNotes = async (userId) => {
    const url = userId ? `${API_BASE}/Note?authorId=${encodeURIComponent(userId)}` : `${API_BASE}/Note`;
    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleResponse(res);
};

/**
 * Get a note by ID
 * @param {string} id - The note's ID
 * @returns {Promise<Object>} The note object
 */
export const getNoteById = async (id) => {
    const res = await fetch(`${API_BASE}/Note/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    return handleResponse(res);
};

/**
 * Create a new note
 * @param {Object} noteData - The note data { title, content, courseId, studentId, authorId }
 * @returns {Promise<Object>} The created note
 */
export const createNote = async (noteData) => {
    const res = await fetch(`${API_BASE}/Note`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
    });
    return handleResponse(res);
};

/**
 * Update a note
 * @param {string} id - The note's ID
 * @param {Object} noteData - The updated note data
 * @returns {Promise<void>}
 */
export const updateNote = async (id, noteData) => {
    const res = await fetch(`${API_BASE}/Note/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
    });
    return handleResponse(res);
};

/**
 * Delete a note
 * @param {string} id - The note's ID
 * @returns {Promise<void>}
 */
export const deleteNote = async (id) => {
    const res = await fetch(`${API_BASE}/Note/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return handleResponse(res);
};
