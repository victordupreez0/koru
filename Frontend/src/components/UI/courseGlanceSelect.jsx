


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
        // Container: Outer wrapper with stacking context and full width
        <div className="relative w-full z-50 h-fit scrollbar-black">
            
            <motion.div layout className="relative z-0 flex flex-row space-x-2 overflow-x-auto pr-8 pb-5 scrollbar-hide">
                {orderedCourses.map((course) => {
                    const isActive = activeCourseId === course.id;
                    return (
                        // Button: Animates between 40px (inactive) and 116px (active)
                        // Active state: Cyan bg, dark text, left-aligned with padding
                        // Inactive: White bg, centered
                        <motion.button
                            key={course.id}
                            layout="position"
                            initial={false}
                            // Animate width/height: Active=116px wide with label, inactive=40px square icon only
                            animate={isActive ? { width: 116, height: 40 } : { width: 40, height: 40 }}
                            transition={{
                                layout: { type: "spring", stiffness: 240, damping: 30, mass: 0.9 },
                                width: { type: "spring", stiffness: 220, damping: 32, mass: 0.9, delay: isActive ? 0.14 : 0 },
                                height: { type: "spring", stiffness: 220, damping: 32, mass: 0.9 },
                            }}
                            // Base styling: Pill-shaped btn, flexbox center, no border, smooth color transition, no outline focus rings
                            className={`btn !rounded-full !border-transparent flex items-center overflow-hidden transition-colors duration-200 focus:outline-none focus:ring-0 active:outline-none active:ring-0
                                hover:shadow-md hover:!border-transparent
                                ${isActive ? "!bg-purple-300 !text-black !px-2 justify-start" : "!bg-purple-300 !text-black p-0 justify-center items-center"}`}
                            // Inline styles: Prevent min-width constraints, enable flex display, center or align-start based on active state
                            style={{ minWidth: 0, minHeight: 0, padding: isActive ? undefined : 0, display: 'flex', alignItems: 'center', justifyContent: isActive ? 'flex-start' : 'center' }}
                            onClick={() => setActiveCourseId(course.id)}
                        >
                           
                            <span className={`flex items-center w-full ${isActive ? '' : 'justify-center'}`} style={{ height: '100%' }}>
                                {/* Avatar circle: Always visible, shrink-free, contains course code */}
                                <span className="avatar avatar-placeholder flex-shrink-0 flex items-center justify-center" style={{ height: '100%' }}>
                                    {/* Code badge: 32px circle, cyan bg when inactive, white bg when active, bold small text centered */}
                                    <span className={`w-8 h-8 rounded-full flex items-center font-bold justify-center aspect-square overflow-hidden transition-colors duration-150
                                        ${isActive ? "bg-white text-black" : "bg-purple-300 text-black"}`}
                                    >
                                        <span className="text-xs">{course.code}</span>
                                    </span>
                                </span>
                                {/* Course label text: Only visible when active, animates in/out with fade and width, no-wrap with padding */}
                                <motion.span
                                    initial={false}
                                    // Fade in (opacity 1) and expand width when active, fade out and collapse when inactive
                                    animate={{ opacity: isActive ? 1 : 0, width: isActive ? "auto" : 0 }}
                                    // Staggered animation: Fade happens first, then text expands slightly delayed
                                    transition={{ duration: 0.2, delay: isActive ? 0.22 : 0 }}
                                    // Small bold text, no wrapping, left padding, hidden overflow
                                    className="text-sm font-medium whitespace-nowrap pl-2 pr-0 overflow-hidden"
                                    // Display property synced with opacity animation: Only render text in DOM when active
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