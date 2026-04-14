import React from "react";
import { motion } from "framer-motion";
import CourseGlance from "../components/courseGlance";
import TodayTimeline from "../components/todayTimeline";


export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-8 items-start w-full">
      <CourseGlance />
      <TodayTimeline />
      <div>{/* Third component coming soon */}</div>
    </div>
  );
}