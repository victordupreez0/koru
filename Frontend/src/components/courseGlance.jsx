import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

import { motion } from "framer-motion";

export default function CourseGlance() {
    return (
        <>
            <div className="w-full">
                <div className="flex items-center justify-between mt-5 mb-2">
                    <h2 className="text-2xl">Course Glance</h2>
                </div>
                <CourseGlanceSelect />
                <CourseGlanceDisplay />
            </div>
        </>
    );
}