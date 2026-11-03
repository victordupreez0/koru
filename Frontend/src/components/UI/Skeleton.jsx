import { cn } from "../../utils/cn";

const VARIANTS = {
  rect: "rounded-koru-md",
  text: "h-3 rounded-koru-pill",
  circle: "rounded-full",
};

/**
 * Decorative loading placeholder. Marked aria-hidden so screen readers skip it;
 * announce loading state on the surrounding region instead.
 *
 * @param {"rect"|"text"|"circle"} variant
 */
export default function Skeleton({
  variant = "rect",
  width,
  height,
  className,
  style,
  ...props
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "koru-skeleton block bg-koru-surface-variant",
        VARIANTS[variant] ?? VARIANTS.rect,
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

/**
 * Multi-line text placeholder. The final line is shortened by default.
 */
export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
  ...props
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("space-y-2", className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "koru-skeleton block h-3 rounded-koru-pill bg-koru-surface-variant",
            index === lines - 1 && "w-3/5",
            lineClassName,
          )}
        />
      ))}
    </div>
  );
}
