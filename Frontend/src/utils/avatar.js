/**
 * Profile picture helpers.
 *
 * Every user gets a DiceBear "dylan" avatar. The backend stores the URL in
 * `User.ProfileImageUrl` (seeded with the user's id) when an account is
 * created. When a response doesn't carry the URL, we rebuild the exact same
 * avatar from the user's id, so a person looks the same everywhere.
 */
export const DICEBEAR_STYLE = "dylan";
export const DICEBEAR_BASE = `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg`;

export function dicebearUrl(seed) {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(String(seed ?? "koru"))}`;
}

/**
 * Resolve the avatar URL for any user-ish object.
 * Accepts `{ profileImageUrl, id | userId | studentId, firstName, lastName, name }`.
 */
export function getAvatarUrl(person) {
  if (!person) return dicebearUrl("koru");
  const stored = person.profileImageUrl ?? person.ProfileImageUrl;
  if (stored) return stored;
  const seed =
    person.id ??
    person.userId ??
    person.studentId ??
    person.lecturerId ??
    person.teacherId ??
    person.name ??
    [person.firstName, person.lastName].filter(Boolean).join(" ");
  return dicebearUrl(seed || "koru");
}
