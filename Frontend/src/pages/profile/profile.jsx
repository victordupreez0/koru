import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import ProfileTopBar from "../../components/ProfileTopBar";
import ProfileSidebar from "../../components/ProfileSidebar";
import ProfileHeader from "../../components/ProfileHeader";
import ProfilePortfolio from "../../components/ProfilePortfolio";
import ProfileSkills from "../../components/ProfileSkills";
import ProfileExperience from "../../components/ProfileExperience";
import ProfileEducation from "../../components/ProfileEducation";
import ProfileLinks from "../../components/ProfileLinks";
import {
  LINK_FIELD_CONFIG,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_PDF_FILE_SIZE_BYTES,
  PRIVACY_SECTION_CONFIG,
  PROFILE_LAST_ROLE_KEY,
  PROFILE_STORAGE_PREFIX,
  PUBLIC_PROFILE_INDEX_KEY,
} from "./profileConfig";
import {
  buildDefaultProfile,
  fileToDataUrl,
  getExperienceGroups,
  getFileSizeError,
  getLinkEntries,
  getSkillGroups,
  isValidUrl,
  normalizeProfileSnapshot,
  persistProfileSnapshot,
  slugify,
} from "./profileUtils";
import { exportProfileToPdf } from "./profilePdf";

export default function Profile({ publicRoute = false }) {
  const { slug: routeSlug } = useParams();
  const { user: session, role } = useAuth();

  // Role & user scope
  const liveRoleScope = useMemo(() => {
    const raw = String(role || "").trim().toLowerCase();
    return raw === "teacher" || raw === "student" ? raw : "";
  }, [role]);

  const [stableRoleScope, setStableRoleScope] = useState(() => {
    const remembered = String(localStorage.getItem(PROFILE_LAST_ROLE_KEY) || "").trim().toLowerCase();
    return remembered === "teacher" || remembered === "student" ? remembered : "student";
  });

  useEffect(() => {
    if (!liveRoleScope) return;
    setStableRoleScope(liveRoleScope);
    localStorage.setItem(PROFILE_LAST_ROLE_KEY, liveRoleScope);
  }, [liveRoleScope]);

  const roleLabel = stableRoleScope === "teacher" ? "Teacher" : "Student";

  const liveUserScope = useMemo(
    () => String(session?.userId || session?.email || "").trim().toLowerCase(),
    [session?.userId, session?.email],
  );

  const [stableUserScope, setStableUserScope] = useState(liveUserScope || "anonymous");

  useEffect(() => {
    if (liveUserScope) setStableUserScope(liveUserScope);
  }, [liveUserScope]);

  const profileStorageKey = useMemo(
    () => `${PROFILE_STORAGE_PREFIX}.${stableUserScope}.${stableRoleScope}`,
    [stableUserScope, stableRoleScope],
  );

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [viewAsPublic, setViewAsPublic] = useState(publicRoute);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [publicNotFound, setPublicNotFound] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [profile, setProfile] = useState(() => buildDefaultProfile(stableRoleScope, session));

  // Derived values
  const shareUrl = useMemo(() => {
    const slug = slugify(profile.vanityUrlSlug) || "profile";
    return `${window.location.origin}/profile/${slug}`;
  }, [profile.vanityUrlSlug]);

  const linkEntries = useMemo(() => getLinkEntries(profile.links), [profile.links]);
  const skillGroups = useMemo(() => getSkillGroups(profile.skills), [profile.skills]);
  const experienceGroups = useMemo(
    () => getExperienceGroups(profile.experience, roleLabel),
    [profile.experience, roleLabel],
  );
  const validLinks = useMemo(
    () => linkEntries.filter(([, url]) => isValidUrl(url)),
    [linkEntries],
  );

  const effectivePrivacy = useMemo(() => {
    if (!viewAsPublic)
      return { header: true, portfolio: true, skills: true, experience: true, education: true, links: true };
    if (!profile.privacy.profilePublic)
      return { header: false, portfolio: false, skills: false, experience: false, education: false, links: false };
    return profile.privacy;
  }, [viewAsPublic, profile.privacy]);

  // Effects
  useEffect(() => {
    if (publicRoute) {
      setViewAsPublic(true);
      setEditMode(false);
    }
  }, [publicRoute]);

  useEffect(() => {
    setHasLoadedProfile(false);

    if (publicRoute) {
      try {
        const index = JSON.parse(localStorage.getItem(PUBLIC_PROFILE_INDEX_KEY) || "{}");
        const entry = index?.[routeSlug || ""];
        if (!entry?.storageKey) { setPublicNotFound(true); setHasLoadedProfile(true); return; }
        const parsed = JSON.parse(localStorage.getItem(entry.storageKey) || "null");
        if (!parsed) { setPublicNotFound(true); setHasLoadedProfile(true); return; }
        setPublicNotFound(false);
        setProfile(normalizeProfileSnapshot(parsed, stableRoleScope, session));
        setHasLoadedProfile(true);
      } catch {
        setPublicNotFound(true);
        setHasLoadedProfile(true);
      }
      return;
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(profileStorageKey) || "null");
      if (parsed) {
        setProfile(normalizeProfileSnapshot(parsed, stableRoleScope, session));
        setHasLoadedProfile(true);
        return;
      }
    } catch {
      // Malformed localStorage - fall back to defaults.
    }

    setProfile(buildDefaultProfile(stableRoleScope, session));
    setHasLoadedProfile(true);
  }, [
    publicRoute, routeSlug, profileStorageKey, stableRoleScope,
    session?.userId, session?.email, session?.firstName, session?.lastName, session?.profileImageUrl,
  ]);

  useEffect(() => {
    if (publicRoute || !hasLoadedProfile) return;

    const { error } = persistProfileSnapshot(profileStorageKey, profile, stableRoleScope, session);
    setSaveError(error);

    try {
      const slug = slugify(profile.vanityUrlSlug) || "profile";
      const index = JSON.parse(localStorage.getItem(PUBLIC_PROFILE_INDEX_KEY) || "{}");
      Object.keys(index).forEach((s) => {
        if (index[s]?.storageKey === profileStorageKey) delete index[s];
      });
      if (profile.privacy.profilePublic) {
        index[slug] = { storageKey: profileStorageKey, role: stableRoleScope, updatedAt: Date.now() };
      }
      localStorage.setItem(PUBLIC_PROFILE_INDEX_KEY, JSON.stringify(index));
    } catch {
      // Ignore index errors.
    }
  }, [publicRoute, hasLoadedProfile, profileStorageKey, profile, stableRoleScope]);

  // Handlers
  function updateProfile(path, value) {
    if (publicRoute) return;
    setProfile((current) => {
      const updated = { ...current };
      const keys = path.split(".");
      let target = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        target[keys[i]] = { ...target[keys[i]] };
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      const { error } = persistProfileSnapshot(profileStorageKey, updated, stableRoleScope, session);
      setSaveError(error);
      return updated;
    });
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }

  function toggleVisibility(key) {
    updateProfile(`privacy.${key}`, !profile.privacy[key]);
  }

  async function handlePdfExport() {
    try {
      setIsExporting(true);
      setSaveError("");
      const safeFileName = slugify(profile.header.fullName || "profile") || "profile";
      exportProfileToPdf(profile, roleLabel, validLinks, `${safeFileName}-cv`);
    } catch {
      setSaveError("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function attachProjectImage(index, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please upload a valid image file."); return; }
    const sizeError = getFileSizeError(file, MAX_IMAGE_FILE_SIZE_BYTES, "Image");
    if (sizeError) { setUploadError(sizeError); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      if (!profile.projects[index]) return;
      setUploadError("");
      updateProfile("projects", profile.projects.map((p, i) =>
        i === index ? { ...p, mediaUrl: dataUrl, mediaName: file.name } : p
      ));
    } catch {
      setUploadError("Unable to read the selected image. Please try a different file.");
    }
  }

  async function attachProjectDocument(index, file) {
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Please upload a PDF document."); return; }
    const sizeError = getFileSizeError(file, MAX_PDF_FILE_SIZE_BYTES, "PDF");
    if (sizeError) { setUploadError(sizeError); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      if (!profile.projects[index]) return;
      setUploadError("");
      updateProfile("projects", profile.projects.map((p, i) =>
        i === index ? { ...p, projectUrl: dataUrl, projectFileName: file.name } : p
      ));
    } catch {
      setUploadError("Unable to read the selected PDF. Please try a different file.");
    }
  }

  function onProjectImageDrop(index, event) {
    event.preventDefault();
    const [file] = Array.from(event.dataTransfer?.files || []);
    attachProjectImage(index, file);
  }

  async function attachProfileImage(file) {
    if (publicRoute || !file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please upload a valid profile image file."); return; }
    const sizeError = getFileSizeError(file, MAX_IMAGE_FILE_SIZE_BYTES, "Profile image");
    if (sizeError) { setUploadError(sizeError); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      updateProfile("header.photoUrl", dataUrl);
      updateProfile("header.photoName", file.name);
      setUploadError("");
    } catch {
      setUploadError("Unable to read the selected profile image. Please try a different file.");
    }
  }

  // Render
  return (
    <div data-tts-root="true" className="min-h-screen w-full pb-10 text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl dark:bg-[#9BE9EA]/10" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-purple-100/30 blur-3xl dark:bg-teal-400/10" />
      </div>
      <Menu />
      <SideMenu />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 lg:px-4">
        <ProfileTopBar
          editMode={editMode}
          setEditMode={setEditMode}
          viewAsPublic={viewAsPublic}
          setViewAsPublic={setViewAsPublic}
          publicRoute={publicRoute}
          handlePdfExport={handlePdfExport}
          isExporting={isExporting}
          saveError={saveError}
        />

        {publicRoute ? (
          <section className="rounded-[24px] border border-sky-200/80 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-4 text-sm text-sky-900 shadow-sm dark:border-sky-800/80 dark:from-slate-900 dark:to-slate-800 dark:text-sky-100">
            Public profile view — editing and private controls are disabled.
          </section>
        ) : null}

        <div className={publicRoute ? "grid gap-6" : "grid gap-6 xl:grid-cols-2"}>
          {!publicRoute ? (
            <ProfileSidebar
              profile={profile}
              editMode={editMode}
              updateProfile={updateProfile}
              attachProfileImage={attachProfileImage}
              shareUrl={shareUrl}
              copied={copied}
              copyShareUrl={copyShareUrl}
              toggleVisibility={toggleVisibility}
              privacySectionConfig={PRIVACY_SECTION_CONFIG}
              linkFieldConfig={LINK_FIELD_CONFIG}
            />
          ) : null}

          <main className="flex flex-col gap-6">
            {publicRoute && publicNotFound ? (
              <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                <p className="text-sm font-semibold">This shared profile could not be found.</p>
                <p className="mt-1 text-sm">The link may be invalid, private, or no longer available.</p>
              </section>
            ) : null}

            {effectivePrivacy.header && <ProfileHeader profile={profile} roleLabel={roleLabel} />}

            {effectivePrivacy.portfolio && (
              <ProfilePortfolio
                profile={profile}
                editMode={editMode}
                updateProfile={updateProfile}
                attachProjectImage={attachProjectImage}
                attachProjectDocument={attachProjectDocument}
                onProjectImageDrop={onProjectImageDrop}
                uploadError={uploadError}
              />
            )}

            {effectivePrivacy.skills && (
              <ProfileSkills skillGroups={skillGroups} editMode={editMode} updateProfile={updateProfile} />
            )}

            {effectivePrivacy.experience && (
              <ProfileExperience experienceGroups={experienceGroups} updateProfile={updateProfile} />
            )}

            {effectivePrivacy.education && (
              <ProfileEducation profile={profile} editMode={editMode} updateProfile={updateProfile} />
            )}

            {effectivePrivacy.links && <ProfileLinks linkEntries={linkEntries} />}

            {!profile.privacy.profilePublic && viewAsPublic ? (
              <section className="rounded-[28px] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 text-amber-900 shadow-sm dark:border-amber-900 dark:from-slate-900 dark:to-slate-800 dark:text-amber-200">
                <p className="text-sm font-semibold">This profile is currently private.</p>
                <p className="mt-1 text-sm">
                  Recruiters and public viewers will not see this profile until you enable public visibility.
                </p>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
