
// Static list of courses the student is enrolled in
// Each entry has a code, a short avatar label, and a Tailwind colour class
const courses = [
    { code: "UX300", avatar: "UX", color: "btn-neutral" },
    { code: "DV300", avatar: "DV", color: "!bg-white" },
    { code: "VC300", avatar: "VC", color: "!bg-white" },
    { code: "PP300", avatar: "PP", color: "!bg-white" },
];

import { useState } from "react";
import { motion } from "framer-motion";

// Course selector – row of animated pill buttons above the Course Glance card
// The active course expands to show its code label; inactive ones collapse to a small avatar circle
export default function CourseGlanceSelect() {
    // Track which course is currently selected
    const [active, setActive] = useState(courses[0].code);

    // Re-order so the active course always appears first
    const orderedCourses = [
        courses.find((course) => course.code === active),
        ...courses.filter((course) => course.code !== active),
    ].filter(Boolean);

    return (
        <div className="relative w-fit max-w-[350px] z-50 h-fit scrollbar-black">
            {/* Horizontally scrollable row of course buttons */}
            <motion.div layout className="relative z-0 flex flex-row space-x-2 overflow-x-auto pr-8 pb-5 scrollbar-hide">
                {orderedCourses.map((course) => {
                    const isActive = active === course.code;
                    return (
                        <motion.button
                            key={course.code}
                            layout="position"
                            initial={false}
                            // Active button is wider to reveal the course code text
                            animate={isActive ? { width: 116, height: 40 } : { width: 40, height: 40 }}
                            transition={{
                                layout: { type: "spring", stiffness: 240, damping: 30, mass: 0.9 },
                                width: { type: "spring", stiffness: 220, damping: 32, mass: 0.9, delay: isActive ? 0.14 : 0 },
                                height: { type: "spring", stiffness: 220, damping: 32, mass: 0.9 },
                            }}
                            className={`btn !rounded-full !border-transparent flex items-center overflow-hidden transition-colors duration-200 focus:outline-none focus:ring-0 active:outline-none active:ring-0
                                hover:shadow-md hover:!border-transparent
                                ${isActive ? "!bg-[#3C0078] !text-white !px-2 justify-start" : "!bg-white !text-black p-0 justify-center items-center"}`}
                            style={{ minWidth: 0, minHeight: 0, padding: isActive ? undefined : 0, display: 'flex', alignItems: 'center', justifyContent: isActive ? 'flex-start' : 'center' }}
                            onClick={() => setActive(course.code)}
                        >
                            <span className={`flex items-center w-full ${isActive ? '' : 'justify-center'}`} style={{height: '100%'}}>
                                {/* Circular avatar with the short label (e.g. "UX") */}
                                <span className="avatar avatar-placeholder flex-shrink-0 flex items-center justify-center" style={{height: '100%'}}>
                                    <span className={`w-8 h-8 rounded-full flex items-center font-bold justify-center aspect-square overflow-hidden transition-colors duration-150
                                        ${isActive ? "bg-white text-black" : "bg-[#3C0078] text-neutral-content"}`}
                                    >
                                        <span className="text-xs">{course.avatar}</span>
                                    </span>
                                </span>

                                {/* Course code label – only visible when this button is active */}
                                <motion.span
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0, width: isActive ? "auto" : 0 }}
                                    transition={{ duration: 0.2, delay: isActive ? 0.22 : 0 }}
                                    className="text-sm font-medium whitespace-nowrap pl-2 pr-0 overflow-hidden"
                                    style={{ display: isActive ? "inline-block" : "none" }}
                                >
                                    {course.code}
                                </motion.span>
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Right-edge fade overlay so the row doesn't end abruptly */}
            <div className="pointer-events-none absolute top-0 right-0 bottom-5 z-10 w-8 bg-gradient-to-l from-[#f5f5f5] to-transparent" />
        </div>
    );
}