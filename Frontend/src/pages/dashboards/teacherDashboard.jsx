import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import TeacherShortcuts from "../../components/teacherShortcuts";
import TodayTimeline from "../../components/todayTimeline";
import TeacherTodoProgress from "../../components/teacherTodoProgress";

export default function TeacherDashboard() {
  return (
    <div className="relative h-[80vh] overflow-hidden flex items-center justify-center p-6">
      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />

      {/* Three equal-width columns, centered on the page */}
      <div className="grid grid-cols-3 grid-rows-1 gap-6 h-full w-full max-w-[1400px]">
        {/* Left column – shortcuts */}
        <TeacherShortcuts />

        {/* Middle column – today's timeline */}
        <TodayTimeline />

        {/* Right column – to-do list & progress ring */}
        <TeacherTodoProgress />
      </div>
    </div>
  );
}
