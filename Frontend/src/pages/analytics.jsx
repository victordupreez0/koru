import React from "react";
import { useAuth } from "../contexts/AuthContext";

// View components
import StudentAnalytics from "./analytics/studentAnalytics";
import TeacherAnalytics from "./analytics/teacherAnalytics";
import AdminAnalytics from "./analytics/adminAnalytics";

// The unified Analytics route - acts as a traffic controller based on user role
export default function AnalyticsPage() {
  const { role } = useAuth();

  if (role === "admin") return <AdminAnalytics />;

  if (role === "teacher") {
    return <TeacherAnalytics />;
  }

  // Default fallback is the student analytics
  return <StudentAnalytics />;
}
