import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

export default function AdminCalendar() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Menu />
      <SideMenu />
      <div className="flex w-full flex-col items-center justify-center pt-24 text-slate-500">
        <h2 className="text-2xl font-bold">Admin Calendar</h2>
        <p>Global institutional calendar and event management tools will appear here.</p>
      </div>
    </div>
  );
}
