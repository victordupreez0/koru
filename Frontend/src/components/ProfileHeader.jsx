import React from "react";
import { BadgeCheck, UserRound } from "lucide-react";

export default function ProfileHeader({ profile, roleLabel }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.1)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-start gap-4">
        {profile.header.photoUrl ? (
          <img
            src={profile.header.photoUrl}
            alt="Profile"
            className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9BE9EA]/25 to-[#14b8a6]/20 text-[#0f766e] dark:text-[#9BE9EA]">
            <UserRound size={28} />
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{profile.header.fullName}</h2>
          <p className="mt-1 text-sm font-semibold text-[#0f766e] dark:text-[#9BE9EA]">{profile.header.headline}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {profile.header.major} | {profile.header.degree} |{" "}
            {profile.header.expectedGraduation}
          </p>
          {profile.header.email ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profile.header.email}</p>
          ) : null}
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={14} /> {roleLabel} Profile
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">{profile.header.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.badges.map((badge, index) => (
          <span
            key={`badge-${index}`}
            className="rounded-full border border-[#9BE9EA]/30 bg-white/75 px-3 py-1 text-xs font-semibold text-[#0f766e] shadow-sm dark:bg-slate-800 dark:text-[#9BE9EA]"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
