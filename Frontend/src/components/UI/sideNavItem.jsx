import React from "react";
import { motion } from "framer-motion";

// Single navigation item used inside the SideMenu bar (bottom-left)
// Renders a circular icon button with a hover state
// Props: label (accessible name), href (link target), icon (React element), variants (framer-motion)
export default function SideNavItem({ label, href = "#", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <a
        href={href}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-base-200 ${className}`.trim()}
        aria-label={label}
      >
        {/* Show the icon if provided, otherwise fall back to the text label */}
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </a>
    </motion.li>
  );
}
