import { useEffect, useRef } from "react";
import "./assistant.css";

/** Ambient CSS glow behind the chat. Fills the panel when empty, sinks to the bottom once chatting. */
export default function ChatGlow({ settled = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const sync = () => ref.current?.classList.toggle("is-paused", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="koru-glow">
      <div className={`koru-glow-stage ${settled ? "is-settled" : ""}`}>
        <span className="koru-glow-orb koru-glow-orb--a" />
        <span className="koru-glow-orb koru-glow-orb--b" />
        <span className="koru-glow-orb koru-glow-orb--c" />
      </div>
    </div>
  );
}
