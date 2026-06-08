import React from "react";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentCourses from "./courses/studentCourses";
import TeacherCourses from "./courses/teacherCourses";
import AdminCourses from "./courses/adminCourses";
import CreateCoursePage from "./courses/createCoursePage";

// The unified Courses route - acts as a traffic controller based on user role
export default function Courses() {
  const { role } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const viewAs = searchParams.get("viewAs");

  // Route intercept for course creation
  const path = window.location.pathname;
  if (role === "admin" && (path === "/courses/create" || path === "/courses/create/")) {
    return <CreateCoursePage />;
  }

  // Allow forcing a perspective view (e.g., for Admin Preview modals)
  if (viewAs === "teacher") {
    return <TeacherCourses />;
  }
  
  if (viewAs === "student") {
    return <StudentCourses />;
  }

  if (role === "admin") {
    return <AdminCourses />;
  }

  if (role === "teacher") {
    return <TeacherCourses />;
  }

  // Default fallback is the student layout
  return <StudentCourses />;
}
