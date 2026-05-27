import React, { useState } from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import CourseGlance from "../../components/courseGlance";
import WeeklyHorizontalTimeline from "../../components/weeklyHorizontalTimeline";
// import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";

export default function StudentDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative w-full max-w-[1400px] mx-auto p-6 flex flex-col gap-6 pb-24 min-h-[90vh] justify-start">
      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />

      {/* Timeline sits outside the blur container so its modals are always crisp and visible */}
      <WeeklyHorizontalTimeline onModalToggle={setIsModalOpen} />

      {/* Dashboard columns wrap in a smooth blur/scale transition container when modal is active */}
      <div className={`grid grid-cols-2 gap-6 w-full items-start transition-all duration-500 ease-out ${isModalOpen ? "blur-md opacity-30 pointer-events-none scale-[0.985]" : ""
        }`}>
        <div className="h-[580px]">
          <CourseGlance />
        </div>
        <div className="h-[580px]">
          <AssignmentsProgress />
        </div>
      </div>
    </div>
  );
}
