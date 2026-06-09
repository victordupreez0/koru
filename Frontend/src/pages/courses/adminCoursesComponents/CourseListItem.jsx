import React from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

export default function CourseListItem({ course, onClick }) {
  return (
    <motion.div 
      onClick={onClick} 
      className="group bg-white border border-gray-100 p-4 rounded-[20px] flex items-center justify-between hover:shadow-xl hover:border-transparent transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#3C0078]/5 text-[#3C0078] flex items-center justify-center group-hover:bg-[#3C0078] group-hover:text-white transition-all">
          <BookOpen size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#3C0078] uppercase tracking-widest">{course.subject?.code}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {course.year} Year • {course.term}</span>
          </div>
          <h3 className="text-base font-black text-gray-900 tracking-tight">{course.subject?.name}</h3>
          <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider">{course.degree || "UX Design Degree"}</div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{course.teacher?.firstName} {course.teacher?.lastName}</div>
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Lead Faculty</div>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white transition-all">
          <ChevronRight size={16} />
        </div>
      </div>
    </motion.div>
  );
}
