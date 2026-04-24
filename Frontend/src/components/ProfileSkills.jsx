import React from "react";
import { Sparkles } from "lucide-react";
import ChipListEditor from "./ChipListEditor";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]";

export default function ProfileSkills({ skillGroups, editMode, updateProfile }) {
  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={20} />
        <h2 className="text-2xl font-bold">Skills Matrix</h2>
      </div>

      {editMode ? (
        <div className="grid gap-4 md:grid-cols-3">
          {skillGroups.map((group) => (
            <ChipListEditor
              key={group.key}
              title={group.label}
              items={group.items}
              onChange={(value) => updateProfile(`skills.${group.key}`, value)}
              placeholder={group.placeholder}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {skillGroups.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-700">{group.label}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item, index) => (
                  <span
                    key={`${group.key}-${index}`}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
