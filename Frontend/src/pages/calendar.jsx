import React from "react";
import { useAuth } from "../contexts/AuthContext";
import HeaderTopBar from "../components/HeaderTopBar";

// View components
import StudentCalendar from "./calendars/studentCalendar";
import TeacherCalendar from "./calendars/teacherCalendar";
import AdminCalendar from "./calendars/adminCalendar";

// The unified Calendar route - acts as a traffic controller based on user role
export default function CalendarPage() {
  const { role } = useAuth();

  let content = <StudentCalendar />;
  if (role === "admin") {
    content = <AdminCalendar />;
  } else if (role === "teacher") {
    content = <TeacherCalendar />;
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
