import React from "react";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

// Reusable auth input – keeps login and sign-up fields visually consistent
export default function AuthInput({ label, error, className = "", labelClassName = "text-slate-700 dark:text-slate-300", onFocus, ...props }) {
  const { speak, enabled } = useTextToSpeech();

  function handleFocus(event) {
    if (enabled) {
      const message = [
        label,
        props.placeholder ? `Hint: ${props.placeholder}` : "",
        error ? `Error: ${error}` : "",
      ]
        .filter(Boolean)
        .join(". ");

      speak(message);
    }

    onFocus?.(event);
  }

  return (
    <label className={`flex w-full flex-col gap-2 text-sm font-medium ${labelClassName}`}>
      <span>{label}</span>
      <input
        {...props}
        aria-label={label}
        aria-invalid={Boolean(error)}
        onFocus={handleFocus}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:-translate-y-0.5 focus:border-[#3C0078] dark:focus:border-[#9BE9EA] focus:ring-2 focus:ring-[#9BE9EA] ${error ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"} ${className}`}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
