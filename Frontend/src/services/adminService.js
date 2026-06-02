const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

/**
 * Shared response handler to parse JSON and catch errors from the backend.
 * @param {Response} res - The fetch response object
 * @returns {Promise<any>} - The parsed JSON data
 */
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

/**
 * Course Service - Handles all API interactions for courses.
 */
export const courseService = {
  /**
   * Fetches all courses from the database, including related Subject and Teacher data.
   */
  async getAllCourses() {
    const res = await fetch(`${API_BASE}/Course`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(res);
  },

  /**
   * Creates a new course in the database.
   * @param {Object} courseData - The course details (SubjectId, TeacherId, Term, Year, etc.)
   */
  async createCourse(courseData) {
    const res = await fetch(`${API_BASE}/Course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  /**
   * Updates an existing course by ID.
   * @param {string} id - The GUID of the course
   * @param {Object} courseData - Fields to update (Term, Year, Capacity, SubjectId, TeacherId)
   */
  async updateCourse(id, courseData) {
    const res = await fetch(`${API_BASE}/Course/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  /**
   * Deletes a course by its unique ID.
   * @param {string} id - The GUID of the course
   */
  async deleteCourse(id) {
    const res = await fetch(`${API_BASE}/Course/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to delete course");
    }
  }
};

/**
 * User Service - Specifically for fetching teacher/staff accounts.
 */
export const userService = {
  /**
   * Fetches all users and filters them by "Teacher" role.
   */
  async getTeachers() {
    const res = await fetch(`${API_BASE}/User`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const users = await handleResponse(res);
    // Filter to only return teachers for the dropdowns
    // Normalizing role check to handle potential case differences from DB (teacher/Teacher)
    return users.filter(user => user.role?.toLowerCase() === "teacher");
  }
};

/**
 * Subject Service - For fetching the institution's subject catalog.
 */
export const subjectService = {
  async getSubjects() {
    const res = await fetch(`${API_BASE}/Subject`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(res);
  }
};
