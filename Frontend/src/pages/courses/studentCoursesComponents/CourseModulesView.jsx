import React from "react";
import ModuleAccordion from "../../../components/moduleAccordion";

export default function CourseModulesView() {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Third-tier Nav: Modules Accordion */}
      <div className="flex flex-col h-full border-r border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-8">Modules</h2>
        <ModuleAccordion />
      </div>

      {/* Main Content: Nested View with rounded border from screenshot */}
      <div className="flex-1 p-8 overflow-y-auto pb-24 ">
        <div className="bg-white p-12 rounded-[40px] border-2 border-gray-300 shadow-sm relative">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">User Experience Design 300 | Semester 1</h1>
            <p className="text-lg text-gray-700 mt-1">UX300</p>
          </header>
          <div className="w-full h-64 bg-[#D9D9D9] rounded-2xl mb-8"></div>
          <section>
            <h3 className="text-lg font-bold mb-4">Course Overview</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">Term 1:</h4>
                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                  Inclusive & Neurodiverse UX focuses on building a strong human-centred foundation...
                </p>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide">Term 2:</h4>
                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                    Inclusive & Neurodiverse UX focuses on building a strong human-centred foundation...
                </p>
              </div>
            </div>
          </section>
          {/* Expand icon at bottom-right of the screenshot card */}
          <div className="absolute bottom-6 right-6 p-2 bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
