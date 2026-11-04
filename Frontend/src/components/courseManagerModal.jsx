import React from "react";
import { Eye, EyeClosed } from "@solar-icons/react";
import { useCourses } from "../contexts/CoursesContext";
import { Modal, Button, EmptyState } from "./UI";

export default function CourseManagerModal({ isOpen, onClose }) {
  const { allCourses, hiddenCourseIds, toggleCourseVisibility } = useCourses();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title="Manage Courses"
      description="Control visibility on your sidebar dashboard"
    >
      <div className="space-y-2">
        {allCourses.length === 0 ? (
          <EmptyState size="sm" title="You have no active enrolments yet." />
        ) : (
          allCourses.map((course) => {
            const isHidden = hiddenCourseIds.includes(course.id);
            return (
              <div
                key={course.id}
                className={`flex items-center justify-between p-4 rounded-koru-lg transition-colors motion-reduce:transition-none ${
                  isHidden
                    ? "bg-koru-surface-container opacity-60"
                    : "bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-12 h-12 rounded-koru-md flex items-center justify-center flex-shrink-0 border-2"
                    style={{
                      backgroundColor: isHidden ? "transparent" : course.color,
                      borderColor: course.color,
                      color: isHidden ? course.color : "var(--color-koru-on-primary)",
                    }}
                  >
                    <span className="text-koru-label font-medium leading-none">{course.code}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-koru-label font-medium text-koru-on-surface">
                      {course.label} - {course.term}
                    </span>
                    <span className="text-koru-caption text-koru-on-surface-variant line-clamp-1 pr-4">
                      {course.subjectName}
                    </span>
                  </div>
                </div>

                <Button
                  variant={isHidden ? "tonal" : "filled"}
                  size="icon"
                  onClick={() => toggleCourseVisibility(course.id)}
                  aria-label={isHidden ? "Show course" : "Hide course"}
                  title={isHidden ? "Hidden from sidebar (Click to show)" : "Visible on sidebar (Click to hide)"}
                >
                  {isHidden ? <EyeClosed size={20} variant="Bold" /> : <Eye size={20} variant="Bold" />}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
