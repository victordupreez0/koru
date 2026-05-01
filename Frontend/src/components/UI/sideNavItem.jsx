import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

// Single navigation item used inside the SideMenu bar (bottom-left)
// Uses React Router so settings can open without a full page reload
export default function SideNavItem({ label, href = "/", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <NavLink
        to={href}
        className={({ isActive }) =>
          `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-base-200 dark:hover:bg-slate-700 ${isActive ? "bg-base-300 dark:bg-slate-600 text-white" : "dark:text-slate-300"} ${className}`.trim()
        }
        aria-label={label}
      >
        {/* Show the icon if provided, otherwise fall back to the text label */}
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </NavLink>
    </motion.li>
  );
}
