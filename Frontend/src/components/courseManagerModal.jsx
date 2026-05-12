import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeClosed, CloseCircle } from "@solar-icons/react";
import { useCourses } from "../contexts/CoursesContext";

export default function CourseManagerModal({ isOpen, onClose }) {
  const { allCourses, hiddenCourseIds, toggleCourseVisibility } = useCourses();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/30">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Manage Courses</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">Control visibility on your sidebar dashboard</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                  aria-label="Close modal"
                >
                  <CloseCircle size={28} variant="Bold" />
                </button>
              </div>

              {/* Course List Body */}
              <div className="overflow-y-auto p-4 flex-1 space-y-2">
                {allCourses.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 dark:text-slate-500 text-sm font-medium">
                    You have no active enrolments yet.
                  </div>
                ) : (
                  allCourses.map((course) => {
                    const isHidden = hiddenCourseIds.includes(course.id);
                    return (
                        <div
                        key={course.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                            isHidden
                            ? "bg-gray-50 dark:bg-slate-700/50 border-gray-100 dark:border-slate-700 opacity-60"
                            : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 shadow-sm"
                        }`}
                        >
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
                                style={{
                                    backgroundColor: isHidden ? "transparent" : course.color,
                                    borderColor: course.color,
                                    color: isHidden ? course.color : "#FFFFFF"
                                }}
                            >
                                <span className="text-sm font-bold leading-none">{course.code}</span>
                            </div>
                            <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isHidden ? "text-gray-600 dark:text-slate-400" : "text-gray-900 dark:text-slate-100"}`}>
                                {course.label} - {course.term}
                            </span>
                            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 line-clamp-1 pr-4">
                                {course.subjectName}
                            </span>
                            </div>
                        </div>

                        <button
                            onClick={() => toggleCourseVisibility(course.id)}
                            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                            isHidden
                                ? "bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-300 dark:hover:bg-slate-500 hover:text-gray-800 dark:hover:text-slate-200"
                                : "bg-[#3C0078]/10 text-[#3C0078] hover:bg-[#3C0078] hover:text-white"
                            }`}
                            aria-label={isHidden ? "Show course" : "Hide course"}
                            title={isHidden ? "Hidden from sidebar (Click to show)" : "Visible on sidebar (Click to hide)"}
                        >
                            {isHidden ? <EyeClosed size={20} variant="Bold" /> : <Eye size={20} variant="Bold" />}
                        </button>
                        </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
