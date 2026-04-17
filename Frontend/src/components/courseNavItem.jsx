import React from "react";
import { NavLink } from "react-router-dom";

import { motion } from "framer-motion";

/**
 * CourseNavItem Component
 * 
 * Individual link item used in the CourseSecondaryNav bar.
 * Features a vertical border (black when active, transparent when not) 
 * on the left side to highlight the current section.
 */
export default function CourseNavItem({ label, href = "#", end = false }) {
    return (
        <li className="list-none">
            <NavLink
                to={href}
                end={end}
                className={({ isActive: linkActive }) => 
                    `flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all duration-200 border-l-2 ${
                        linkActive 
                        ? "text-[#3C0078] border-[#3C0078] font-bold bg-[#3C0078]/5" 
                        : "text-gray-500 border-transparent hover:text-[#3C0078] hover:bg-[#3C0078]/5"
                    }`
                }
            >
                {({ isActive }) => (
                    <motion.div 
                        className="flex items-center w-full justify-between"
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <span>{label}</span>
                        {isActive && (
                            <motion.div 
                                layoutId="activeDot"
                                className="w-1 h-1 rounded-full bg-[#3C0078]"
                            />
                        )}
                    </motion.div>
                )}
            </NavLink>
        </li>
    );
}
