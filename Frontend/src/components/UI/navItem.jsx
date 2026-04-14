import React from "react";
import { motion } from "framer-motion";

export default function NavItem({ label, href = "#", icon, className = "", variants, isActive, onClick }) {
  return (
    <motion.li variants={variants} className="relative">
      {/* Animated liquid pill background */}
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-gray-200/70 rounded-full"
          transition={{
            layout: {
              type: "spring",
              stiffness: 400,
              damping: 28,
              mass: 0.9,
            },
          }}
          style={{ zIndex: 0, originX: 0.5, originY: 0.5 }}
        />
      )}

      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        className={`relative z-10 rounded-full px-5 py-3 inline-flex items-center justify-center select-none
          ${isActive ? "text-black" : "text-gray-400"}
          ${className}`.trim()}
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label={label}
      >
        {icon ?? <span className="text-sm font-medium">{label}</span>}
      </a>
    </motion.li>
  );
}