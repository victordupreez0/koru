import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Eases its children into focus on mount. Once done the filter and transform are
 * removed entirely: even blur(0) softens text and breaks backdrop blur.
 */
export default function Emerge({ children, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  const initial = reduce
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.97, y: 16, filter: "blur(8px)" };
  const animate = reduce
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      transition={{ duration: reduce ? 0.3 : 0.95, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        const el = ref.current;
        if (!el) return;
        el.style.removeProperty("filter");
        el.style.removeProperty("transform");
      }}
    >
      {children}
    </motion.div>
  );
}
