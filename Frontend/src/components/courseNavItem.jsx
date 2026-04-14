import React from "react";
import { NavLink } from "react-router-dom";

/**
 * CourseNavItem Component
 * 
 * Individual link item used in the CourseSecondaryNav bar.
 * Features a vertical border (black when active, transparent when not) 
 * on the left side to highlight the current section.
 */
export default function CourseNavItem({ label, href = "#", isActive = false }) {
    return (
        <li className="list-none">
            <NavLink
                to={href}
                className={({ isActive: linkActive }) => 
                    `flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all duration-200 border-l-2 ${
                        linkActive 
                        ? "text-black border-black font-semibold bg-gray-100/50" 
                        : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50"
                    }`
                }
            >
                {label}
            </NavLink>
        </li>
    );
}
