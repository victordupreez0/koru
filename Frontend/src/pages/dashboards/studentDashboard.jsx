import React, { useState } from "react";
import CourseGlance from "../../components/courseGlance";
// import WeeklyHorizontalTimeline from "../../components/weeklyHorizontalTimeline";
import TodayTimeline from "../../components/todayTimeline";
import AssignmentsProgress from "../../components/assignmentsProgress";

export default function StudentDashboard() {
  return (
    <div className="relative h-[80vh] overflow-hidden flex items-center justify-center p-6">
      {/* Three equal-width columns, centered on the page */}
      <div className="grid grid-cols-3 grid-rows-1 gap-6 h-full w-full max-w-[1400px]">
        {/* Left column – course overview */}
        <CourseGlance />

        {/* Middle column – today's timeline */}
        <TodayTimeline />

        {/* Right column – assignments progress */}
        <AssignmentsProgress />
      </div>
    </div>
  );
}
