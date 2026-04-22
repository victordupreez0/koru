import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const BASE_NAV_ITEMS = [
    { label: "Home", pathSuffix: "", end: true },
    { label: "Announcements", pathSuffix: "/announcements" },
    { label: "Assignments", pathSuffix: "/assignments" },
    { label: "Modules", pathSuffix: "/modules" },
    { label: "Notes", pathSuffix: "/notes" },
    { label: "Grades", pathSuffix: "/grades" },
    { label: "Attendance", pathSuffix: "/attendance" },
];

/**
 * CourseSecondaryNav Component
 */
export default function CourseSecondaryNav({ activeCourseId }) {
    // Generate the base link using the newly introduced ID
    const basePath = `/courses/${activeCourseId || ""}`;

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-44 py-8 flex flex-col gap-1"
        >
            <ul className="flex flex-col">
                {BASE_NAV_ITEMS.map((item, index) => (
                    <motion.li
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="list-none"
                    >
                        <NavLink
                            to={`${basePath}${item.pathSuffix}`}
                            end={item.end}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-4 py-1.5 text-sm font-medium transition-all duration-200 border-l-2 ${
                                    isActive 
                                    ? "text-[#3C0078] border-[#3C0078] font-bold bg-[#3C0078]/5" 
                                    : "text-gray-500 border-transparent hover:text-[#3C0078] hover:bg-[#3C0078]/5"
                                }`
                            }
                        >
                            <div className="flex items-center w-full justify-between">
                                <span>{item.label}</span>
                            </div>
                        </NavLink>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}
