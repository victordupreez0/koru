import React from "react";
import { Link, useLocation } from "react-router-dom";
import CourseMenu from "../components/coursesMenu";
import CourseSecondaryNav from "../components/courseSecondaryNav";
import SideMenu from "../components/sideMenu";
import Menu from "../components/menu";
import ModuleAccordion from "../components/moduleAccordion";

/**
 * CourseContent Component
 *
 * Simple internal components to simulate the Home vs Modules view.
 */
function CourseHomeView() {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          User Experience Design 300 | Semester 1
        </h1>
        <p className="text-xl text-gray-700 mt-2">UX300</p>
      </header>

      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />
      {/* Left column – course overview with todo, next class & announcements */}
      <main className="space-y-12">
        <div className="w-full h-80 bg-[#D9D9D9] rounded-2xl shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <section>
            <h2 className="text-xl font-bold mb-4">Course Overview</h2>
            <div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide border-b border-black inline-block">
                Term 1:
              </h3>
              <p className="text-sm leading-relaxed text-gray-800 mt-2">
                Inclusive & Neurodiverse UX focuses on building a strong
                human-centred foundation for advanced UX practice. You will
                explore accessibility, inclusive design patterns, cognitive
                load, sensory design, and universal design thinking to better
                understand how diverse users experience digital products.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CourseModulesView() {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Third-tier Nav: Modules Accordion */}
      <div className="flex flex-col h-full border-r border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-8">Modules</h2>
        <ModuleAccordion />
      </div>

      {/* Main Content: Nested View with rounded border from screenshot */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-[#EAEAEA] p-12 rounded-[40px] border border-gray-300 shadow-sm relative">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              User Experience Design 300 | Semester 1
            </h1>
            <p className="text-lg text-gray-700 mt-1">UX300</p>
          </header>
          <div className="w-full h-64 bg-[#D9D9D9] rounded-2xl mb-8"></div>
          <section>
            <h3 className="text-lg font-bold mb-4">Course Overview</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  Term 1:
                </h4>
                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                  Inclusive & Neurodiverse UX focuses on building a strong
                  human-centred foundation...
                </p>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">
                  Term 2:
                </h4>
                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                  Inclusive & Neurodiverse UX focuses on building a strong
                  human-centred foundation...
                </p>
              </div>
            </div>
          </section>
          {/* Expand icon at bottom-right of the screenshot card */}
          <div className="absolute bottom-6 right-6 p-2 bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Courses Page Component
 *
 * Supports two main views based on current path:
 * 1. Home (/courses)
 * 2. Modules (/courses/modules)
 */
export default function Courses() {
  const location = useLocation();
  const isModulesPage = location.pathname.includes("/modules");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Leftmost Course Navigation Bar */}
      <div className="flex flex-col h-full py-8 px-4 items-center gap-6 ">
        <CourseMenu />
        <div className="mt-auto">
          <SideMenu />
        </div>
      </div>

      {/* Middle Section: Second Navigation Bar for course-internal links */}
      <div className="flex flex-col h-full border-r border-gray-200">
        <CourseSecondaryNav />
      </div>

      {/* Main Content Area: Replaced by Module View if on /modules */}
      {isModulesPage ? <CourseModulesView /> : <CourseHomeView />}
    </div>
  );
}
