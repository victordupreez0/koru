import React from "react";
import { Briefcase } from "lucide-react";
import ChipListEditor from "./ChipListEditor";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Card } from "./UI";

export default function ProfileExperience({ experienceGroups, editMode, updateProfile }) {
  return (
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
      <ProfileSectionHeader icon={<Briefcase size={20} />}>Academic &amp; Practical Experience</ProfileSectionHeader>

      {!editMode ? (
        <div className="grid gap-6 md:grid-cols-2">
          {experienceGroups.map((group) => (
            <Card key={group.key} variant="outlined" tone="low" padding="md" radius="lg">
              <p className="mb-3 text-koru-caption uppercase text-koru-on-surface-variant">{group.label}</p>
              <ul className="space-y-3">
                {group.items && group.items.filter(Boolean).length > 0 ? (
                  group.items.filter(Boolean).map((item, index) => (
                    <li key={`${group.key}-${index}`} className="flex items-start gap-2.5 text-sm text-koru-on-surface">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-koru-primary" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs italic text-koru-on-surface-variant">No entries added yet.</li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {experienceGroups.map((group) => (
            <Card key={group.key} tone="muted" padding="md" radius="lg">
              <ChipListEditor
                title={group.label}
                items={group.items}
                onChange={(value) => updateProfile(`experience.${group.key}`, value)}
                placeholder={group.placeholder}
              />
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
