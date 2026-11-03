import React from "react";
import { Link } from "react-router-dom";

// Default routes – each role button navigates to its own login portal
const defaultRoutes = {
  student: "/student/login",
  teacher: "/teacher/login",
  admin: "/admin/login",
};

const TONES = {
  student: "bg-koru-primary-container text-koru-on-primary-container",
  teacher: "bg-koru-secondary-container text-koru-on-secondary-container",
  admin: "bg-koru-tertiary-container text-koru-on-tertiary-container",
};

// Reusable onboarding button – displays a role card and links to the correct page
export default function OnboardingButton({ role, icon, to }) {
  // Resolve the destination based on the selected role
  const key = (role || "").toLowerCase();
  const destination = to || defaultRoutes[key] || "/";

  return (
    <Link
      to={destination}
      className={`group flex aspect-square w-[180px] flex-col items-center justify-center gap-3 rounded-koru-2xl shadow-koru-sm backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:shadow-koru-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 sm:w-[220px] md:w-[200px] ${TONES[key] ?? TONES.student}`}
    >
      {/* Icon container – keeps the role image centered inside the card */}
      <div className="flex h-24 w-24 items-center justify-center">
        <img
          src={icon}
          alt={`${role} icon`}
          className="h-16 w-16 object-contain sm:h-24 sm:w-24"
        />
      </div>

      {/* Role label – shown below the icon */}
      <span className="text-center text-koru-label">
        {role}
      </span>
    </Link>
  );
}
