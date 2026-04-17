import React from "react";
import { Link } from "react-router-dom";

// Default routes – used when no custom destination is passed into the button
const defaultRoutes = {
  student: "/student/login",
  teacher: "/teacher/login",
  admin: "/admin/login",
};

// Reusable onboarding button – displays a role card and links to the correct page
export default function OnboardingButton({ role, icon, to }) {
  // Resolve the destination based on the selected role
  const key = (role || "").toLowerCase();
  const destination = to || defaultRoutes[key] || "/";

  return (
    <Link
      to={destination}
      className="group flex aspect-square w-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/20 bg-[#3C0078acc] text-white shadow-xl backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-[#9BE9EA] hover:bg-[#9BE9EA] sm:w-[220px] md:w-[250px]"
    >
      {/* Icon container – keeps the role image centered inside the card */}
      <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white/10">
        <img
          src={icon}
          alt={`${role} icon`}
          className="h-14 w-14 object-contain sm:h-17 sm:w-17"
        />
      </div>

      {/* Role label – shown below the icon */}
      <span className="text-center text-sm font-semibold sm:text-base">
        {role}
      </span>
    </Link>
  );
}