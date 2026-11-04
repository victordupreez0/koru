import React from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { Button, Card } from "../../../components/UI";
import { ColumnCard } from "./ColumnCard";
import { SearchInput } from "./SearchInput";

export function CourseColumn({
  courseSearch,
  setCourseSearch,
  filteredCourses,
  selectedCourseId,
  handleSelectCourse,
  lecturers,
  onAddCourse,
  isAddingCourse,
  warningCourseDetails,
}) {
  return (
    <Card tone="low" radius="2xl" padding="sm" className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-koru-title text-koru-on-surface">Courses</h2>
        <Button
          variant={isAddingCourse ? "tonal" : "outlined"}
          size="icon"
          onClick={onAddCourse}
          aria-label="Add course"
        >
          {isAddingCourse ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      <SearchInput value={courseSearch} onChange={setCourseSearch} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {filteredCourses.length === 0 ? (
          <p className="py-8 text-center text-sm text-koru-on-surface-variant">No courses found for this filter.</p>
        ) : (
          filteredCourses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            const warningMessage = warningCourseDetails?.get(course.id);
            const hasWarning = !!warningMessage;
            return (
              <ColumnCard
                key={course.id}
                isSelected={isSelected}
                onClick={() => handleSelectCourse(course.id)}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${isSelected ? "bg-koru-primary" : "bg-koru-outline-variant"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {course.title}
                  </p>
                  <p className={`truncate text-xs ${isSelected ? "text-koru-on-primary-container/70" : "text-koru-on-surface-variant"}`}>
                    {lecturers.find((l) => l.id === course.lecturerId)?.name || "Unassigned"}
                  </p>
                </div>
                {hasWarning && (
                  <div className="group/tooltip relative shrink-0">
                    <div className="flex h-6 w-6 cursor-help items-center justify-center rounded-full bg-koru-warning-soft text-koru-warning transition-colors">
                      <AlertTriangle size={12} className="stroke-[2.5]" />
                    </div>

                    {/* Tooltip Content */}
                    <div className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 hidden -translate-y-1/2 whitespace-nowrap rounded-koru-md bg-koru-inverse-surface px-3 py-2 text-[10px] font-medium text-koru-inverse-on-surface shadow-koru-md transition-all group-hover/tooltip:block">
                      {warningMessage}
                      {/* Arrow */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-koru-inverse-surface" />
                    </div>
                  </div>
                )}
              </ColumnCard>
            );
          })
        )}
      </div>
    </Card>
  );
}
