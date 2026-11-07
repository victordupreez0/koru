// Base namespace for all per-user, per-role profile data in localStorage.
export const PROFILE_STORAGE_PREFIX = "learnonline.profile";
// Maps public vanity slugs to the owner profile storage key.
export const PUBLIC_PROFILE_INDEX_KEY = `${PROFILE_STORAGE_PREFIX}.public.index`;
export const PROFILE_LAST_ROLE_KEY = `${PROFILE_STORAGE_PREFIX}.last-role`;

export const MAX_IMAGE_FILE_SIZE_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_FILE_SIZE_BYTES = 8 * 1024 * 1024;

// Shared field metadata keeps the live page and PDF export in sync.
export const LINK_FIELD_CONFIG = [
  { key: "github", label: "GitHub", placeholder: "GitHub URL" },
  { key: "behance", label: "Behance", placeholder: "Behance URL" },
  { key: "linkedin", label: "LinkedIn", placeholder: "LinkedIn URL" },
  { key: "website", label: "Website", placeholder: "Personal Website URL" },
];

export const PRIVACY_SECTION_CONFIG = [
  ["header", "Header"],
  ["portfolio", "Portfolio"],
  ["skills", "Skills"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["links", "External Links"],
];

export const SKILL_GROUP_CONFIG = [
  { key: "technical", label: "Technical", placeholder: "Python, Figma, SQL" },
  { key: "soft", label: "Soft", placeholder: "Communication, Teamwork" },
  { key: "interpersonal", label: "Interpersonal", placeholder: "Leadership, Mentoring" },
];

export const LEGACY_DEMO_TEXT_PATTERNS = [
  /^example$/i,
  /^sample$/i,
  /^placeholder$/i,
  /^dummy$/i,
  /^project title$/i,
  /^project description$/i,
  /lorem ipsum/i,
  /github\.com\/(user|username|your-name)/i,
  /linkedin\.com\/in\/(user|username|your-name)/i,
  /behance\.net\/(user|username|your-name)/i,
  /example\.com/i,
  /2-3 sentence professional summary/i,
  /dean'?s list, python certification/i,
];

// Shared field classes for multi-line text areas (the Input primitive is single-line).
export const TEXTAREA_LABEL_CLASS =
  "mb-1.5 block text-koru-label text-koru-on-surface-variant";

export const TEXTAREA_CLASS =
  "w-full rounded-koru-xs bg-koru-surface-container-lowest px-4 py-3 text-sm text-koru-on-surface shadow-koru-xs outline-none transition placeholder:text-koru-on-surface-variant/70 hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary";
