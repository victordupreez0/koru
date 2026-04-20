import React from "react";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentCalendar from "./calendars/studentCalendar";
import TeacherCalendar from "./calendars/teacherCalendar";
import AdminCalendar from "./calendars/adminCalendar";

// The unified Calendar route - acts as a traffic controller based on user role
export default function CalendarPage() {
  const { role } = useAuth();

  if (role === "admin") {
    return <AdminCalendar />;
  }

  if (role === "teacher") {
    return <TeacherCalendar />;
  }

  // Default fallback is the student calendar
  return <StudentCalendar />;
}
