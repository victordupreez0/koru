import React from "react";
import { useAuth } from "../contexts/AuthContext";
import HeaderTopBar from "../components/HeaderTopBar";

// View components
import StudentAnalytics from "./analytics/studentAnalytics";
import TeacherAnalytics from "./analytics/teacherAnalytics";
import AdminAnalytics from "./analytics/adminAnalytics";

// The unified Analytics route - acts as a traffic controller based on user role
export default function AnalyticsPage() {
  const { role } = useAuth();

  let content = <StudentAnalytics />;
  if (role === "admin") {
    content = <AdminAnalytics />;
  } else if (role === "teacher") {
    content = <TeacherAnalytics />;
  }

  return (
    <div className="flex flex-col overflow-hidden text-koru-on-surface transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full md:rounded-koru-lg md:bg-koru-surface-container-lowest md:shadow-koru-card md:ring-1 md:ring-koru-outline-faint md:backdrop-blur-xl max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 max-md:h-screen max-md:w-screen max-md:bg-koru-surface-container-lowest">
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
