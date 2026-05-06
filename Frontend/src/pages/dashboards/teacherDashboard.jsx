import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import TeacherShortcuts from "../../components/teacherShortcuts";
import TodayTimeline from "../../components/todayTimeline";
import TeacherTodoProgress from "../../components/teacherTodoProgress";

export default function TeacherDashboard() {
  return (
    <div className="flex flex-row gap-8 items-start">
      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />

      {/* Left column – shortcuts */}
      <TeacherShortcuts />

      {/* Middle column – today's timeline */}
      <TodayTimeline />

      {/* Right column – to-do list & progress ring */}
      <TeacherTodoProgress />
    </div>
  );
}
