import React from "react";
import { Download, Edit3, Eye, EyeOff, Sparkles } from "lucide-react";

export default function ProfileTopBar({
  editMode,
  setEditMode,
  viewAsPublic,
  setViewAsPublic,
  publicRoute,
  handlePdfExport,
  isExporting,
  saveError,
}) {
  return (
    <section className="rounded-[30px] bg-white/90 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#9BE9EA]/30 bg-white/80 px-3 py-1 text-xs font-semibold text-[#0f766e] dark:bg-slate-800 dark:text-[#9BE9EA]">
            <Sparkles size={14} /> Verified University Profile
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Professional Profile Builder</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
            Build a portfolio-rich profile with university-verified context, export an ATS-ready
            mini-CV, and control what is publicly visible.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            disabled={publicRoute}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2 font-semibold shadow-sm transition hover:-translate-y-0.5 ${
              editMode
                ? "border-[#9BE9EA] bg-[#9BE9EA]/15 text-[#0f766e] dark:text-[#9BE9EA]"
                : "border-slate-300 bg-white/90 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Edit3 size={16} /> {editMode ? "Finish Editing" : "Edit Profile"}
          </button>
          <button
            type="button"
            onClick={() => setViewAsPublic((v) => !v)}
            disabled={publicRoute}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-300 bg-white/90 px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {viewAsPublic ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
            {viewAsPublic ? "Exit Public View" : "Preview Public View"}
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={isExporting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0f766e] to-[#14b8a6] px-4 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(15,118,110,0.35)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            <Download size={16} /> {isExporting ? "Exporting..." : "Export to PDF"}
          </button>
        </div>
      </div>

      {saveError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {saveError}
        </div>
      ) : null}
    </section>
  );
}
