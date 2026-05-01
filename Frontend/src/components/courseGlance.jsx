import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

import { motion } from "framer-motion";

import { useState } from "react";
import { useCourses } from "../contexts/CoursesContext";

export default function CourseGlance() {
    const { visibleCourses } = useCourses();
    const [activeCourseId, setActiveCourseId] = useState(null);

    return (
        <>
            <div className="w-full">
                <div className="flex items-center justify-between mt-5 mb-2">
                    <h2 className="text-2xl dark:text-slate-100">Course Glance</h2>
                </div>
                <CourseGlanceSelect activeCourseId={activeCourseId} setActiveCourseId={setActiveCourseId} visibleCourses={visibleCourses} />
                <CourseGlanceDisplay activeCourseId={activeCourseId} />
            </div>
        </>
    );
}