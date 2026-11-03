import { forwardRef, useId } from "react";
import { CircleAlert, Info } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-4 text-sm",
  lg: "h-14 px-4 text-base",
};

const ICONS = {
  sm: { start: "left-3", end: "right-3", inputStart: "pl-10", inputEnd: "pr-10" },
  md: { start: "left-3.5", end: "right-3.5", inputStart: "pl-11", inputEnd: "pr-11" },
  lg: { start: "left-4", end: "right-4", inputStart: "pl-12", inputEnd: "pr-12" },
};

/**
 * Material 3 style filled text field with hint/error support.
 *
 * @param {"sm"|"md"|"lg"} size
 * @param {React.ReactNode} labelAction Optional action rendered opposite the label
 */
const Input = forwardRef(function Input(
  {
    id,
    label,
    labelAction,
    error,
    hint,
    startIcon,
    endIcon,
    endAdornment,
    size = "md",
    required = false,
    className,
    containerClassName,
    labelClassName,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const message = error || hint;
  const messageId = message ? `${inputId}-message` : undefined;
  const iconSpacing = ICONS[size] ?? ICONS.md;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            htmlFor={inputId}
            className={cn(
              "flex items-center gap-1 text-koru-label text-koru-on-surface-variant",
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

          {labelAction ? (
            <span className="text-xs font-medium text-koru-primary">
              {labelAction}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        {startIcon ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center text-koru-on-surface-variant",
              iconSpacing.start,
            )}
          >
            {startIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            "w-full rounded-koru-xs text-koru-on-surface shadow-koru-xs outline-none transition",
            "placeholder:text-koru-on-surface-variant/70",
            "disabled:cursor-not-allowed disabled:bg-koru-surface-container disabled:opacity-60",
            "read-only:bg-koru-surface-container",
            error
              ? "bg-koru-error-container focus:bg-koru-error-container focus:ring-1 focus:ring-inset focus:ring-koru-error"
              : "bg-koru-surface-container-lowest hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary",
            SIZES[size] ?? SIZES.md,
            startIcon && iconSpacing.inputStart,
            (endIcon || endAdornment) && iconSpacing.inputEnd,
            className,
          )}
          {...props}
        />

        {endAdornment ? (
          <span
            className={cn(
              "absolute inset-y-0 z-10 flex items-center",
              iconSpacing.end,
            )}
          >
            {endAdornment}
          </span>
        ) : endIcon ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center text-koru-on-surface-variant",
              iconSpacing.end,
            )}
          >
            {endIcon}
          </span>
        ) : null}
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
          ) : (
            <Info
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-koru-on-surface-variant"
            />
          )}
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
});

export default Input;
