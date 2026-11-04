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
          className="absolute inset-0 rounded-koru-pill bg-koru-primary"
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
        className={`relative z-10 rounded-koru-xl px-3 py-2 inline-flex flex-col items-center justify-center gap-1 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus
          ${isActive ? "text-koru-on-primary" : "text-koru-on-surface-variant"}
          ${className}`.trim()}
        style={{ WebKitTapHighlightColor: "transparent", color: isActive ? "var(--color-koru-on-primary)" : undefined }}
        aria-label={label}
      >
        <div className="flex items-center justify-center">
          {isActive && filledIcon ? filledIcon : (icon ?? <span className="text-sm font-medium">{label}</span>)}
        </div>
        <span className="text-[10px] font-medium leading-tight">{label}</span>
      </Link>
    </motion.li>
  );
}