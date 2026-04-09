import React from "react";
import { motion } from "framer-motion";

// Dashboard widgets
import CourseGlance from "../components/courseGlance";
import TodayTimeline from "../components/todayTimeline";

// Dashboard page – the default landing page after login
// Displays the course glance panel on the left and today's timeline on the right
export default function Dashboard() {
  return (
    <div className="flex flex-row gap-8 items-start">
      {/* Left column – course overview with todo, next class & announcements */}
      <CourseGlance />

      {/* Right column – scrollable list of today's scheduled events */}
      <TodayTimeline />
    </div>
  );
}