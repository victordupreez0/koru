import { useCallback, useEffect, useRef, useState } from "react";

const RETRY_MS = 5000;

/**
 * Saves the newest payload shortly after the last change. Only one save runs at a time,
 * a failed save is retried, and anything pending is flushed when the page goes away.
 * status: "saved" | "dirty" | "saving" | "error"
 */
export function useAutosave(save, delay = 1200) {
    const [status, setStatus] = useState("saved");
    const saveRef = useRef(save);
    const pending = useRef(null);
    const timer = useRef(null);
    const running = useRef(null);

    useEffect(() => {
        saveRef.current = save;
    }, [save]);

    const flush = useCallback(async () => {
        clearTimeout(timer.current);
        if (running.current) await running.current;
        const payload = pending.current;
        if (payload === null) return true;

        pending.current = null;
        setStatus("saving");
        running.current = saveRef.current(payload).then(
            () => {
                running.current = null;
                setStatus(pending.current === null ? "saved" : "dirty");
                return true;
            },
            (err) => {
                console.error("Save failed:", err);
                running.current = null;
                // Newer edits win over the payload that failed.
                pending.current ??= payload;
                setStatus("error");
                timer.current = setTimeout(() => flush(), RETRY_MS);
                return false;
            },
        );
        return running.current;
    }, []);

    const schedule = useCallback((payload) => {
        pending.current = payload;
        setStatus("dirty");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flush(), delay);
    }, [delay, flush]);

    useEffect(() => {
        const warn = (e) => {
            if (pending.current === null) return;
            flush();
            // Electron cancels the close silently instead of asking, so only warn in browsers.
            if (!navigator.userAgent.includes("Electron")) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", warn);
        return () => {
            window.removeEventListener("beforeunload", warn);
            flush();
        };
    }, [flush]);

    return { status, schedule, flush };
}
