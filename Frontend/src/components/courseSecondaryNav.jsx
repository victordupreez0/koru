import React from "react";
import CourseNavItem from "./courseNavItem";
import { motion } from "framer-motion";

const SECONDARY_NAV_ITEMS = [
    { label: "Home", href: "/courses", end: true },
    { label: "Announcements", href: "/courses/announcements" },
    { label: "Assignments", href: "/courses/assignments" },
    { label: "Modules", href: "/courses/modules" },
    { label: "Grades", href: "/courses/grades" },
    { label: "Attendance", href: "/courses/attendance" },
];

/**
 * CourseSecondaryNav Component
 * 
 * Second-tier navigation bar specific to the currently selected course.
 * Includes items like Home, Announcements, Modules, etc.
 * Uses CourseNavItem to render links with active state indicators (black line).
 */
export default function CourseSecondaryNav() {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-48 py-8 flex flex-col gap-2"
        >
            <ul className="flex flex-col">
                {SECONDARY_NAV_ITEMS.map((item, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={item.label}
                    >
                        <CourseNavItem 
                            label={item.label} 
                            href={item.href} 
                            end={item.end}
                        />
                    </motion.div>
                ))}
            </ul>
        </motion.div>
    );
}
