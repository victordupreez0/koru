import { useState, useEffect } from "react";

// Returns true when the body carries the .theme-dark class.
// Updates automatically whenever the learnonline-settings-changed event fires.
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains("theme-dark")
  );

  useEffect(() => {
    const handler = () =>
      setIsDark(document.body.classList.contains("theme-dark"));
    window.addEventListener("learnonline-settings-changed", handler);
    return () => window.removeEventListener("learnonline-settings-changed", handler);
  }, []);

  return isDark;
}
