import { useEffect, useId, useRef } from "react";

const SETTLE_MS = 1400;

/*
 * From Uiverse.io by andrew-manzyk
 * Ported to React: unique mask id per instance, scaled to `size` px.
 *
 * `active` runs the animation at full speed. When it is false the orb holds still;
 * with `settle` it first eases from full speed down to a stop (used for a reply that
 * has just arrived, so the thinking orb visibly winds down).
 */
export default function AiLoader({ size = 20, active = true, settle = false }) {
  const maskId = `koru-ai-mask-${useId().replace(/:/g, "")}`;
  const maskUrl = `url(#${maskId})`;
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof root.getAnimations !== "function") return;
    const animations = root.getAnimations({ subtree: true });
    if (animations.length === 0) return; // e.g. prefers-reduced-motion

    if (active) {
      animations.forEach(a => { a.playbackRate = 1; a.play(); });
      return;
    }

    if (!settle) {
      animations.forEach(a => a.pause());
      return;
    }

    // Ease playback speed from 1 to 0, then pause where it landed.
    let raf;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / SETTLE_MS, 1);
      const rate = (1 - t) * (1 - t) * (1 - t); // ease-out cubic on speed
      if (t >= 1) {
        animations.forEach(a => a.pause());
        return;
      }
      animations.forEach(a => { a.playbackRate = rate; });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, settle]);

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className="koru-ai-loader-slot"
      style={{ width: size, height: size }}
    >
      <span
        className="koru-ai-loader"
        style={{ transform: `scale(${size / 100})` }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" focusable="false">
          <defs>
            <mask id={maskId} className="koru-ai-mask">
              <polygon points="0,0 100,0 100,100 0,100" fill="black" />
              <polygon points="25,25 75,25 50,75" fill="white" />
              <polygon points="50,25 75,75 25,75" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
              <polygon points="35,35 65,35 50,65" fill="white" />
            </mask>
          </defs>
        </svg>
        <span className="koru-ai-box" style={{ mask: maskUrl, WebkitMask: maskUrl }} />
      </span>
    </span>
  );
}
