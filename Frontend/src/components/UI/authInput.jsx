import React from "react";

// Reusable auth input – keeps login and sign-up fields visually consistent
export default function AuthInput({ label, error, className = "", ...props }) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        {...props}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:-translate-y-0.5 focus:border-[#3C0078] focus:ring-2 focus:ring-[#9BE9EA] ${error ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"} ${className}`}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
