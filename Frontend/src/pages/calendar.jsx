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
    <div className="flex flex-col overflow-hidden transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full md:bg-koru-surface-container-lowest md:rounded-koru-lg md:shadow-koru-md max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 max-md:bg-koru-surface-container-lowest text-koru-on-surface">
      {/* Reusable breadcrumb header top bar */}
      <HeaderTopBar />

      {/* Scrollable View Content area */}
      <div className="flex-1 overflow-y-auto pt-6 px-8 pb-12">
        <div className="w-full">
          {content}
        </div>
      </div>
    </div>
  );
}
