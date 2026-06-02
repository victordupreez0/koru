import React from "react";
import { motion } from "framer-motion";

/**
 * KoruLogo component
 * Renders the animated Koru logo (either the square symbol or the full wide logo with text).
 * 
 * @param {string} className - Optional Tailwind or standard CSS class names.
 * @param {object} style - Inline styles for the svg wrapper.
 * @param {boolean} showText - Whether to render the full Koru text wordmark logo.
 */
export default function KoruLogo({ className = "", style = {}, showText = false }) {
  const viewBox = showText ? "0 0 1367 408" : "0 0 435 408";

  // The symbol paths and animations (reusable)
  const symbolContent = (
    <>
      {/* 1. Purple Rounded Rectangle (Center pillar - drawn first, at the back) */}
      <motion.g
        style={{
          transformOrigin: "136.578px 359.02px", // bottom-middle of the vertical pillar
        }}
        initial={{
          scaleY: 0,
          opacity: 0,
        }}
        animate={{
          scaleY: 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <rect
          x="63.2441"
          y="51.7881"
          width="146.668"
          height="307.232"
          rx="73.3342"
          fill="#3C0078"
        />
      </motion.g>

      {/* 2. Orange Rounded Rectangle (Right side - drawn second, overlaps purple) */}
      <motion.g
        style={{
          transformOrigin: "216.493px 307.231px", // stable absolute origin relative to SVG canvas
        }}
        initial={{
          rotate: 135, // starts at total 0° (vertical) when added to -135°
          scale: 0.1,
          opacity: 0,
        }}
        animate={{
          rotate: 0, // animates to group 0° -> final rect state of -135°
          scale: 1,
          opacity: 1,
        }}
        transition={{
          delay: 0.3,
          type: "spring",
          stiffness: 85,
          damping: 14,
        }}
      >
        <rect
          x="216.493"
          y="307.231"
          width="144.486"
          height="263.134"
          rx="72.243"
          transform="rotate(-135 216.493 307.231)"
          fill="#CE702D"
        />
      </motion.g>

      {/* 3. Teal Rounded Rectangle (Left side - drawn third, overlaps purple/orange) */}
      <motion.g
        style={{
          transformOrigin: "34px 123.483px", // stable absolute origin relative to SVG canvas
        }}
        initial={{
          rotate: 45, // starts at total 0° (vertical) when added to -45°
          scale: 0.1,
          opacity: 0,
        }}
        animate={{
          rotate: 0, // animates to group 0° -> final rect state of -45°
          scale: 1,
          opacity: 1,
        }}
        transition={{
          delay: 0.15,
          type: "spring",
          stiffness: 85,
          damping: 14,
        }}
      >
        <rect
          x="34"
          y="123.483"
          width="144.486"
          height="374.54"
          rx="72.243"
          transform="rotate(-45 34 123.483)"
          fill="#80BDBE"
        />
      </motion.g>

      {/* 4. Purple Decorative Diamond (Spins in last, drawn fourth at the front) */}
      <motion.g
        style={{
          transformOrigin: "173.721px 203.706px", // stable absolute origin
        }}
        initial={{
          scale: 0,
          opacity: 0,
          rotate: -180, // spins 180° into place
        }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0, // animates to group 0° -> final rect state of -45°
        }}
        transition={{
          delay: 0.55,
          type: "spring",
          stiffness: 110,
          damping: 12,
        }}
      >
        <rect
          x="173.721"
          y="203.706"
          width="62.5271"
          height="62.5271"
          rx="15"
          transform="rotate(-45 173.721 203.706)"
          fill="#3C0078"
        />
      </motion.g>
    </>
  );

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {/* If showText is true, shift all symbol shapes by exactly (+5px, +3.556px) 
          so they align pixel-perfectly with the wide wordmark coordinates */}
      {showText ? (
        <g transform="translate(5, 3.556)">
          {symbolContent}
        </g>
      ) : (
        symbolContent
      )}

      {/* 5. Animated Vector Koru Wordmark Text (Fades and slides in right after logo symbol) */}
      {showText && (
        <motion.path
          d="M501.6 277V342.2H431.6V63H501.6V172.2L587.2 63H669.6L566 194.6L682.4 342.6H600L525.2 247L501.6 277ZM677.431 233.4C677.431 170.2 728.631 119 791.831 119C855.031 119 906.231 170.2 906.231 233.4C906.231 296.2 855.031 347.8 791.831 347.8C728.631 347.8 677.431 296.2 677.431 233.4ZM843.031 233.4C843.031 204.6 821.031 179.4 791.831 179.4C762.631 179.4 740.631 204.6 740.631 233.4C740.631 261.8 762.631 287 791.831 287C821.031 287 843.031 261.8 843.031 233.4ZM936.547 221.8H936.947C940.947 167.4 986.547 125 1041.35 125H1076.15V186.6H1041.35C1022.15 186.6 1006.55 202.2 1006.55 221.4V343.8H936.547V221.8ZM1100.6 255V133.4H1170.6V255.4C1170.6 274.6 1186.2 290.6 1205.4 290.6C1224.6 290.6 1240.2 274.6 1240.2 255.4V133.4H1310.2V255H1309.8C1305.8 309.8 1260.2 352.2 1205.4 352.2C1150.6 352.2 1105 309.8 1101 255H1100.6Z"
          fill="#3C0078"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.65,
            duration: 0.45,
            ease: "easeOut",
          }}
        />
      )}
    </svg>
  );
}
