import React from "react";
import { motion } from "framer-motion";

export default function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <p className="text-gray-500">Your calendar view goes here.</p>
    </motion.div>
  );
}
