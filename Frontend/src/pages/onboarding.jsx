import React from "react";
import OnboardBackground from "../assets/backgrounds/Onboarding.png";
import OnboardingButton from "../components/UI/onboardingButton";

// Role icons – displayed inside the onboarding selection buttons
import StudentIcon from "../assets/icons/Student.png";
import TeacherIcon from "../assets/icons/Teacher.png";
import AdminIcon from "../assets/icons/Administrator.png";

// Brand logo – shown in the onboarding welcome section
import Logo from "../assets/Logo.png";

// Onboarding page – introduces the platform and routes users by role
export default function Onboarding() {
  return (
    <div
      className="fixed inset-0 m-0 flex h-screen w-screen items-center justify-center overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${OnboardBackground})` }}
    >
      {/* Welcome section – displays the platform branding and tagline */}
      <div className="absolute top-[18%] left-[5%] z-10 flex flex-col">
        <h1>Welcome to </h1>
        <img
          src={Logo}
          alt="Learn Online logo"
          className="h-80 w-100 object-contain sm:h-75 sm:w-120"
        />
        <h2 className="text-left text-2xl text-black sm:text-3xl">
          Your Classroom, Reimagined.
        </h2>
      </div>

      {/* Role selection section – lets the user choose how they want to continue */}
      <div className="absolute bottom-[27%] right-[10%] z-10 flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold text-black sm:text-3xl">
          First tell us who you are
        </h2>

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