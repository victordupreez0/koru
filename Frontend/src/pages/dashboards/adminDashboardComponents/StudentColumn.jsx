import React from "react";
import { Plus, User, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { SearchInput } from "./SearchInput";

export function StudentColumn({
  showAddStudent,
  setIsAssigningStudents,
  studentSearch,
  setStudentSearch,
  studentSort,
  setStudentSort,
  selectedCourseId,
  filteredStudents
}) {
  return (
    <div className="flex flex-col bg-white/70 border border-gray-100 rounded-3xl p-4 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold font-['Gabarito']">Students</h2>
        {showAddStudent && (
          <button
            onClick={() => setIsAssigningStudents(true)}
            className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Add student to course"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <SearchInput value={studentSearch} onChange={setStudentSearch} />
        <select
          value={studentSort}
          onChange={(e) => setStudentSort(e.target.value)}
          className="appearance-none text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 outline-none cursor-pointer hover:border-gray-300 transition-colors"
        >
          <option value="alpha">Alphabetical Order</option>
          <option value="default">Default Order</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {!selectedCourseId ? (
          <p className="text-sm text-gray-400 text-center py-8">Select a course to view students.</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No students enrolled.</p>
        ) : (
          filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 bg-white/80 border border-gray-100 hover:border-gray-200 transition-colors duration-150"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{student.name}</p>
                <p className="text-xs text-gray-400">{student.major}</p>
              </div>
              <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
