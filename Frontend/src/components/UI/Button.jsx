import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  filled:
    "bg-koru-primary text-koru-on-primary shadow-koru-xs hover:bg-koru-primary-hover hover:shadow-koru-sm active:bg-koru-primary-hover",
  tonal:
    "bg-koru-secondary-container text-koru-on-secondary-container hover:bg-koru-secondary-container/80 active:bg-koru-secondary-container/70",
  outlined:
    "bg-transparent text-koru-primary ring-1 ring-inset ring-koru-outline hover:bg-koru-primary/8 active:bg-koru-primary/12",
  text:
    "bg-transparent text-koru-primary hover:bg-koru-primary/8 active:bg-koru-primary/12",
  elevated:
    "bg-koru-surface-container-low text-koru-primary shadow-koru-sm hover:shadow-koru-md active:shadow-koru-sm",
  error:
    "bg-koru-error text-koru-on-error shadow-koru-xs hover:bg-koru-danger-hover hover:shadow-koru-sm",
  accent:
    "bg-koru-accent text-koru-ink shadow-koru-xs hover:bg-koru-accent-hover hover:shadow-koru-sm",
};

/* Older names remain valid so existing call sites keep working. */
const ALIASES = {
  primary: "filled",
  secondary: "tonal",
  outline: "outlined",
  ghost: "text",
  danger: "error",
};

const SIZES = {
  sm: "h-8 gap-1.5 rounded-koru-pill px-3 text-xs",
  md: "h-10 gap-2 rounded-koru-pill px-4 text-sm",
  lg: "h-14 gap-2.5 rounded-koru-pill px-6 text-base",
  icon: "h-10 w-10 rounded-koru-pill p-0",
};

const SPINNER_SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4 w-4",
  icon: "h-4 w-4",
};

/**
 * Material 3 style action primitive.
 *
 * @param {"filled"|"tonal"|"outlined"|"text"|"elevated"|"error"|"accent"} variant
 * @param {"sm"|"md"|"lg"|"icon"} size
 */
const Button = forwardRef(function Button(
  {
    className,
    variant = "filled",
    size = "md",
    type = "button",
    loading = false,
    startIcon,
    endIcon,
    fullWidth = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const resolvedVariant = ALIASES[variant] ?? variant;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap font-medium tracking-[0.01em]",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-koru-out active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 focus-visible:ring-offset-koru-surface",
        "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
        VARIANTS[resolvedVariant] ?? VARIANTS.filled,
        SIZES[size] ?? SIZES.md,
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            SPINNER_SIZES[size] ?? SPINNER_SIZES.md,
          )}
        />
      ) : (
        startIcon
      )}
      {children}
      {!loading && endIcon}
    </button>
  );
});

export default Button;
