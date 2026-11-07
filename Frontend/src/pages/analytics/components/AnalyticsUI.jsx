import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge, Card, Select } from "../../../components/UI";
import DashboardStatTile from "../../../components/UI/dashboardStatTile";
import { cn } from "../../../utils/cn";
import { rise, scoreTone, th } from "./analyticsStyles";

/* ─── count-up number: animates from the last value to the new one ─── */
export function CountUp({ value, decimals = 0, suffix = "" }) {
  const reduce = useReducedMotion();
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return undefined;
    const controls = animate(from.current, target, {
      duration: 0.9,
      ease: [0.2, 0, 0, 1],
      onUpdate: v => setDisplay(v),
    });
    from.current = target;
    return () => controls.stop();
  }, [target, reduce]);

  return (
    <span className="tabular-nums">
      {(reduce ? target : display).toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ─── page header ─── */
export function AnalyticsHeader({ title, subtitle, actions }) {
  return (
    <motion.header variants={rise} className="flex flex-wrap items-end justify-between gap-4 pt-2">
      <div className="min-w-0">
        <h1 className="font-display text-koru-title text-koru-on-surface">
          {title}
          <span className="text-koru-primary">.</span>
        </h1>
        {subtitle && <p className="mt-1 text-koru-body text-koru-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.header>
  );
}

/* ─── vivid stat tiles, same as the dashboards, with counting values ─── */
export function StatTiles({ stats, loading = false }) {
  return (
    <motion.div variants={rise} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(s => (
        <DashboardStatTile
          key={s.label}
          icon={s.icon}
          label={s.label}
          variant={s.variant}
          hint={s.hint}
          suffix={s.suffix}
          loading={loading}
          value={typeof s.value === "number" ? <CountUp value={s.value} decimals={s.decimals} /> : s.value}
        />
      ))}
    </motion.div>
  );
}

/* ─── section surface ─── */
export function Panel({ title, description, action, children, className, padding = "lg", bodyClassName, ...props }) {
  return (
    <Card
      as={motion.section}
      variants={rise}
      variant="outlined"
      tone="surface"
      radius="lg"
      padding="none"
      className={cn("flex flex-col bg-koru-surface-container-lowest", className)}
      {...props}
    >
      {(title || action) && (
        <div className={cn("flex items-start justify-between gap-3", padding === "lg" ? "px-6 pt-6" : "px-5 pt-5")}>
          <div className="min-w-0">
            {title && <h2 className="font-display text-koru-heading text-koru-on-surface">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-koru-on-surface-variant">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(padding === "lg" ? "p-6" : "p-5", (title || action) && "pt-4", bodyClassName)}>{children}</div>
    </Card>
  );
}

export function SectionLabel({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-koru-heading text-koru-on-surface">{children}</h2>
      {action}
    </div>
  );
}

/* ─── trend chip ─── */
export function DeltaBadge({ value, suffix = "%", size = "sm" }) {
  const v = Number(value) || 0;
  const variant = v > 0 ? "success" : v < 0 ? "error" : "neutral";
  const Icon = v > 0 ? TrendingUp : v < 0 ? TrendingDown : Minus;
  return (
    <Badge variant={variant} size={size} className="gap-1 tabular-nums">
      <Icon size={12} aria-hidden="true" />
      {v > 0 ? "+" : v < 0 ? "−" : ""}
      {Math.abs(v)}
      {suffix}
    </Badge>
  );
}

/* ─── score meter for table cells ─── */
const METER_FILL = { success: "bg-koru-success", warning: "bg-koru-accent", error: "bg-koru-error", neutral: "bg-koru-outline" };
const METER_TEXT = { success: "text-koru-success", warning: "text-koru-accent-ink", error: "text-koru-error", neutral: "text-koru-on-surface-variant" };

export function ScoreMeter({ value, label, tone }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const t = tone ?? scoreTone(pct);
  return (
    <div className="flex min-w-[96px] items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-koru-pill bg-koru-surface-container-highest">
        <motion.div
          className={cn("h-full rounded-koru-pill", METER_FILL[t])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0, 1] }}
        />
      </div>
      <span className={cn("w-12 text-right text-sm font-semibold tabular-nums", METER_TEXT[t])}>{label ?? `${Math.round(pct)}%`}</span>
    </div>
  );
}

/* ─── tables ─── */
export function DataTable({ columns, children }) {
  return (
    <div className="-mx-6 -mb-6 overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-koru-surface-container-low">
            {columns.map(col => (
              <th key={col.label} className={cn(th, col.className)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* ─── filters: the Select primitive, aligned on a shared baseline ─── */
export function FilterSelect({ label, value, onChange, options, className }) {
  // Select's root is w-full, so the width lives on this wrapper.
  return (
    <div className={cn("shrink-0", className)}>
      <Select
        size="sm"
        label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        labelClassName="text-koru-caption uppercase tracking-wider"
        className="cursor-pointer truncate font-medium"
      >
        {options.map(o => {
          const opt = typeof o === "object" ? o : { value: o, label: o };
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </Select>
    </div>
  );
}

/* ─── empty placeholder inside a panel ─── */
export function PanelEmpty({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-koru-on-surface-variant">
      {Icon && (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-koru-surface-container-high text-koru-on-surface-variant">
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      {children}
    </div>
  );
}
