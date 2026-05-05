import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import CourseGlance from "../../components/courseGlance";
import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";

export default function StudentDashboard() {
  return (
    <div className="flex flex-row gap-12 items-start px-24 py-12 w-full h-full overflow-y-auto">
       {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />
      {/* Left column – course overview with todo, next class & announcements */}
      <div className="flex-1 min-w-0 max-w-2xl">
        <CourseGlance />
      </div>
      <div className="flex-1 min-w-0 max-w-sm">
        <TodayTimeline />
      </div>
      <div className="flex-1 min-w-0 max-w-sm">
        <AssignmentsProgress />
      </div>
    </div>
  );
}
