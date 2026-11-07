/* Shared motion and table styling for the analytics views. */
export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const rise = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } },
};

export function scoreTone(pct) {
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";
  return "error";
}

export const th = "whitespace-nowrap px-6 py-3 text-left text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant";
export const td = "whitespace-nowrap px-6 py-3.5 align-middle";
/* For the main text column, which may wrap. */
export const tdWrap = "px-6 py-3.5 align-middle";
export const tr = "border-t border-koru-outline-faint transition-colors hover:bg-koru-primary-subtle/60";
