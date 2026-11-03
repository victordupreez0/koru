import { createElement } from "react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  neutral: "bg-koru-surface-container-high text-koru-on-surface-variant",
  primary: "bg-koru-primary-container text-koru-on-primary-container",
  secondary: "bg-koru-secondary-container text-koru-on-secondary-container",
  tertiary: "bg-koru-tertiary-container text-koru-on-tertiary-container",
  accent: "bg-koru-accent-soft text-koru-accent-ink",
  success: "bg-koru-success-soft text-koru-success",
  warning: "bg-koru-warning-soft text-koru-warning",
  error: "bg-koru-error-container text-koru-on-error-container",
  info: "bg-koru-info-soft text-koru-info",
};

const ALIASES = {
  danger: "error",
};

const DOTS = {
  neutral: "bg-koru-on-surface-variant",
  primary: "bg-koru-primary",
  secondary: "bg-koru-secondary",
  tertiary: "bg-koru-tertiary",
  accent: "bg-koru-accent",
  success: "bg-koru-success",
  warning: "bg-koru-warning",
  error: "bg-koru-error",
  info: "bg-koru-info",
};

const SIZES = {
  sm: "h-6 px-2.5 text-[11px]",
  md: "h-8 px-3 text-xs",
};

/**
 * Material 3 style tonal chip.
 *
 * @param {"neutral"|"primary"|"secondary"|"tertiary"|"accent"|"success"|"warning"|"error"|"info"} variant
 * @param {"sm"|"md"} size
 * @param {boolean} dot Render a leading status dot
 */
export default function Badge({
  as: Tag = "span",
  variant = "neutral",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}) {
  const resolvedVariant = ALIASES[variant] ?? variant;

  return createElement(
    Tag,
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-koru-pill font-medium leading-none",
        VARIANTS[resolvedVariant] ?? VARIANTS.neutral,
        SIZES[size] ?? SIZES.sm,
        className,
      ),
      ...props,
    },
    <>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            DOTS[resolvedVariant] ?? DOTS.neutral,
          )}
        />
      ) : null}
      {children}
    </>,
  );
}
