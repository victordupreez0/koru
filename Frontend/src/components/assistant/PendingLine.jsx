import { useEffect, useState } from "react";
import { Button } from "../UI";
import "./assistant.css";

/**
 * Where the reply will appear while the server works. The stage text lives in a
 * polite live region; the elapsed seconds are aria-hidden so they never announce.
 */
export default function PendingLine({ text, onStop }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="koru-pending flex flex-wrap items-center gap-x-1 gap-y-1 text-koru-label text-koru-on-surface-variant">
      <span>
        <span aria-live="polite" aria-atomic="true">{text || "Looking at what is saved"}</span>
        {elapsed >= 5 && <span aria-hidden="true">{` · ${elapsed}s`}</span>}
      </span>
      <Button variant="text" size="sm" onClick={onStop}>Stop</Button>
    </div>
  );
}
