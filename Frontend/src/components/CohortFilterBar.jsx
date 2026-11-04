import { Users } from "lucide-react";

/**
 * Reusable cohort pill-tab filter bar.
 * Renders nothing when there are no cohorts (course not split into groups).
 */
export default function CohortFilterBar({ cohorts = [], selected, onChange }) {
  if (!cohorts || cohorts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant flex items-center gap-1 shrink-0">
        <Users size={12} /> Group
      </span>
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-koru-pill text-koru-caption font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
          selected === null
            ? "bg-koru-primary text-koru-on-primary shadow-koru-xs"
            : "bg-koru-surface-container-high text-koru-on-surface-variant hover:bg-koru-surface-container-highest"
        }`}
      >
        All
      </button>
      {cohorts.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`px-3 py-1.5 rounded-koru-pill text-koru-caption font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
            selected === c.id
              ? "bg-koru-primary text-koru-on-primary shadow-koru-xs"
              : "bg-koru-surface-container-high text-koru-on-surface-variant hover:bg-koru-surface-container-highest"
          }`}
        >
          {c.name}
          {c.studentCount != null && (
            <span className="ml-1 opacity-60">· {c.studentCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
