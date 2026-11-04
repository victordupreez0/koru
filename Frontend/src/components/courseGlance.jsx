import CourseGlanceDisplay from "./courseGlanceDisplay";
import TeacherCourseGlanceDisplay from "./teacherCourseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

import { useState } from "react";
import { useCourses } from "../contexts/CoursesContext";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "./UI";

export default function CourseGlance() {
    const { visibleCourses } = useCourses();
    const [activeCourseId, setActiveCourseId] = useState(null);
    const { user } = useAuth();
    const isTeacher = user?.role === "teacher";

    return (
        <Card variant="outlined" tone="low" radius="lg" padding="sm" className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between mt-5 mb-1">
                <h2 className="font-display text-koru-heading text-koru-on-surface">Course Glance</h2>
            </div>
            {/* Spacer between header and footer */}
            <div className="h-5" />
            <div>
                <CourseGlanceSelect activeCourseId={activeCourseId} setActiveCourseId={setActiveCourseId} visibleCourses={visibleCourses} />
                {isTeacher ? (
                    <TeacherCourseGlanceDisplay activeCourseId={activeCourseId} />
                ) : (
                    <CourseGlanceDisplay activeCourseId={activeCourseId} />
                )}
            </div>
        </Card>
    );
}