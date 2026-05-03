import React from "react";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { isValidUrl } from "../pages/profile/profileUtils";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/90";

// linkEntries: [[label, url], ...]  — all 4 links are shown,
// invalid/empty ones are styled grey and clicks are prevented.
export default function ProfileLinks({ linkEntries }) {
  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <LinkIcon size={20} />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Connected Platforms</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {linkEntries.map(([label, url]) => (
          <a
            key={label}
            href={isValidUrl(url) ? url : undefined}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
              isValidUrl(url)
                ? "border-[#0f766e] bg-[#eafaf8] text-[#0f766e] hover:bg-[#d8f5f0] dark:border-[#9BE9EA] dark:bg-[#9BE9EA]/10 dark:text-[#9BE9EA]"
                : "border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
            }`}
            onClick={(e) => {
              if (!isValidUrl(url)) e.preventDefault();
            }}
          >
            {label} <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </section>
  );
}
