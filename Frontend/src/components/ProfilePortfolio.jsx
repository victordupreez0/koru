import React from "react";
import { ExternalLink, Image, Plus, Presentation, Trash2, Upload } from "lucide-react";
import { ensureHttps, isProjectAssetUrl, isProjectImageUrl, updateList } from "../pages/profile/profileUtils";

const PANEL_CLASS =
  "rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.12)]";

export default function ProfilePortfolio({
  profile,
  editMode,
  updateProfile,
  attachProjectImage,
  attachProjectDocument,
  onProjectImageDrop,
  uploadError,
}) {
  return (
    <section className={PANEL_CLASS}>
      <div className="mb-4 flex items-center gap-2">
        <Presentation size={20} />
        <h2 className="text-2xl font-bold">Showcase Portfolio</h2>
      </div>

      {uploadError ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {uploadError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {profile.projects.map((project, index) => (
          <article
            key={`project-${index}`}
            className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Preview image */}
            <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {project.mediaUrl && isProjectImageUrl(project.mediaUrl) ? (
                <img
                  src={project.mediaUrl}
                  alt={project.title || "Project preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Image size={16} /> Add image or media URL
                </span>
              )}
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input
                  value={project.title}
                  onChange={(e) =>
                    updateProfile(
                      "projects",
                      updateList(profile.projects, index, { ...project, title: e.target.value })
                    )
                  }
                  placeholder="Project title"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3C0078] focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20"
                />
                <textarea
                  value={project.description}
                  onChange={(e) =>
                    updateProfile(
                      "projects",
                      updateList(profile.projects, index, {
                        ...project,
                        description: e.target.value,
                      })
                    )
                  }
                  placeholder="Brief project description"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3C0078] focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20"
                />
                <input
                  value={project.mediaUrl}
                  onChange={(e) =>
                    updateProfile(
                      "projects",
                      updateList(profile.projects, index, {
                        ...project,
                        mediaUrl: ensureHttps(e.target.value),
                      })
                    )
                  }
                  placeholder="Media URL (image/video preview)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3C0078] focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20"
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onProjectImageDrop(index, e)}
                  className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500"
                >
                  Drag and drop an image here, or use the button below.
                </div>
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Upload size={14} /> Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const [file] = Array.from(e.target.files || []);
                      attachProjectImage(index, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {project.mediaName ? (
                  <p className="text-xs text-slate-500">Image: {project.mediaName}</p>
                ) : null}
                <input
                  value={project.projectUrl}
                  onChange={(e) =>
                    updateProfile(
                      "projects",
                      updateList(profile.projects, index, {
                        ...project,
                        projectUrl: ensureHttps(e.target.value),
                      })
                    )
                  }
                  placeholder="Project link (PDF / Video / Repo)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3C0078] focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20"
                />
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Upload size={14} /> Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const [file] = Array.from(e.target.files || []);
                      attachProjectDocument(index, file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {project.projectFileName ? (
                  <p className="text-xs text-slate-500">Document: {project.projectFileName}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    updateProfile(
                      "projects",
                      profile.projects.filter((_, i) => i !== index)
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={14} /> Remove project
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold tracking-tight">
                  {project.title || "Untitled project"}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                {isProjectAssetUrl(project.projectUrl) ? (
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#3C0078] hover:underline"
                  >
                    Open {project.projectFileName || "project"} <ExternalLink size={14} />
                  </a>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>

      {editMode ? (
        <button
          type="button"
          onClick={() =>
            updateProfile("projects", [
              ...profile.projects,
              {
                title: "",
                description: "",
                mediaUrl: "",
                mediaName: "",
                projectUrl: "",
                projectFileName: "",
              },
            ])
          }
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <Plus size={16} /> Add project
        </button>
      ) : null}
    </section>
  );
}
