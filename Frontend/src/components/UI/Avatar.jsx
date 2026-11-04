import { useState } from "react";
import { cn } from "../../utils/cn";
import { getAvatarUrl, dicebearUrl } from "../../utils/avatar";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-24 w-24 text-xl",
};

/**
 * Circular profile picture.
 *
 * Pass a `user` (any object with profileImageUrl / id / names), or `src` +
 * `seed` directly. Falls back to the DiceBear avatar for the seed if the
 * image fails to load.
 *
 * @param {"xs"|"sm"|"md"|"lg"|"xl"|number} size Preset, or a pixel size
 */
export default function Avatar({
  user,
  src,
  seed,
  name,
  size = "md",
  className,
  style,
  ...props
}) {
  const isPx = typeof size === "number";
  const resolved = src || (user ? getAvatarUrl(user) : dicebearUrl(seed ?? name));
  const fallback = dicebearUrl(
    seed ?? user?.id ?? user?.userId ?? user?.studentId ?? name ?? "koru",
  );
  const [failed, setFailed] = useState(false);
  const label =
    name ??
    (user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name : "");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-koru-accent-soft ring-1 ring-koru-outline-faint",
        isPx ? null : (SIZES[size] ?? SIZES.md),
        className,
      )}
      style={isPx ? { width: size, height: size, ...style } : style}
      {...props}
    >
      <img
        src={failed ? fallback : resolved}
        alt={label ? `${label}'s profile picture` : ""}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
