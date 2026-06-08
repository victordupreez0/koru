const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

/**
 * Shared response handler to parse JSON and catch errors from the backend.
 * @param {Response} res - The fetch response object
 * @returns {Promise<any>} - The parsed JSON data
 */
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.errors) {
      const messages = Object.values(data.errors).flat().join(" ");
      throw new Error(messages || data.title || "Something went wrong.");
    }
    throw new Error(data.message || data.title || "Something went wrong.");
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
  },

  /**
   * Updates an existing course with new details.
   * @param {string} id - The GUID of the course
   * @param {Object} courseData - The updated course details
   */
  async updateCourse(id, courseData) {
    const res = await fetch(`${API_BASE}/Course/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to update course");
    }
  }
};

/**
 * User Service - For fetching teacher/staff and student accounts.
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
    return users.filter(user => user.role?.toLowerCase() === "teacher");
  },

  /**
   * Fetches all users and filters them by "Student" role.
   */
  async getStudents() {
    const res = await fetch(`${API_BASE}/User`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    const users = await handleResponse(res);
    return users.filter(user => user.role?.toLowerCase() === "student");
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
  },

  async createSubject(subjectData) {
    const res = await fetch(`${API_BASE}/Subject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subjectData)
    });
    return handleResponse(res);
  }
};

/**
 * Enrollment Service - For reading, creating, and bulk-managing student enrollments.
 */
export const enrollmentService = {
  async getAllEnrollments() {
    const res = await fetch(`${API_BASE}/Enrollment`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(res);
  },

  async getAll() {
    return this.getAllEnrollments();
  },

  async bulkEnrollStudents(courseId, studentIds) {
    const res = await fetch(`${API_BASE}/Enrollment/course/${courseId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentIds)
    });
    return handleResponse(res);
  },

  async create(enrollmentData) {
    const res = await fetch(`${API_BASE}/Enrollment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrollmentData)
    });
    return handleResponse(res);
  }
};

/**
 * Registration Service - For creating teacher accounts from the admin dashboard.
 */
export const registrationService = {
  async registerTeacher({ firstName, lastName, email }) {
    const tempPassword = `Change${Math.random().toString(36).slice(2, 10)}!`;
    const res = await fetch(`${API_BASE}/User/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password: tempPassword, role: "teacher" })
    });
    return handleResponse(res);
  }
};
