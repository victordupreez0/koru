import {
  LEGACY_DEMO_TEXT_PATTERNS,
  LINK_FIELD_CONFIG,
  SKILL_GROUP_CONFIG,
} from "./profileConfig";

// Accept only absolute http(s) links for safe external navigation and embeds.
export function isValidUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// Project assets can be external links or locally attached files (data/blob URLs).
export function isProjectAssetUrl(value) {
  if (!value) return false;
  if (value.startsWith("data:") || value.startsWith("blob:")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// Images may come from local uploads (data:image/*), blob URLs, or external http(s) links.
export function isProjectImageUrl(value) {
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("blob:")) return true;
  return isValidUrl(value);
}

// Normalize user-provided links so typing "github.com/user" still works.
export function ensureHttps(value) {
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

// Convert a selected local file to a data URL so it can be persisted with the profile.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

// Convert user-entered names/slugs into a URL-safe path segment.
export function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Small immutable array helper used by several editors.
export function updateList(list, index, value) {
  return list.map((item, i) => (i === index ? value : item));
}

export function getLinkEntries(links) {
  return LINK_FIELD_CONFIG.map(({ key, label }) => [label, links[key] || ""]);
}

export function getSkillGroups(skills) {
  return SKILL_GROUP_CONFIG.map(({ key, label, placeholder }) => ({
    key,
    label,
    placeholder,
    items: skills[key] || [],
  }));
}

export function getExperienceGroups(experience, roleLabel) {
  return [
    {
      key: "relevantCoursework",
      label: "Relevant Coursework",
      placeholder: "Top 4-6 modules aligned with career goals",
    },
    {
      key: "researchLabWork",
      label: "Research & Lab Work",
      placeholder: "Research papers, lab projects, contributions",
    },
    {
      key: "leadership",
      label: "Extracurricular Leadership",
      placeholder: "Club roles, peer tutoring, mentoring",
    },
    {
      key: "practicalExperience",
      label: roleLabel === "Teacher" ? "Teaching Experience" : "Practical Experience",
      placeholder: "Internships, assistantships, applied roles",
    },
  ].map(({ key, label, placeholder }) => ({
    key,
    label,
    placeholder,
    items: experience[key] || [],
  }));
}

// Seed a first-run profile shape based on role and current session details.
export function buildDefaultProfile(role, session) {
  const fullName = `${session?.firstName || ""} ${session?.lastName || ""}`.trim();
  const vanity = slugify(fullName || session?.email?.split("@")[0] || "profile");

  return {
    header: {
      fullName,
      headline: "",
      major: "",
      degree: "",
      expectedGraduation: "",
      photoUrl: session?.profileImageUrl || "",
      photoName: "",
      summary: "",
      email: session?.email || "",
    },
    badges: [],
    projects: [],
    skills: { technical: [], soft: [], interpersonal: [] },
    links: { github: "", behance: "", linkedin: "", website: "" },
    experience: {
      relevantCoursework: [],
      researchLabWork: [],
      leadership: [],
      practicalExperience: [],
    },
    education: { institution: "", gpa: "", modules: [] },
    privacy: {
      profilePublic: true,
      header: true,
      portfolio: true,
      skills: true,
      experience: true,
      education: true,
      links: true,
    },
    vanityUrlSlug: vanity || "profile",
  };
}

function sanitizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isLegacyDemoValue(value) {
  const text = sanitizeText(value);
  if (!text) return false;
  return LEGACY_DEMO_TEXT_PATTERNS.some((p) => p.test(text));
}

// Merge saved profile data with the current shape and drop old demo/template content.
export function normalizeProfileSnapshot(snapshot, role, session) {
  const base = buildDefaultProfile(role, session);
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  const cleanText = (value, fallback = "") =>
    isLegacyDemoValue(value) ? fallback : String(value || fallback);
  const cleanList = (items) =>
    (Array.isArray(items) ? items : []).map((item) => cleanText(item)).filter(Boolean);
  const cleanProject = (project) => ({
    title: cleanText(project?.title),
    description: cleanText(project?.description),
    mediaUrl: cleanText(project?.mediaUrl),
    mediaName: cleanText(project?.mediaName),
    projectUrl: cleanText(project?.projectUrl),
    projectFileName: cleanText(project?.projectFileName),
  });

  return {
    ...base,
    ...source,
    header: {
      ...base.header,
      ...(source.header || {}),
      fullName: cleanText(source.header?.fullName, base.header.fullName),
      headline: cleanText(source.header?.headline),
      major: cleanText(source.header?.major),
      degree: cleanText(source.header?.degree),
      expectedGraduation: cleanText(source.header?.expectedGraduation),
      photoUrl: cleanText(source.header?.photoUrl, base.header.photoUrl),
      photoName: cleanText(source.header?.photoName),
      summary: cleanText(source.header?.summary),
      email: cleanText(source.header?.email, base.header.email),
    },
    badges: cleanList(source.badges),
    projects: (Array.isArray(source.projects) ? source.projects : [])
      .map(cleanProject)
      .filter((p) => p.title || p.description || p.mediaUrl || p.projectUrl || p.projectFileName),
    skills: {
      ...base.skills,
      ...(source.skills || {}),
      technical: cleanList(source.skills?.technical),
      soft: cleanList(source.skills?.soft),
      interpersonal: cleanList(source.skills?.interpersonal),
    },
    links: {
      ...base.links,
      ...(source.links || {}),
      github: cleanText(source.links?.github),
      behance: cleanText(source.links?.behance),
      linkedin: cleanText(source.links?.linkedin),
      website: cleanText(source.links?.website),
    },
    experience: {
      ...base.experience,
      ...(source.experience || {}),
      relevantCoursework: cleanList(source.experience?.relevantCoursework),
      researchLabWork: cleanList(source.experience?.researchLabWork),
      leadership: cleanList(source.experience?.leadership),
      practicalExperience: cleanList(source.experience?.practicalExperience),
    },
    education: {
      ...base.education,
      ...(source.education || {}),
      institution: cleanText(source.education?.institution),
      gpa: cleanText(source.education?.gpa),
      modules: cleanList(source.education?.modules),
    },
    privacy: { ...base.privacy, ...(source.privacy || {}) },
    vanityUrlSlug:
      slugify(cleanText(source.vanityUrlSlug, base.vanityUrlSlug)) || base.vanityUrlSlug,
  };
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getFileSizeError(file, maxBytes, label) {
  if (!file) return "";
  if (file.size <= maxBytes) return "";
  return `${label} is too large (${formatBytes(file.size)}). Maximum allowed size is ${formatBytes(maxBytes)}.`;
}

function isInlineAsset(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("data:") || value.startsWith("blob:"))
  );
}

export function stripInlineAssetsForPersistence(snapshot) {
  const safe = JSON.parse(JSON.stringify(snapshot));
  if (safe?.header && isInlineAsset(safe.header.photoUrl)) {
    safe.header.photoUrl = "";
  }
  safe.projects = (safe.projects || []).map((project) => ({
    ...project,
    mediaUrl: isInlineAsset(project?.mediaUrl) ? "" : project?.mediaUrl || "",
    projectUrl: isInlineAsset(project?.projectUrl) ? "" : project?.projectUrl || "",
  }));
  return safe;
}

// Persist the profile snapshot and return { ok, error } so callers can update UI state.
export function persistProfileSnapshot(storageKey, snapshot, stableRoleScope, session) {
  const normalized = normalizeProfileSnapshot(snapshot, stableRoleScope, session);
  try {
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return { ok: true, error: "" };
  } catch {
    try {
      const reduced = stripInlineAssetsForPersistence(normalized);
      localStorage.setItem(storageKey, JSON.stringify(reduced));
      return {
        ok: true,
        error:
          "Profile text data was saved, but local uploaded files were too large and were removed from storage.",
      };
    } catch {
      return {
        ok: false,
        error:
          "Profile could not be saved locally. Please remove large uploads and try again.",
      };
    }
  }
}
