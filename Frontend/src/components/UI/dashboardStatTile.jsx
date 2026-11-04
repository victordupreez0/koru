import { motion } from "framer-motion";
import Card from "./Card";
import Skeleton from "./Skeleton";

// Vivid fill + matching coloured glow per variant. The fill is a soft same-hue
// sheen (solid colour fading to 80%) so the tile reads as one colour.
const FILLS = {
  purple:
    "bg-linear-to-br from-koru-stat-violet to-koru-stat-violet/80 shadow-[0_14px_28px_-14px_var(--color-koru-stat-violet)]",
  orange:
    "bg-linear-to-br from-koru-stat-orange to-koru-stat-orange/80 shadow-[0_14px_28px_-14px_var(--color-koru-stat-orange)]",
  sky:
    "bg-linear-to-br from-koru-stat-sky to-koru-stat-sky/80 shadow-[0_14px_28px_-14px_var(--color-koru-stat-sky)]",
  emerald:
    "bg-linear-to-br from-koru-stat-green to-koru-stat-green/80 shadow-[0_14px_28px_-14px_var(--color-koru-stat-green)]",
  slate:
    "bg-linear-to-br from-koru-stat-slate to-koru-stat-slate/80 shadow-[0_14px_28px_-14px_var(--color-koru-stat-slate)]",
};

export default function DashboardStatTile({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  variant = "purple",
  loading = false,
}) {
  const fill = FILLS[variant] ?? FILLS.purple;

  return (
    <Card
      as={motion.div}
      variant="filled"
      padding="none"
      radius="lg"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`relative isolate overflow-hidden px-5 py-5 text-koru-on-primary ${fill}`}
    >
      {/* Oversized faded icon bleeding off the right edge. Opacity sits on the
          whole SVG (not the stroke colour) so overlapping strokes don't double up. */}
      {Icon && (
        <Icon
          size={104}
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-5 -right-4 -z-10 rotate-[-8deg] text-koru-on-primary opacity-20"
        />
      )}

      {/* Hint chip */}
      {hint && (
        <span className="absolute right-4 top-4 rounded-koru-pill bg-koru-on-primary/20 px-2 py-0.5 text-koru-caption font-medium text-koru-on-primary">
          {hint}
        </span>
      )}

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {loading ? (
          <Skeleton className="h-8 w-12 !bg-none !bg-koru-on-primary/25" />
        ) : (
          <>
            <span className="font-display text-3xl font-medium leading-none tabular-nums">
              {value}
            </span>
            {suffix && (
              <span className="text-sm font-medium text-koru-on-primary/85">{suffix}</span>
            )}
          </>
        )}
      </div>

      {/* Label */}
      <p className="mt-2 font-display text-koru-heading text-koru-on-primary">
        {label}
      </p>
    </Card>
  );
}
