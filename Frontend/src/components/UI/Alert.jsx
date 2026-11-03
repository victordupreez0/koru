import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../utils/cn";

const VARIANTS = {
  error: {
    className: "bg-koru-error-container text-koru-on-error-container",
    icon: CircleAlert,
  },
  success: {
    className: "bg-koru-success-soft text-koru-success",
    icon: CircleCheck,
  },
  warning: {
    className: "bg-koru-warning-soft text-koru-warning",
    icon: TriangleAlert,
  },
  info: {
    className: "bg-koru-info-soft text-koru-info",
    icon: Info,
  },
};

/**
 * Inline feedback surface for errors, successes, warnings and information.
 *
 * @param {"error"|"success"|"warning"|"info"} variant
 */
export default function Alert({
  variant = "info",
  title,
  children,
  className,
  ...props
}) {
  const config = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = config.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-koru-md px-4 py-3 text-sm",
        config.className,
        className,
      )}
      {...props}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className={title ? "mt-0.5" : undefined}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
