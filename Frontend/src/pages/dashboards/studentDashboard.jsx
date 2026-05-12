import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import CourseGlance from "../../components/courseGlance";
import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";

export default function StudentDashboard() {
  return (
    <div className="relative h-[80vh] overflow-hidden flex items-center justify-center p-6 ">
      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />

      {/* Three equal-width columns, centered on the page */}
      <div className="grid grid-cols-3 grid-rows-1 gap-6 h-full w-full max-w-[1400px]">
        <CourseGlance />
        <TodayTimeline />
        <AssignmentsProgress />
      </div>
    </div>
  );
}
