import React from "react";

// Icon chip + heading used at the top of every profile panel.
export default function ProfileSectionHeader({ icon, children }) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
      <span className="rounded-koru-md bg-koru-primary-container p-2 text-koru-on-primary-container">
        {icon}
      </span>
      <h2 className="font-display text-koru-heading text-koru-on-surface">{children}</h2>
    </div>
  );
}
