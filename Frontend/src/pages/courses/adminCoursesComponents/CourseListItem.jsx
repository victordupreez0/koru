import React from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

export default function CourseListItem({ course, onClick }) {
  return (
    <motion.div 
      onClick={onClick} 
      className="group bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-4 rounded-koru-xl flex items-center justify-between hover:shadow-koru-card-hover transition-shadow motion-reduce:transition-none cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-koru-md bg-koru-primary-container text-koru-on-primary-container flex items-center justify-center group-hover:bg-koru-primary group-hover:text-koru-on-primary transition-colors motion-reduce:transition-none">
          <BookOpen size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-koru-caption font-medium text-koru-primary uppercase tracking-wider">{course.subject?.code}</span>
            <span className="text-koru-caption text-koru-on-surface-variant uppercase tracking-wider">• {course.year} Year • {course.term}</span>
          </div>
          <h3 className="font-display text-base text-koru-on-surface">{course.subject?.name}</h3>
          <div className="text-koru-caption text-koru-on-surface-variant uppercase mt-0.5 tracking-wider">{course.degree || "UX Design Degree"}</div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-koru-caption font-medium text-koru-on-surface uppercase tracking-wider">{course.teacher?.firstName} {course.teacher?.lastName}</div>
          <div className="text-koru-caption text-koru-on-surface-variant uppercase">Lead Faculty</div>
        </div>
        <div className="p-2.5 rounded-koru-sm bg-koru-surface-container text-koru-on-surface-variant group-hover:bg-koru-primary group-hover:text-koru-on-primary transition-colors motion-reduce:transition-none">
          <ChevronRight size={16} />
        </div>
      </div>
    </motion.div>
  );
}
