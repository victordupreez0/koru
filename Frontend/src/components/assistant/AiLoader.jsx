import { useId } from "react";

/*
 * From Uiverse.io by andrew-manzyk
 * Ported to React: unique mask id per instance, scaled to `size` px.
 */
export default function AiLoader({ size = 20 }) {
  const maskId = `koru-ai-mask-${useId().replace(/:/g, "")}`;
  const maskUrl = `url(#${maskId})`;

  return (
    <span
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
