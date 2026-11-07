import React from "react";
import { Copy, ExternalLink, Link as LinkIcon, Upload, UserRound } from "lucide-react";
import ChipListEditor from "./ChipListEditor";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Button, Card, Input } from "./UI";
import { TEXTAREA_CLASS, TEXTAREA_LABEL_CLASS } from "../pages/profile/profileConfig";
import { ensureHttps, slugify } from "../pages/profile/profileUtils";


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
      <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
        <ProfileSectionHeader icon={<UserRound size={20} />}>Header &amp; Identity</ProfileSectionHeader>

        {editMode ? (
          <div className="grid gap-4">
            <Input
                label="Full Name"
                value={profile.header.fullName}
                onChange={(e) => updateProfile("header.fullName", e.target.value)}
                placeholder="Full name"
              />
            <Input
                label="Professional Headline"
                value={profile.header.headline}
                onChange={(e) => updateProfile("header.headline", e.target.value)}
                placeholder="Professional headline"
              />
            <Input
                label="Major / Faculty"
                value={profile.header.major}
                onChange={(e) => updateProfile("header.major", e.target.value)}
                placeholder="Major / Faculty"
              />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Degree"
                value={profile.header.degree}
                onChange={(e) => updateProfile("header.degree", e.target.value)}
                placeholder="Degree"
              />
              <Input
                label="Graduation Year"
                value={profile.header.expectedGraduation}
                onChange={(e) => updateProfile("header.expectedGraduation", e.target.value)}
                placeholder="Expected graduation"
              />
            </div>
            <Input
                label="Email Address"
                value={profile.header.email}
                onChange={(e) => updateProfile("header.email", e.target.value)}
                placeholder="Email"
              />
            <Input
                label="Profile Photo URL"
                value={profile.header.photoUrl}
                onChange={(e) => updateProfile("header.photoUrl", e.target.value)}
                placeholder="Profile photo URL (or upload below)"
              />
            <div className="flex flex-col gap-2">
              <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-koru-pill bg-transparent px-4 text-sm font-medium text-koru-primary ring-1 ring-inset ring-koru-outline transition hover:bg-koru-primary/8 focus-within:ring-2 focus-within:ring-koru-focus">
                <Upload size={14} />
                <span>Upload profile image</span>
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
                <p className="text-xs text-koru-on-surface-variant">Uploaded: {profile.header.photoName}</p>
              ) : null}
            </div>
            <div>
              <label className={TEXTAREA_LABEL_CLASS}>Professional Summary</label>
              <textarea
                value={profile.header.summary}
                onChange={(e) => updateProfile("header.summary", e.target.value)}
                rows={4}
                placeholder="2-3 sentence professional summary visible to recruiters"
                className={TEXTAREA_CLASS}
              />
            </div>
            <ChipListEditor
              title="Verified Digital Badges"
              items={profile.badges}
              onChange={(value) => updateProfile("badges", value)}
              placeholder="Dean's List, Python Certification"
            />
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-koru-on-surface-variant">Turn on Edit Profile to update identity details.</p>
        )}
      </Card>

      {/* Share & Visibility */}
      <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
        <ProfileSectionHeader icon={<LinkIcon size={20} />}>Share &amp; Visibility</ProfileSectionHeader>

        <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-koru-lg bg-koru-surface-container p-4 transition-colors duration-200 hover:bg-koru-surface-container-high">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-koru-on-surface">Public Profile Visibility</span>
            <span className="text-koru-caption text-koru-on-surface-variant">Allow search engines and recruiters to find you</span>
          </div>
          <input
            type="checkbox"
            checked={profile.privacy.profilePublic}
            onChange={() => toggleVisibility("profilePublic")}
            className="h-5 w-5 cursor-pointer accent-koru-primary shrink-0"
          />
        </label>

        <div className="space-y-2">
          {privacySectionConfig.map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-koru-md bg-koru-surface-container-low px-3.5 py-2.5 text-sm transition-colors duration-200 hover:bg-koru-surface-container"
            >
              <span className="text-xs font-medium text-koru-on-surface">{label}</span>
              <input
                type="checkbox"
                checked={profile.privacy[key]}
                onChange={() => toggleVisibility(key)}
                className="h-4 w-4 cursor-pointer accent-koru-primary shrink-0"
              />
            </label>
          ))}
        </div>

        {editMode ? (
          <div className="mt-4">
            <Input
              label="Vanity URL slug"
              value={profile.vanityUrlSlug}
              onChange={(e) => updateProfile("vanityUrlSlug", slugify(e.target.value))}
              placeholder="e.g. johndoe"
            />
          </div>
        ) : null}

        <div className="mt-6 rounded-koru-lg bg-koru-primary-container p-4">
          <p className="text-koru-caption uppercase text-koru-on-primary-container">
            Shareable Link
          </p>
          <p className="mt-1.5 select-all break-all rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 font-mono text-xs text-koru-on-surface">{shareUrl}</p>
          <Button variant="outlined" size="sm" className="mt-3.5" onClick={copyShareUrl} startIcon={<Copy size={13} />}>
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </Button>
        </div>
      </Card>

      {/* External Portfolios */}
      <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
        <ProfileSectionHeader icon={<ExternalLink size={20} />}>External Portfolios</ProfileSectionHeader>
        <div className="grid gap-4">
          {linkFieldConfig.map(({ key, label, placeholder }) => (
            <Input
              key={key}
              label={label}
              value={profile.links[key]}
              onChange={(e) => updateProfile(`links.${key}`, ensureHttps(e.target.value))}
              disabled={!editMode}
              placeholder={placeholder}
            />
          ))}
        </div>
      </Card>
    </aside>
  );
}
