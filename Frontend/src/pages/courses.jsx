import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentCourses from "./courses/studentCourses";
import TeacherCourses from "./courses/teacherCourses";
import AdminCourses from "./courses/adminCourses";
import CreateCoursePage from "./courses/createCoursePage";

// The unified Courses route - acts as a traffic controller based on user role
export default function Courses() {
  const { role } = useAuth();
  const [hashParams] = useSearchParams();
  // The app uses HashRouter, so links put viewAs in the hash; the admin preview iframes use the real query string.
  const requestedView = hashParams.get("viewAs") ?? new URLSearchParams(window.location.search).get("viewAs");
  // Only staff can look through another role's eyes.
  const viewAs = role === "teacher" || role === "admin" ? requestedView : null;

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
