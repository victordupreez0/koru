import React from "react";
import { Copy, ExternalLink, Link as LinkIcon, Upload, UserRound } from "lucide-react";
import ChipListEditor from "./ChipListEditor";
import { ensureHttps, slugify } from "../pages/profile/profileUtils";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/90";
const INPUT_CLASS =
  "rounded-2xl border border-slate-300 bg-white/90 px-4 py-2.5 text-slate-900 transition placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function ProfileSidebar({
  profile,
  editMode,
  updateProfile,
  attachProfileImage,
  shareUrl,
  copied,
  copyShareUrl,
  toggleVisibility,
  privacySectionConfig,
  linkFieldConfig,
}) {
  return (
    <aside className="flex flex-col gap-6">
      {/* Header & Identity */}
      <section className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <UserRound size={20} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Header &amp; Identity</h2>
        </div>

        {editMode ? (
          <div className="grid gap-3">
            <input
              value={profile.header.fullName}
              onChange={(e) => updateProfile("header.fullName", e.target.value)}
              placeholder="Full name"
              className={`w-full ${INPUT_CLASS}`}
            />
            <input
              value={profile.header.headline}
              onChange={(e) => updateProfile("header.headline", e.target.value)}
              placeholder="Professional headline"
              className={`w-full ${INPUT_CLASS}`}
            />
            <input
              value={profile.header.major}
              onChange={(e) => updateProfile("header.major", e.target.value)}
              placeholder="Major / Faculty"
              className={`w-full ${INPUT_CLASS}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={profile.header.degree}
                onChange={(e) => updateProfile("header.degree", e.target.value)}
                placeholder="Degree"
                className={`w-full ${INPUT_CLASS}`}
              />
              <input
                value={profile.header.expectedGraduation}
                onChange={(e) => updateProfile("header.expectedGraduation", e.target.value)}
                placeholder="Expected graduation"
                className={`w-full ${INPUT_CLASS}`}
              />
            </div>
            <input
              value={profile.header.email}
              onChange={(e) => updateProfile("header.email", e.target.value)}
              placeholder="Email"
              className={`w-full ${INPUT_CLASS}`}
            />
            <input
              value={profile.header.photoUrl}
              onChange={(e) => updateProfile("header.photoUrl", e.target.value)}
              placeholder="Profile photo URL (or upload below)"
              className={`w-full ${INPUT_CLASS}`}
            />
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <Upload size={14} /> Upload profile image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const [file] = Array.from(e.target.files || []);
                  attachProfileImage(file);
                  e.target.value = "";
                }}
              />
            </label>
            {profile.header.photoName ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded: {profile.header.photoName}</p>
            ) : null}
            <textarea
              value={profile.header.summary}
              onChange={(e) => updateProfile("header.summary", e.target.value)}
              rows={4}
              placeholder="2-3 sentence professional summary visible to recruiters"
              className={`w-full ${INPUT_CLASS}`}
            />
            <ChipListEditor
              title="Verified Digital Badges"
              items={profile.badges}
              onChange={(value) => updateProfile("badges", value)}
              placeholder="Dean's List, Python Certification"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Turn on Edit Profile to update identity details.</p>
        )}
      </section>

      {/* Share & Visibility */}
      <section className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <LinkIcon size={20} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Share &amp; Visibility</h2>
        </div>

        <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/85 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Public Profile Visibility</span>
          <input
            type="checkbox"
            checked={profile.privacy.profilePublic}
            onChange={() => toggleVisibility("profilePublic")}
            className="h-4 w-4 accent-[#0f766e]"
          />
        </label>

        <div className="space-y-2">
          {privacySectionConfig.map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={profile.privacy[key]}
                onChange={() => toggleVisibility(key)}
                className="h-4 w-4 accent-[#0f766e]"
              />
            </label>
          ))}
        </div>

        {editMode ? (
          <>
            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">Vanity URL slug</label>
            <input
              value={profile.vanityUrlSlug}
              onChange={(e) => updateProfile("vanityUrlSlug", slugify(e.target.value))}
              className={`mt-1 w-full ${INPUT_CLASS}`}
            />
          </>
        ) : null}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 p-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Shareable Link
          </p>
          <p className="mt-1 break-all text-sm text-slate-700 dark:text-slate-100">{shareUrl}</p>
          <button
            type="button"
            onClick={copyShareUrl}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </section>

      {/* External Portfolios */}
      <section className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <ExternalLink size={20} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">External Portfolios</h2>
        </div>
        <div className="grid gap-3">
          {linkFieldConfig.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
              <input
                value={profile.links[key]}
                onChange={(e) => updateProfile(`links.${key}`, ensureHttps(e.target.value))}
                disabled={!editMode}
                placeholder={placeholder}
                className={`w-full ${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900`}
              />
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
