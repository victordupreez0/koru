import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cute animated tooltip that appears on hover.
 * position="bottom" → floats below the trigger (used in the top navbar)
 * position="right"  → floats to the right of the trigger (used in the side navbar)
 */
export default function NavTooltip({ label, children, position = "bottom" }) {
  const [visible, setVisible] = useState(false);

  const isBottom = position === "bottom";

  // Animate in from slightly above (bottom) or slightly left (right)
  const initial = isBottom
    ? { opacity: 0, y: -10, scale: 0.72 }
    : { opacity: 0, x: -10, scale: 0.72 };

  const animate = isBottom
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 1, x: 0, scale: 1 };

  const exit = isBottom
    ? { opacity: 0, y: -6, scale: 0.82 }
    : { opacity: 0, x: -6, scale: 0.82 };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            className={`absolute pointer-events-none z-[100] flex ${
              isBottom
                ? "flex-col items-center top-full mt-2"
                : "flex-row items-center left-full ml-2"
            }`}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ type: "spring", stiffness: 480, damping: 22, mass: 0.7 }}
          >
            {/* Arrow — points toward the icon */}
            {isBottom ? (
              <span className="w-2.5 h-2.5 bg-purple-400 rotate-45 rounded-sm -mb-1.5 shadow-sm" />
            ) : (
              <span className="w-2.5 h-2.5 bg-purple-400 rotate-45 rounded-sm -mr-1.5 shadow-sm" />
            )}

            {/* Label pill */}
            <span className="bg-purple-400 text-white text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap select-none">
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
