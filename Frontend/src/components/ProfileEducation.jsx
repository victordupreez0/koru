import React from "react";
import { GraduationCap } from "lucide-react";
import ChipListEditor from "./ChipListEditor";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]";
const INPUT_CLASS =
  "rounded-2xl border border-slate-300 bg-white/90 px-4 py-2.5 transition focus:border-[#3C0078] focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20";

export default function ProfileEducation({ profile, editMode, updateProfile }) {
  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap size={20} />
        <h2 className="text-2xl font-bold">Education Context</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
        <input
          value={profile.education.institution}
          onChange={(e) => updateProfile("education.institution", e.target.value)}
          disabled={!editMode}
          placeholder="Institution"
          className={`w-full ${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
        />
        <input
          value={profile.education.gpa}
          onChange={(e) => updateProfile("education.gpa", e.target.value)}
          disabled={!editMode}
          placeholder="GPA"
          className={`w-full ${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
        />
      </div>

      <div className="mt-4">
        <ChipListEditor
          title="Relevant Modules"
          items={profile.education.modules}
          onChange={(value) => updateProfile("education.modules", value)}
          placeholder="Academic modules supporting your profile"
        />
      </div>
    </section>
  );
}
