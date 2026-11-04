import React from "react";
import { BadgeCheck } from "lucide-react";
import { Avatar, Badge, Card } from "./UI";

export default function ProfileHeader({ profile, roleLabel }) {
  return (
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl" className="relative overflow-hidden">
      <div className="flex flex-wrap items-start gap-5">
        <Avatar
          size="xl"
          src={profile.header.photoUrl || undefined}
          seed={profile.header.email || profile.header.fullName}
          name={profile.header.fullName}
        />

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-koru-title text-koru-on-surface">{profile.header.fullName || "Name Not Set"}</h2>
          <p className="mt-1.5 text-sm font-medium text-koru-primary">{profile.header.headline || "Headline Not Set"}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-koru-caption uppercase text-koru-on-surface-variant">
            <span>{profile.header.major || "No Faculty"}</span>
            {profile.header.degree && (
              <>
                <span className="select-none text-koru-outline">•</span>
                <span>{profile.header.degree}</span>
              </>
            )}
            {profile.header.expectedGraduation && (
              <>
                <span className="select-none text-koru-outline">•</span>
                <span>Class of {profile.header.expectedGraduation}</span>
              </>
            )}
          </div>
          {profile.header.email ? (
            <p className="mt-2 text-xs text-koru-on-surface-variant">{profile.header.email}</p>
          ) : null}
        </div>

        <Badge variant="success">
          <BadgeCheck size={12} /> {roleLabel} Profile
        </Badge>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-koru-on-surface-variant">{profile.header.summary || "No professional summary set."}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {profile.badges.map((badge, index) => (
          <Badge key={`badge-${index}`} variant="primary">
            {badge}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
