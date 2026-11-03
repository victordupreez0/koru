/**
 * Combine class names, ignoring falsy values.
 *
 * Kept dependency-free on purpose: the foundation primitives only need
 * conditional joining. Pass `className` last so callers can extend a primitive.
 *
 * @param {...(string | false | null | undefined | Array<string | false | null | undefined>)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.flat(Infinity).filter(Boolean).join(" ");
}

export default cn;
