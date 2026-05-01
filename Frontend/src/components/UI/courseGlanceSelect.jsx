


import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCourses } from "../../contexts/CoursesContext";

export default function CourseGlanceSelect({ activeCourseId, setActiveCourseId, visibleCourses }) {
    // Initialise active course smoothly when data arrives
    useEffect(() => {
        if (visibleCourses?.length > 0 && !activeCourseId) {
            setActiveCourseId(visibleCourses[0].id);
        }
    }, [visibleCourses, activeCourseId, setActiveCourseId]);

    // Handle empty state protecting UI from crashing
    if (!visibleCourses || visibleCourses.length === 0) {
        return <div className="text-sm font-medium text-gray-400 pl-2">No active courses.</div>;
    }

    // Push the active course to the front of the horizontal scroll stack
    const orderedCourses = [
        visibleCourses.find((course) => course.id === activeCourseId),
        ...visibleCourses.filter((course) => course.id !== activeCourseId),
    ].filter(Boolean);
    return (
        <div className="relative w-full z-50 h-fit scrollbar-black">
            <motion.div layout className="relative z-0 flex flex-row space-x-2 overflow-x-auto pr-8 pb-5 scrollbar-hide">
                {orderedCourses.map((course) => {
                    const isActive = activeCourseId === course.id;
                    return (
                        <motion.button
                            key={course.id}
                            layout="position"
                            initial={false}
                            animate={isActive ? { width: 116, height: 40 } : { width: 40, height: 40 }}
                            transition={{
                                layout: { type: "spring", stiffness: 240, damping: 30, mass: 0.9 },
                                width: { type: "spring", stiffness: 220, damping: 32, mass: 0.9, delay: isActive ? 0.14 : 0 },
                                height: { type: "spring", stiffness: 220, damping: 32, mass: 0.9 },
                            }}
                            className={`btn !rounded-full !border-transparent flex items-center overflow-hidden transition-colors duration-200 focus:outline-none focus:ring-0 active:outline-none active:ring-0
                                hover:shadow-md hover:!border-transparent
                                ${isActive ? "!bg-[#9BE9EA] !text-black !px-2 justify-start" : "!bg-white dark:!bg-slate-700 !text-black dark:!text-slate-200 p-0 justify-center items-center"}`}
                            style={{ minWidth: 0, minHeight: 0, padding: isActive ? undefined : 0, display: 'flex', alignItems: 'center', justifyContent: isActive ? 'flex-start' : 'center' }}
                            onClick={() => setActiveCourseId(course.id)}
                        >
                            <span className={`flex items-center w-full ${isActive ? '' : 'justify-center'}`} style={{ height: '100%' }}>
                                <span className="avatar avatar-placeholder flex-shrink-0 flex items-center justify-center" style={{ height: '100%' }}>
                                    <span className={`w-8 h-8 rounded-full flex items-center font-bold justify-center aspect-square overflow-hidden transition-colors duration-150
                                        ${isActive ? "bg-white text-black" : "bg-[#9BE9EA] text-black"}`}
                                    >
                                        <span className="text-xs">{course.code}</span>
                                    </span>
                                </span>
                                <motion.span
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0, width: isActive ? "auto" : 0 }}
                                    transition={{ duration: 0.2, delay: isActive ? 0.22 : 0 }}
                                    className="text-sm font-medium whitespace-nowrap pl-2 pr-0 overflow-hidden"
                                    style={{ display: isActive ? "inline-block" : "none" }}
                                >
                                    {course.label}
                                </motion.span>
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}