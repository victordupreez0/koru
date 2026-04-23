import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

export default function TeacherCourses() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Menu />
      <div className="flex flex-col h-full py-8 px-4 items-center gap-6">
        <div className="mt-auto">
          <SideMenu />
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center pt-24 text-slate-500">
        <h2 className="text-2xl font-bold">Teacher Courses View</h2>
        <p>Course management, grading, and lecture uploads will appear here.</p>
      </div>
    </div>
  );
}
