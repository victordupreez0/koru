import { createElement } from "react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  filled: "",
  elevated: "shadow-koru-sm",
  outlined: "ring-1 ring-inset ring-koru-outline-variant",
  interactive:
    "transition duration-200 ease-koru-out hover:-translate-y-0.5 hover:shadow-koru-sm",
};

const ALIASES = {
  default: "filled",
};

const TONES = {
  neutral: "bg-koru-surface-container-high",
  muted: "bg-koru-surface-container",
  low: "bg-koru-surface-container-low",
  surface: "bg-koru-surface",
  brand: "bg-koru-primary-container",
  secondary: "bg-koru-secondary-container",
  tertiary: "bg-koru-tertiary-container",
  accent: "bg-koru-accent-soft",
  info: "bg-koru-info-soft",
  success: "bg-koru-success-soft",
  warning: "bg-koru-warning-soft",
  error: "bg-koru-error-container",
};

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  xl: "p-8",
};

const RADII = {
  md: "rounded-koru-md",
  lg: "rounded-koru-lg",
  xl: "rounded-koru-xl",
  "2xl": "rounded-koru-2xl",
  "3xl": "rounded-koru-3xl",
};

/**
 * Material 3 style card surface.
 *
 * @param {"filled"|"elevated"|"outlined"|"interactive"} variant
 * @param {"neutral"|"muted"|"low"|"surface"|"brand"|"secondary"|"tertiary"|"accent"|"info"|"success"|"warning"|"error"} tone
 * @param {"none"|"sm"|"md"|"lg"|"xl"} padding
 * @param {"md"|"lg"|"xl"|"2xl"|"3xl"} radius
 */
export default function Card({
  as: Tag = "div",
  variant = "filled",
  tone = "neutral",
  padding = "md",
  radius = "md",
  className,
  children,
  ...props
}) {
  const resolvedVariant = ALIASES[variant] ?? variant;

  return createElement(
    Tag,
    {
      className: cn(
        RADII[radius] ?? RADII.md,
        TONES[tone] ?? TONES.neutral,
        VARIANTS[resolvedVariant] ?? VARIANTS.filled,
        PADDING[padding] ?? PADDING.md,
        className,
      ),
      ...props,
    },
    children,
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn("mb-3 flex items-start justify-between gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "font-display text-koru-heading text-koru-on-surface",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        "mt-1 text-sm leading-relaxed text-koru-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "text-sm leading-6 text-koru-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn("mt-5 flex items-center justify-end gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
