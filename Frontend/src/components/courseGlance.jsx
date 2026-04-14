import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

import { MdAdd } from "react-icons/md";
import { motion } from "framer-motion";

export default function CourseGlance() {
    return (
        <>
            <div className="w-full">
                <div className="flex items-center justify-between mt-5 mb-2">
                    <h2 className="text-2xl">Course Glance</h2>
                    <motion.button
                        whileHover={{ scale: 1.3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="group w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 p-0 hover:bg-[#3C0078] transition-colors cursor-pointer"
                        aria-label="Add course"
                    >
                        <MdAdd className="w-4 h-4 text-[#000000] group-hover:text-[#ffffff] transition-colors" />
                    </motion.button>
                </div>
                <CourseGlanceSelect />
                <CourseGlanceDisplay />
            </div>
        </>
    );
}