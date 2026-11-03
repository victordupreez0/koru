import { cn } from "../../utils/cn";

const SIZES = {
  sm: "px-5 py-8",
  md: "px-6 py-12",
};

const ICON_TONES = {
  primary: "bg-koru-primary-container text-koru-on-primary-container",
  secondary: "bg-koru-secondary-container text-koru-on-secondary-container",
  tertiary: "bg-koru-tertiary-container text-koru-on-tertiary-container",
  accent: "bg-koru-accent-soft text-koru-accent-ink",
  info: "bg-koru-info-soft text-koru-info",
  success: "bg-koru-success-soft text-koru-success",
  warning: "bg-koru-warning-soft text-koru-warning",
};

/**
 * Consistent empty/zero-data state with an optional action.
 *
 * @param {"sm"|"md"} size
 * @param {"primary"|"secondary"|"tertiary"|"accent"|"info"|"success"|"warning"} tone
 */
export default function EmptyState({
  icon,
  title = "Nothing here yet",
  description,
  action,
  size = "md",
  tone = "primary",
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-koru-md bg-koru-surface-container-low text-center",
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...props}
    >
      {icon ? (
        <div
          className={cn(
            "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
            ICON_TONES[tone] ?? ICON_TONES.primary,
          )}
        >
          {icon}
        </div>
      ) : null}

      <h3 className="font-display text-koru-heading text-koru-on-surface">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-koru-body text-koru-on-surface-variant">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
