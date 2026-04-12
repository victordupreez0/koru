import React from "react";
import { motion } from "framer-motion";
import CourseGlance from "../components/courseGlance";
import TodayTimeline from "../components/todayTimeline";


export default function Dashboard() {
  return (
    <div className="flex flex-row gap-8 items-start">
      <CourseGlance />
      <TodayTimeline />
    </div>
  );
}