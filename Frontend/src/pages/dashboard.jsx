import React from "react";
import { useAuth } from "../contexts/AuthContext";
import HeaderTopBar from "../components/HeaderTopBar";

// View components
import StudentDashboard from "./dashboards/studentDashboard";
import TeacherDashboard from "./dashboards/teacherDashboard";
import AdminDashboard from "./dashboards/adminDashboard";

// The unified Dashboard route - acts as a traffic controller based on user role
export default function Dashboard() {
  const { role } = useAuth();

  let content = <StudentDashboard />;
  if (role === "admin") {
    content = <AdminDashboard />;
  } else if (role === "teacher") {
    content = <TeacherDashboard />;
  }

  return (
    <div className="h-screen overflow-hidden -ml-4 -mr-8 -mt-6 flex flex-col bg-gray-50/10 text-slate-900">
      {/* Reusable breadcrumb header top bar */}
      <HeaderTopBar />

      {/* Scrollable View Content area */}
      <div className="flex-1 overflow-y-auto pt-6 px-8 pb-12 bg-white">
        <div className="w-full">
          {content}
        </div>
      </div>
    </div>
  );
}