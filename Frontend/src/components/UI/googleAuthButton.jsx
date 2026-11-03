import React, { useEffect, useRef, useState } from "react";
import Alert from "./Alert";

// Shared constants – used to load the Google Identity Services button safely
const GOOGLE_SCRIPT_ID = "google-identity-services";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Helper – loads the Google sign-in script once and reuses it across pages
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.body.appendChild(script);
  });
}

// Reusable Google auth button – used by both the login and sign-up pages
export default function GoogleAuthButton({
  text = "signin_with",
  onCredential,
  onError,
}) {
  const buttonRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(320);
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || "");

  // Keep Google's fixed-width iframe aligned with the surrounding form.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateWidth = () => {
      const nextWidth = Math.max(
        220,
        Math.min(400, Math.floor(container.clientWidth)),
      );
      setButtonWidth((current) => (current === nextWidth ? current : nextWidth));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Fetch the Google client ID from local env or the backend config endpoint
  useEffect(() => {
    let isMounted = true;

    async function loadClientId() {
      if (clientId) return;

      try {
        const res = await fetch(`${API_BASE}/User/google-config`);
        const data = await res.json();
        if (isMounted && data?.clientId) {
          setClientId(data.clientId);
        }
      } catch {
        // Ignore config fetch failures and fall back to local env config.
      }
    }

    loadClientId();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Render the official Google button once the client ID and script are available
  useEffect(() => {
    let isMounted = true;

    async function setupGoogleButton() {
      if (!clientId || !buttonRef.current) return;

      try {
        await loadGoogleScript();
        if (!isMounted || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              await onCredential?.(response.credential);
            } catch (error) {
              onError?.(error);
            }
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: buttonWidth,
        });
        setIsReady(true);
      } catch (error) {
        onError?.(error);
      }
    }

    setupGoogleButton();

    return () => {
      isMounted = false;
    };
  }, [clientId, onCredential, onError, text, buttonWidth]);

  if (!clientId) {
    return (
      <Alert variant="warning">
        Add your Google Web Client ID in the frontend env or backend app
        settings to enable Google sign-in.
      </Alert>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full flex-col items-center justify-center gap-2"
    >
      {!isReady ? (
        <div className="flex h-12 w-full animate-pulse items-center justify-center gap-3 rounded-koru-pill bg-koru-surface-variant px-4">
          <div className="h-5 w-5 shrink-0 rounded-full bg-koru-outline-variant" />
          <div className="h-4 w-36 rounded-koru-pill bg-koru-outline-variant/70" />
        </div>
      ) : null}
      <div ref={buttonRef} className={isReady ? "" : "hidden"} />
    </div>
  );
}
