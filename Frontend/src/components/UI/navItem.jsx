import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NavItem({ label, href = "#", icon, filledIcon, className = "", variants, isActive, onClick }) {
  return (
    <motion.li variants={variants} className="relative">
      {/* Animated liquid pill background */}
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-purple-400 rounded-full"
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

      <Link
        to={href}
        className={`relative z-10 rounded-full px-5 py-3 inline-flex items-center justify-center select-none
          ${isActive ? "text-black" : "text-gray-400"}
          ${className}`.trim()}
        style={{ WebKitTapHighlightColor: "transparent", color: isActive ? "white" : undefined }}
        aria-label={label}
      >
        {isActive && filledIcon ? filledIcon : (icon ?? <span className="text-sm font-medium">{label}</span>)}
      </Link>
    </motion.li>
  );
}