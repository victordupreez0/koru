import React from "react";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentCourses from "./courses/studentCourses";
import TeacherCourses from "./courses/teacherCourses";
import AdminCourses from "./courses/adminCourses";

// The unified Courses route - acts as a traffic controller based on user role
export default function Courses() {
  const { role } = useAuth();

  if (role === "admin") {
    return <AdminCourses />;
  }

  if (role === "teacher") {
    return <TeacherCourses />;
  }

  // Default fallback is the student layout
  return <StudentCourses />;
}
