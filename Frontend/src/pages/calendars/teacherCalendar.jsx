import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

export default function TeacherCalendar() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Menu />
      <SideMenu />
      <div className="flex w-full flex-col items-center justify-center pt-24 text-slate-500">
        <h2 className="text-2xl font-bold">Teacher Calendar</h2>
        <p>Your scheduled classes, meetings, and term dates will appear here.</p>
      </div>
    </div>
  );
}
