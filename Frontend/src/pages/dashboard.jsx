import React from "react";
import { motion } from "framer-motion";
import CourseGlance from "../components/courseGlance";
import TodayTimeline from "../components/todayTimeline";
import AssignmentsProgress from "../components/assignmentsProgress";


export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-8 items-start w-full ">
      <CourseGlance />
      <TodayTimeline />
      <AssignmentsProgress />
    </div>
  );
}