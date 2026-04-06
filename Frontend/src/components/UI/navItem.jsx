import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

export default function NavItem({ label, href = "/", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <NavLink
        to={href}
        className={({ isActive }) =>
          `rounded-full px-5 py-3 inline-flex items-center justify-center ${isActive ? "text-white bg-base-300" : ""} ${className}`.trim()
        }
        aria-label={label}
      >
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </NavLink>
    </motion.li>
  );
}