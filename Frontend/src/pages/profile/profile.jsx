import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserRound,
  Presentation,
  Sparkles,
  GraduationCap,
  Briefcase,
  Link as LinkIcon,
  Eye,
  Upload,
  Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ProfileHeader from "../../components/ProfileHeader";
import ProfilePortfolio from "../../components/ProfilePortfolio";
import ProfileSkills from "../../components/ProfileSkills";
import ProfileExperience from "../../components/ProfileExperience";
import ProfileEducation from "../../components/ProfileEducation";
import ProfileLinks from "../../components/ProfileLinks";
import ProfileSectionHeader from "../../components/ProfileSectionHeader";
import { Alert, Button, Card, Input } from "../../components/UI";

import {
  LINK_FIELD_CONFIG,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_PDF_FILE_SIZE_BYTES,
  PRIVACY_SECTION_CONFIG,
  PROFILE_LAST_ROLE_KEY,
  PROFILE_STORAGE_PREFIX,
  PUBLIC_PROFILE_INDEX_KEY,
  TEXTAREA_CLASS,
  TEXTAREA_LABEL_CLASS,
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
  ensureHttps
} from "./profileUtils";
import { exportProfileToPdf } from "./profilePdf";

export default function Profile({ publicRoute = false }) {
  const { slug: routeSlug } = useParams();
  const { user: session, role } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

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

  // Categories list based on privacy / view mode
  const categories = useMemo(() => {
    const list = [];
    
    if (!publicRoute) {
      // Internal Owner view: show all categories
      list.push(
        { id: "profile", label: "Account Profile", icon: <UserRound size={15} /> },
        { id: "portfolio", label: "Showcase Portfolio", icon: <Presentation size={15} /> },
        { id: "skills", label: "Skills Matrix", icon: <Sparkles size={15} /> },
        { id: "experience", label: "Career & Education", icon: <Briefcase size={15} /> },
        { id: "links", label: "Connected Channels", icon: <LinkIcon size={15} /> },
        { id: "visibility", label: "Sharing & Visibility", icon: <Eye size={15} /> }
      );
    } else {
      // Public route: filter based on effective privacy
      if (effectivePrivacy.header) {
        list.push({ id: "profile", label: "Account Profile", icon: <UserRound size={15} /> });
      }
      if (effectivePrivacy.portfolio) {
        list.push({ id: "portfolio", label: "Showcase Portfolio", icon: <Presentation size={15} /> });
      }
      if (effectivePrivacy.skills) {
        list.push({ id: "skills", label: "Skills Matrix", icon: <Sparkles size={15} /> });
      }
      if (effectivePrivacy.experience || effectivePrivacy.education) {
        list.push({ id: "experience", label: "Career & Education", icon: <Briefcase size={15} /> });
      }
      if (effectivePrivacy.links) {
        list.push({ id: "links", label: "Connected Channels", icon: <LinkIcon size={15} /> });
      }
    }
    
    return list;
  }, [publicRoute, effectivePrivacy]);

  // Adjust active tab if it becomes invisible in public view
  useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some((c) => c.id === activeTab);
      if (!exists) {
        setActiveTab(categories[0].id);
      }
    }
  }, [categories, activeTab]);

  // Page Classes matching Settings
  const pageClasses = useMemo(
    () => ({
      wrapper: "text-koru-on-surface font-sans",
      muted: "text-koru-on-surface-variant text-xs leading-relaxed",
    }),
    [],
  );

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
      const copy = JSON.parse(JSON.stringify(current));
      const parts = path.split(".");
      let target = copy;
      while (parts.length > 1) {
        const part = parts.shift();
        if (!target[part]) target[part] = {};
        target = target[part];
      }
      target[parts[0]] = value;
      return copy;
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

  const activeTabLabel = useMemo(() => {
    const found = categories.find((c) => c.id === activeTab);
    return found ? found.label : "Profile";
  }, [activeTab, categories]);

  return (
    <div data-tts-root="true" className={`flex overflow-hidden gap-4 transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 bg-transparent ${pageClasses.wrapper}`}>
      <div className="flex h-full w-full gap-4 overflow-hidden">
        {/* Left Section: Floating Profile Secondary Navigation (Matching Courses & Settings) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col shrink-0 transition-all duration-300
            md:h-full md:w-64 md:bg-koru-surface-container-lowest md:backdrop-blur-xl md:rounded-koru-lg md:shadow-koru-card md:overflow-hidden
            max-md:h-full max-md:w-64 max-md:bg-koru-surface-container-lowest max-md:backdrop-blur-md max-md:border-r max-md:border-koru-outline-faint"
        >
          {/* Profile Sidebar Header Info */}
          <div className="px-6 pt-6 pb-5 border-b border-koru-outline-faint flex flex-col gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="rounded-koru-pill bg-koru-primary-container px-2 py-0.5 text-koru-caption font-medium uppercase text-koru-on-primary-container">
                {roleLabel}
              </span>
              <span className="text-koru-caption text-koru-on-surface-variant">
                Portfolio
              </span>
            </div>
            <h3 className="mt-1 truncate font-display text-koru-heading text-koru-on-surface">
              My Profile
            </h3>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto pt-4 pb-6 scrollbar-hide">
            {categories.length === 0 ? (
              <p className="px-6 text-xs italic text-koru-on-surface-variant">No public sections visible.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {categories.map((cat, index) => {
                  const isActive = activeTab === cat.id;
                  return (
                    <motion.li
                      key={cat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="list-none group relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(cat.id);
                          setSaveError("");
                          setUploadError("");
                        }}
                        className={`relative w-[calc(100%-24px)] flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all duration-200 mx-3 my-0.5 rounded-koru-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus select-none cursor-pointer text-left
                          ${isActive
                            ? "bg-koru-primary-container text-koru-on-primary-container"
                            : "text-koru-on-surface-variant hover:bg-koru-surface-container hover:text-koru-on-surface"
                          }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeProfileLeftAccent"
                            className="absolute left-0 top-1/4 bottom-1/4 w-0.75 bg-koru-primary rounded-r-md shrink-0"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30
                            }}
                          />
                        )}

                        <span className={`transition-colors shrink-0 ${isActive ? "text-koru-primary" : "text-koru-on-surface-variant group-hover:text-koru-on-surface"}`}>
                          {cat.icon}
                        </span>
                        
                        <span className="flex-1 truncate !text-inherit">{cat.label}</span>

                        {isActive && (
                          <motion.div
                            layoutId="activeProfileDot"
                            className="w-1.5 h-1.5 rounded-full bg-koru-primary shrink-0"
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30
                            }}
                          />
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Right Section: Main Content Area: Floating Island Card */}
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 md:bg-koru-surface-container-lowest md:backdrop-blur-xl md:rounded-koru-lg md:shadow-koru-card max-md:bg-koru-surface-container-lowest">
          {/* Header Top Bar */}
          <div className="h-14 border-b border-koru-outline-faint bg-koru-surface-container-lowest backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="rounded-koru-pill bg-koru-primary px-2.5 py-0.5 text-koru-caption font-medium text-koru-on-primary">
                University Portfolio
              </span>
              <span className="text-koru-outline text-xs">/</span>
              <span className="text-xs font-medium text-koru-on-surface-variant capitalize">{activeTabLabel}</span>
            </div>

            {/* Owner Actions */}
            {!publicRoute && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant={editMode ? "filled" : "outlined"} onClick={() => setEditMode(!editMode)}>
                  {editMode ? "Save & View" : "Edit Profile"}
                </Button>
                
                <Button size="sm" variant="outlined" onClick={() => window.open(`/profile/p/${profile.vanityUrlSlug || "default"}`)}>
                  Public Preview
                </Button>
                
                <Button size="sm" variant="outlined" onClick={handlePdfExport} disabled={isExporting}>
                  {isExporting ? "Exporting..." : "Export CV"}
                </Button>
              </div>
            )}
          </div>

          {/* Scrollable View Content */}
          <div className="flex-1 overflow-y-auto pt-8 px-8 pb-12">
            <div className="w-full flex flex-col gap-6">
              {publicRoute && publicNotFound ? (
                <Alert variant="error" title="This shared profile could not be found.">
                  The link may be invalid, private, or no longer available.
                </Alert>
              ) : null}

              {saveError ? (
                <Alert variant="error">{saveError}</Alert>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {activeTab === "profile" && effectivePrivacy.header && (
                    <>
                      <ProfileHeader profile={profile} roleLabel={roleLabel} />

                      {editMode && (
                        <Card variant="outlined" tone="surface" padding="lg" radius="xl">
                          <ProfileSectionHeader icon={<UserRound size={20} />}>Edit Profile Identity</ProfileSectionHeader>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
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
                                containerClassName="sm:col-span-2"
                                label="Email Address"
                                value={profile.header.email}
                                onChange={(e) => updateProfile("header.email", e.target.value)}
                                placeholder="Email address"
                                disabled
                              />
                            <Input
                                containerClassName="sm:col-span-2"
                                label="Profile Photo URL"
                                value={profile.header.photoUrl}
                                onChange={(e) => updateProfile("header.photoUrl", e.target.value)}
                                placeholder="Profile photo URL (or upload below)"
                              />
                            <div className="sm:col-span-2 flex flex-col gap-2">
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
                            <div className="sm:col-span-2">
                              <label className={TEXTAREA_LABEL_CLASS}>Professional Summary</label>
                              <textarea
                                value={profile.header.summary}
                                onChange={(e) => updateProfile("header.summary", e.target.value)}
                                rows={4}
                                placeholder="2-3 sentence professional summary visible to recruiters"
                                className={TEXTAREA_CLASS}
                              />
                            </div>
                          </div>
                        </Card>
                      )}
                    </>
                  )}

                  {activeTab === "portfolio" && effectivePrivacy.portfolio && (
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

                  {activeTab === "skills" && effectivePrivacy.skills && (
                    <ProfileSkills skillGroups={skillGroups} editMode={editMode} updateProfile={updateProfile} />
                  )}

                  {activeTab === "experience" && (
                    <div className="flex flex-col gap-6">
                      {effectivePrivacy.experience && (
                        <ProfileExperience experienceGroups={experienceGroups} editMode={editMode} updateProfile={updateProfile} />
                      )}

                      {effectivePrivacy.education && (
                        <ProfileEducation profile={profile} editMode={editMode} updateProfile={updateProfile} />
                      )}
                    </div>
                  )}

                  {activeTab === "links" && effectivePrivacy.links && (
                    <div className="flex flex-col gap-6">
                      <ProfileLinks linkEntries={linkEntries} />

                      {editMode && (
                        <Card variant="outlined" tone="surface" padding="lg" radius="xl">
                          <ProfileSectionHeader icon={<Palette size={20} />}>Manage Platform Links</ProfileSectionHeader>
                          
                          <div className="grid gap-4 sm:grid-cols-2">
                            {LINK_FIELD_CONFIG.map(({ key, label, placeholder }) => (
                              <Input
                                key={key}
                                label={label}
                                value={profile.links[key]}
                                onChange={(e) => updateProfile(`links.${key}`, ensureHttps(e.target.value))}
                                placeholder={placeholder}
                              />
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeTab === "visibility" && !publicRoute && (
                    <Card variant="outlined" tone="surface" padding="lg" radius="xl">
                      <ProfileSectionHeader icon={<Eye size={20} />}>Privacy &amp; Visibility Checklist</ProfileSectionHeader>
                      
                      <p className={`${pageClasses.muted} mb-5`}>
                        Control which sections are displayed to recruiters on your public dashboard.
                      </p>
                      
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
                        {PRIVACY_SECTION_CONFIG.map(([key, label]) => (
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

                      {editMode && (
                        <Input
                                containerClassName="mt-4 border-t border-koru-outline-faint pt-4"
                                label="Vanity URL slug"
                                value={profile.vanityUrlSlug}
                                onChange={(e) => updateProfile("vanityUrlSlug", slugify(e.target.value))}
                                placeholder="e.g. johndoe"
                              />
                      )}

                      <div className="mt-6 rounded-koru-lg bg-koru-primary-container p-4">
                        <p className="text-koru-caption uppercase text-koru-on-primary-container">
                          Shareable Link
                        </p>
                        <p className="mt-1.5 select-all break-all rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 font-mono text-xs text-koru-on-surface">{shareUrl}</p>
                        <Button
                          variant="outlined"
                          size="sm"
                          className="mt-3.5"
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          <span>{copied ? "Copied!" : "Copy link"}</span>
                        </Button>
                      </div>
                    </Card>
                  )}

                  {!profile.privacy.profilePublic && viewAsPublic ? (
                    <Alert variant="warning" title="This profile is currently private.">
                      Recruiters and public viewers will not see this profile until you enable public visibility.
                    </Alert>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
