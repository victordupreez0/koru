import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const COLLAPSED_LIMIT = 3;

export default function CourseGlanceSelect({ activeCourseId, setActiveCourseId, visibleCourses }) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (visibleCourses?.length > 0 && !activeCourseId) {
            setActiveCourseId(visibleCourses[0].id);
        }
    }, [visibleCourses, activeCourseId, setActiveCourseId]);

    if (!visibleCourses || visibleCourses.length === 0) {
        return <div className="pl-1 text-koru-caption text-koru-on-surface-variant">No active courses.</div>;
    }

    // Active course always first so it's never hidden inside the collapsed slice
    const orderedCourses = [
        visibleCourses.find((c) => c.id === activeCourseId),
        ...visibleCourses.filter((c) => c.id !== activeCourseId),
    ].filter(Boolean);

    const showExpander = orderedCourses.length > COLLAPSED_LIMIT;
    const displayedCourses = showExpander && !expanded
        ? orderedCourses.slice(0, COLLAPSED_LIMIT)
        : orderedCourses;

    return (
        <div className="relative w-full z-50 h-fit">
            <motion.div layout className="relative z-0 flex flex-row flex-wrap gap-2">
                {displayedCourses.map((course) => {
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
                            aria-pressed={isActive}
                            aria-label={course.label || course.code}
                            className={`btn !rounded-koru-pill !border-transparent !shadow-none flex items-center overflow-hidden transition-colors duration-200 ease-koru-out cursor-pointer !outline-none focus-visible:!ring-2 focus-visible:!ring-koru-focus focus-visible:!ring-offset-2 hover:!border-transparent
                                ${isActive
                                    ? "!bg-koru-secondary-container !text-koru-on-secondary-container !pl-1 !pr-3 justify-start"
                                    : "!bg-koru-primary-container/50 !text-koru-primary p-0 justify-center items-center hover:!bg-koru-primary-container"
                                }`}
                            style={{
                                minWidth: 0, minHeight: 0,
                                padding: isActive ? undefined : 0,
                                display: "flex", alignItems: "center",
                                justifyContent: isActive ? "flex-start" : "center",
                            }}
                            onClick={() => setActiveCourseId(course.id)}
                        >
                            <span
                                className={`flex items-center w-full ${isActive ? "" : "justify-center"}`}
                                style={{ height: "100%" }}
                            >
                                {/*
                                  Circle: diameter=32px (radius=16). Left padding=4px so circle
                                  center sits at x=20 — matching the pill's left arc centre (radius=20
                                  for a 40px-tall rounded-full). Always white so the code is legible
                                  against both the active (purple-300) and inactive (purple-100) pill.
                                */}
                                <span className="flex-shrink-0 flex items-center justify-center" style={{ height: "100%" }}>
                                    <span className="flex aspect-square h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-koru-surface-container-lowest font-semibold transition-colors duration-150">
                                        <span className={`text-xs ${isActive ? "text-koru-on-surface" : "text-koru-primary"}`}>
                                            {course.code}
                                        </span>
                                    </span>
                                </span>

                                <motion.span
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0, width: isActive ? "auto" : 0 }}
                                    transition={{ duration: 0.2, delay: isActive ? 0.22 : 0 }}
                                    className="text-sm font-medium whitespace-nowrap pl-2 overflow-hidden"
                                    style={{ display: isActive ? "inline-block" : "none" }}
                                >
                                    {course.label}
                                </motion.span>
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>

            {showExpander && (
                <motion.button
                    layout
                    onClick={() => setExpanded((e) => !e)}
                    aria-expanded={expanded}
                    className="mt-2 h-10 cursor-pointer rounded-koru-pill bg-koru-surface-container-high px-3 text-xs font-medium text-koru-on-surface-variant transition-colors duration-150 ease-koru-out hover:bg-koru-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                >
                    {expanded ? "Less" : `+${orderedCourses.length - COLLAPSED_LIMIT} more`}
                </motion.button>
            )}
        </div>
    );
}
