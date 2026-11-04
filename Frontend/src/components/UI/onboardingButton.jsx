import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Default routes – each role button navigates to its own login portal
const defaultRoutes = {
  student: "/student/login",
  teacher: "/teacher/login",
  admin: "/admin/login",
};

const TONES = {
  student: "bg-koru-primary-container text-koru-primary",
  teacher: "bg-koru-info-soft text-koru-role-teacher",
  admin: "bg-koru-tertiary-container text-koru-role-admin",
};

// Reusable onboarding button – a role row that links to the correct login portal
export default function OnboardingButton({ role, icon, description, to }) {
  const Icon = icon;
  const key = (role || "").toLowerCase();
  const destination = to || defaultRoutes[key] || "/";

  return (
    <Link
      to={destination}
      className="group flex items-center gap-4 rounded-koru-xl bg-koru-surface-container-lowest p-3 pr-4 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint transition duration-200 ease-koru-out hover:-translate-y-0.5 hover:shadow-koru-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-koru-lg transition-transform duration-200 ease-koru-out group-hover:scale-105 ${TONES[key] ?? TONES.student}`}
      >
        <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-koru-body font-medium text-koru-on-surface">
          {role}
        </span>
        {description ? (
          <span className="mt-0.5 block text-koru-caption text-koru-on-surface-variant">
            {description}
          </span>
        ) : null}
      </span>

      <ChevronRight
        size={18}
        aria-hidden="true"
        className="shrink-0 text-koru-on-surface-variant transition-transform duration-200 ease-koru-out group-hover:translate-x-0.5 group-hover:text-koru-primary"
      />
    </Link>
  );
}
