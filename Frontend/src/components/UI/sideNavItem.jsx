import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

// Single navigation item used inside the SideMenu bar (bottom-left)
// Uses React Router so settings can open without a full page reload
export default function SideNavItem({ label, href = "/", icon, filledIcon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <NavLink
        to={href}
        className={({ isActive }) =>
          `inline-flex flex-col items-center justify-center gap-1 p-2 rounded-full transition-colors hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${isActive ? "bg-koru-primary !text-koru-on-primary [&_svg]:!text-koru-on-primary" : ""} ${className}`.trim()
        }
        aria-label={label}
      >
        {({ isActive }) => (
          <>
            {/* Show the icon if provided, otherwise fall back to the text label */}
            <div className="flex items-center justify-center">
              {isActive && filledIcon ? filledIcon : (icon ?? <span className="text-sm font-medium">{label}</span>)}
            </div>
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </>
        )}
      </NavLink>
    </motion.li>
  );
}
