import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import NavTooltip from "./NavTooltip";

// Single navigation item used inside the SideMenu bar (bottom-left)
// Uses React Router so settings can open without a full page reload
export default function SideNavItem({ label, href = "/", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <NavTooltip label={label} position="right">
        <NavLink
          to={href}
          className={({ isActive }) =>
            `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-transparent ${isActive ? "bg-base-300 text-white" : ""} ${className}`.trim()
          }
          aria-label={label}
        >
          {/* Show the icon if provided, otherwise fall back to the text label */}
          {icon ?? <span className="text-sm font-medium">{label}</span>}
        </NavLink>
      </NavTooltip>
    </motion.li>
  );
}
