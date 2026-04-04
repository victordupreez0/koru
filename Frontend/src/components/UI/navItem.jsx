import React from "react";
import { motion } from "framer-motion";

export default function NavItem({ label, href = "#", icon, className = "", variants }) {
  return (
    <motion.li variants={variants}>
      <a
        href={href}
        className={`rounded-full p-2 inline-flex items-center justify-center ${className}`.trim()}
        aria-label={label}
      >
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </a>
    </motion.li>
  );
}