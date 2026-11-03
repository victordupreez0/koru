import { forwardRef, useId } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: "h-10 pl-3 pr-10 text-sm",
  md: "h-12 pl-4 pr-11 text-sm",
  lg: "h-14 pl-4 pr-12 text-base",
};

/**
 * Material 3 style filled select with label, hint and error support.
 *
 * @param {"sm"|"md"|"lg"} size
 */
const Select = forwardRef(function Select(
  {
    id,
    label,
    error,
    hint,
    size = "md",
    required = false,
    className,
    containerClassName,
    labelClassName,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const message = error || hint;
  const messageId = message ? `${selectId}-message` : undefined;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label
          htmlFor={selectId}
          className={cn(
            "mb-1.5 flex items-center gap-1 text-koru-label text-koru-on-surface-variant",
            labelClassName,
          )}
        >
          {label}
          {required ? (
            <span className="text-koru-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            "w-full appearance-none rounded-koru-xs text-koru-on-surface shadow-koru-xs outline-none transition",
            "disabled:cursor-not-allowed disabled:bg-koru-surface-container disabled:opacity-60",
            error
              ? "bg-koru-error-container focus:bg-koru-error-container focus:ring-1 focus:ring-inset focus:ring-koru-error"
              : "bg-koru-surface-container-lowest hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary",
            SIZES[size] ?? SIZES.md,
            className,
          )}
          {...props}
        >
          {children}
        </select>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-koru-on-surface-variant"
        />
      </div>

      {message ? (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn(
            "mt-2 flex items-start gap-1.5 text-xs font-medium",
            error ? "text-koru-error" : "text-koru-on-surface-variant",
          )}
        >
          {error ? (
            <CircleAlert
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
          ) : null}
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
});

export default Select;
