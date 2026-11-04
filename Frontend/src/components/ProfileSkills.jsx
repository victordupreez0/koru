import React from "react";
import { Sparkles } from "lucide-react";
import ChipListEditor from "./ChipListEditor";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Badge, Card } from "./UI";

export default function ProfileSkills({ skillGroups, editMode, updateProfile }) {
  return (
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
      <ProfileSectionHeader icon={<Sparkles size={20} />}>Skills Matrix</ProfileSectionHeader>

      {editMode ? (
        <div className="grid gap-6 md:grid-cols-3">
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
        <div className="grid gap-4 md:grid-cols-3">
          {skillGroups.map((group) => (
            <Card key={group.key} variant="outlined" tone="low" padding="sm" radius="lg">
              <p className="text-koru-caption uppercase text-koru-on-surface-variant">{group.label}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.items.length > 0 ? (
                  group.items.map((item, index) => (
                    <Badge key={`${group.key}-${index}`} variant="primary">
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs italic text-koru-on-surface-variant">No skills listed.</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
