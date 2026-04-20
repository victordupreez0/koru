import React from "react";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentDashboard from "./dashboards/studentDashboard";
import TeacherDashboard from "./dashboards/teacherDashboard";
import AdminDashboard from "./dashboards/adminDashboard";

// The unified Dashboard route - acts as a traffic controller based on user role
export default function Dashboard() {
  const { role } = useAuth();

  if (role === "admin") {
    return <AdminDashboard />;
  }

  if (role === "teacher") {
    return <TeacherDashboard />;
  }

  // Default assumption fallback is the student dashboard
  return <StudentDashboard />;
}