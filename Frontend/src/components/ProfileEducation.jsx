import React from "react";
import { GraduationCap } from "lucide-react";
import ChipListEditor from "./ChipListEditor";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Badge, Card, Input } from "./UI";

export default function ProfileEducation({ profile, editMode, updateProfile }) {
  return (
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
      <ProfileSectionHeader icon={<GraduationCap size={20} />}>Education Context</ProfileSectionHeader>

      {!editMode ? (
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-koru-heading text-koru-on-surface">
            {profile.education.institution || "No institution set"}
          </p>
          {profile.education.gpa && (
            <p className="text-koru-caption uppercase text-koru-primary">
              GPA: <span className="ml-1 text-sm text-koru-on-surface">{profile.education.gpa}</span>
            </p>
          )}

          <div className="mt-5 border-t border-koru-outline-faint pt-4">
            <p className="mb-3 text-koru-caption uppercase text-koru-on-surface-variant">Relevant Modules</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.education.modules && profile.education.modules.filter(Boolean).length > 0 ? (
                profile.education.modules.filter(Boolean).map((mod, index) => (
                  <Badge key={`module-${index}`} variant="primary">
                    {mod}
                  </Badge>
                ))
              ) : (
                <span className="text-xs italic text-koru-on-surface-variant">No academic modules added yet.</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
            <Input
              label="Institution"
              value={profile.education.institution}
              onChange={(e) => updateProfile("education.institution", e.target.value)}
              placeholder="Institution name"
            />
            <Input
              label="GPA"
              value={profile.education.gpa}
              onChange={(e) => updateProfile("education.gpa", e.target.value)}
              placeholder="GPA (e.g. 3.9)"
            />
          </div>

          <div className="mt-2 border-t border-koru-outline-faint pt-4">
            <ChipListEditor
              title="Relevant Modules"
              items={profile.education.modules}
              onChange={(value) => updateProfile("education.modules", value)}
              placeholder="Academic modules supporting your profile"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
