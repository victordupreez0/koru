import React from "react";
import OnboardBackground from "../assets/backgrounds/background-2.png";
import OnboardingButton from "../components/UI/onboardingButton";

// Role icons – displayed inside the onboarding selection buttons
import StudentIcon from "../assets/icons/Student.png";
import TeacherIcon from "../assets/icons/Teacher.png";
import AdminIcon from "../assets/icons/Administrator.png";

// Animated Koru branding
import KoruLogo from "../components/UI/KoruLogo";

// Onboarding page – introduces the platform and routes users by role
export default function Onboarding() {
  return (
    <div
      data-tts-root="true"
      className="fixed inset-0 m-0 flex h-screen w-screen items-center justify-center overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${OnboardBackground})` }}
    >
      {/* Welcome section – displays the platform branding and tagline */}
      <div className="absolute top-[12%] left-[6%] z-10 flex flex-col">
        <h1 className="!text-3xl text-slate-800 font-medium tracking-tight mb-4">Welcome to</h1>
        <div className="h-20 sm:h-24 flex items-center justify-start">
          <KoruLogo showText={true} className="h-full w-auto" />
        </div>
      </div>

      {/* Role selection section – lets the user choose how they want to continue */}
      <div className="absolute bottom-[27%] left-[5%] z-10 flex flex-col gap-6">
        <h1 className="text-center !text-2xl font-semibold text-black sm:text-3xl">
          First tell us who you are
        </h1>

        {/* Role buttons – direct each user type to the correct flow */}
        <div className="flex flex-row gap-4">
          <OnboardingButton role="Student" icon={StudentIcon} />
          <OnboardingButton role="Teacher" icon={TeacherIcon} />
          <OnboardingButton role="Admin" icon={AdminIcon} />
        </div>
      </div>
    </div>
  );
}