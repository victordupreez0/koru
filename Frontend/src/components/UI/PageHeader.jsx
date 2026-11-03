import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

/**
 * Shared page heading with optional breadcrumbs and right-aligned actions.
 *
 * @param {{ label: string, href?: string }[]} breadcrumbs
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className,
  ...props
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-2.5">
            <ol className="flex flex-wrap items-center gap-1.5 text-koru-caption font-medium tracking-wide text-koru-on-surface-variant">
              {breadcrumbs.map((item, index) => (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center gap-1.5"
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="text-koru-outline-variant"
                    >
                      /
                    </span>
                  ) : null}
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="transition-colors duration-150 ease-koru-out hover:text-koru-primary"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-koru-on-surface">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {eyebrow ? (
          <p className="mb-1.5 text-koru-caption font-medium uppercase tracking-[0.18em] text-koru-primary">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="font-display text-koru-title text-koru-on-surface">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-koru-body text-koru-on-surface-variant">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
