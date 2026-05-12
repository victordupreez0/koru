import React from "react";
import { BadgeCheck, UserRound } from "lucide-react";

export default function ProfileHeader({ profile, roleLabel }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.1)] backdrop-blur-md">
      <div className="flex flex-wrap items-start gap-4">
        {profile.header.photoUrl ? (
          <img
            src={profile.header.photoUrl}
            alt="Profile"
            className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3C0078]/20 to-[#6f2ac8]/20 text-[#3C0078]">
            <UserRound size={28} />
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-3xl font-bold">{profile.header.fullName}</h2>
          <p className="mt-1 text-sm font-semibold text-[#3C0078]">{profile.header.headline}</p>
          <p className="mt-1 text-sm text-slate-600">
            {profile.header.major} | {profile.header.degree} |{" "}
            {profile.header.expectedGraduation}
          </p>
          {profile.header.email ? (
            <p className="mt-1 text-sm text-slate-600">{profile.header.email}</p>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={14} /> {roleLabel} Profile
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{profile.header.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.badges.map((badge, index) => (
          <span
            key={`badge-${index}`}
            className="rounded-full border border-[#3C0078]/20 bg-white/75 px-3 py-1 text-xs font-semibold text-[#3C0078] shadow-sm"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
