import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import CourseGlance from "../../components/courseGlance";
import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";

export default function StudentDashboard() {
  return (
    <div className="flex flex-row gap-8 items-start">
       {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />
      {/* Left column – course overview with todo, next class & announcements */}
      <CourseGlance />
      <TodayTimeline />
      <AssignmentsProgress />
    </div>
  );
}
