import React from "react";
import { Briefcase } from "lucide-react";
import ChipListEditor from "./ChipListEditor";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/90";
// Changes are blocked on publicRoute by the parent's updateProfile.
export default function ProfileExperience({ experienceGroups, updateProfile }) {
  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <Briefcase size={20} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Academic &amp; Practical Experience</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {experienceGroups.map((group) => (
          <ChipListEditor
            key={group.key}
            title={group.label}
            items={group.items}
            onChange={(value) => updateProfile(`experience.${group.key}`, value)}
            placeholder={group.placeholder}
          />
        ))}
      </div>
    </section>
  );
}
