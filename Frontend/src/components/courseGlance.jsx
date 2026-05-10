import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

import { motion } from "framer-motion";

import { useState } from "react";
import { useCourses } from "../contexts/CoursesContext";

export default function CourseGlance() {
    const { visibleCourses } = useCourses();
    const [activeCourseId, setActiveCourseId] = useState(null);

    return (
            <div className="w-full h-full flex flex-col bg-white border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4">
                <div className="flex items-center justify-between mt-5 mb-1">
                    <h2 className="text-2xl font-['Gabarito']">Course Glance</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <CourseGlanceSelect activeCourseId={activeCourseId} setActiveCourseId={setActiveCourseId} visibleCourses={visibleCourses} />
                    <CourseGlanceDisplay activeCourseId={activeCourseId} />
                </div>
            </div>
    );
}