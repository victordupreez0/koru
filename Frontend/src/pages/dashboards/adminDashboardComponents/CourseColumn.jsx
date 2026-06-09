import React from "react";
import { ColumnCard } from "./ColumnCard";
import { SearchInput } from "./SearchInput";

export function CourseColumn({
  courseSearch,
  setCourseSearch,
  selectedLecturerId,
  filteredCourses,
  selectedCourseId,
  handleSelectCourse,
  lecturers,
}) {
  return (
    <div className="flex flex-col bg-white/70 border border-gray-100 rounded-3xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold font-['Gabarito']">Courses</h2>
      </div>
      <SearchInput value={courseSearch} onChange={setCourseSearch} />

      <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {!selectedLecturerId ? (
          <p className="text-sm text-gray-400 text-center py-8">Select a lecturer to view courses.</p>
        ) : filteredCourses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No courses found.</p>
        ) : (
          filteredCourses.map((course) => (
            <ColumnCard
              key={course.id}
              isSelected={course.id === selectedCourseId}
              onClick={() => handleSelectCourse(course.id)}
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${course.id === selectedCourseId ? "bg-white" : "bg-gray-300"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${course.id === selectedCourseId ? "text-white" : "text-gray-800"}`}>
                  {course.title}
                </p>
                <p className={`text-xs ${course.id === selectedCourseId ? "text-white/70" : "text-gray-400"}`}>
                  {lecturers.find((l) => l.id === course.lecturerId)?.name}
                </p>
              </div>
            </ColumnCard>
          ))
        )}
      </div>
    </div>
  );
}
