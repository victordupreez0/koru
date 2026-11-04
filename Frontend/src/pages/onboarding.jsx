import React from "react";
import { Link } from "react-router-dom";
import AuthLayout, { AuthHeading } from "../components/AuthLayout";
import OnboardingButton from "../components/UI/onboardingButton";

import { GraduationCap, Presentation, ShieldCheck } from "lucide-react";

const ROLES = [
  {
    role: "Student",
    icon: GraduationCap,
    description: "Courses, assignments and grades",
  },
  {
    role: "Teacher",
    icon: Presentation,
    description: "Classes, materials and students",
  },
  {
    role: "Admin",
    icon: ShieldCheck,
    description: "Users, courses and platform settings",
  },
];

// Onboarding page – introduces the platform and routes users by role
export default function Onboarding() {
  return (
    <AuthLayout>
      <AuthHeading
        title="Welcome to Koru"
        subtitle="First, tell us who you are so we can take you to the right place."
      />

      <nav aria-label="Choose your role" className="flex flex-col gap-3">
        {ROLES.map((item) => (
          <OnboardingButton key={item.role} {...item} />
        ))}
      </nav>

      <p className="mt-8 text-center text-koru-label text-koru-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="rounded-koru-xs font-medium text-koru-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
        >
          Sign up for free
        </Link>
      </p>
    </AuthLayout>
  );
}
