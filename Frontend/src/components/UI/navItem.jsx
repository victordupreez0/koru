import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

// Single navigation item used inside the top Menu bar
// Uses React Router's NavLink so the active route gets highlighted automatically
// Props: label (accessible name), href (route path), icon (React element), variants (framer-motion)
export default function NavItem({ label, href = "/", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      {/* NavLink applies the "isActive" class when the current URL matches href */}
      <NavLink
        to={href}
        className={({ isActive }) =>
          `rounded-full px-5 py-3 inline-flex items-center justify-center ${isActive ? "text-white bg-base-300" : ""} ${className}`.trim()
        }
        aria-label={label}
      >
        {/* Show the icon if provided, otherwise fall back to the text label */}
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </NavLink>
    </motion.li>
  );
}