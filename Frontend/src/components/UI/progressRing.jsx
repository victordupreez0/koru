import { motion } from "framer-motion";

export default function ProgressRing({
  percentage = 0,
  size = 180,
  strokeWidth = 14,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Ring layers for the concentric ring design
  const rings = [
    { r: radius, sw: strokeWidth, opacity: 0.12 },
    { r: radius - strokeWidth * 1.3, sw: strokeWidth * 0.8, opacity: 0.08 },
    { r: radius - strokeWidth * 2.4, sw: strokeWidth * 0.6, opacity: 0.05 },
  ];

  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background rings for depth effect */}
          {rings.map((ring, i) => (
            <circle
              key={`bg-${i}`}
              cx={size / 2}
              cy={size / 2}
              r={ring.r}
              fill="none"
              stroke="#9ca3af"
              strokeWidth={ring.sw}
              opacity={ring.opacity}
            />
          ))}

          {/* Main track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />

          {/* Animated fill arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3C0078" />
              <stop offset="100%" stopColor="#7B2FBE" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center percentage label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-3xl font-bold text-black dark:text-slate-100 font-['Gabarito']"
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
    </div>
  );
}
