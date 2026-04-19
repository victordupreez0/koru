import React from "react";
import { NavLink } from "react-router-dom";
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
 */
export default function CourseSecondaryNav() {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-44 py-8 flex flex-col gap-1"
        >
            <ul className="flex flex-col">
                {SECONDARY_NAV_ITEMS.map((item, index) => (
                    <motion.li
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="list-none"
                    >
                        <NavLink
                            to={item.href}
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
