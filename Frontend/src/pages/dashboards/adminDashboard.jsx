import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

export default function AdminDashboard() {
  return (
    <div className="flex flex-row gap-8 items-start">
      <Menu />
      <SideMenu />
      <div className="flex w-full flex-col items-center justify-center pt-24 text-slate-500">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p>System metrics and user management tools will appear here.</p>
      </div>
    </div>
  );
}
