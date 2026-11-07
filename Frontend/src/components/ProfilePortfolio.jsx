import React from "react";
import { ExternalLink, Image, Plus, Presentation, Trash2, Upload } from "lucide-react";
import { ensureHttps, isProjectAssetUrl, isProjectImageUrl, updateList } from "../pages/profile/profileUtils";
import { TEXTAREA_CLASS, TEXTAREA_LABEL_CLASS } from "../pages/profile/profileConfig";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Alert, Button, Card, Input } from "./UI";

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
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
      <ProfileSectionHeader icon={<Presentation size={20} />}>Showcase Portfolio</ProfileSectionHeader>

      {uploadError ? (
        <Alert variant="warning" className="mb-6">
          {uploadError}
        </Alert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {profile.projects.map((project, index) => (
          <Card
            as="article"
            key={`project-${index}`}
            variant="interactive"
            tone="low"
            padding="md"
            radius="xl"
          >
            {/* Preview image */}
            <div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-koru-lg bg-koru-surface-container-lowest">
              {project.mediaUrl && isProjectImageUrl(project.mediaUrl) ? (
                <img
                  src={project.mediaUrl}
                  alt={project.title || "Project preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex select-none items-center gap-2 text-koru-caption uppercase text-koru-on-surface-variant">
                  <Image size={16} /> Add image or media URL
                </span>
              )}
            </div>

            {editMode ? (
              <div className="space-y-3.5">
                <Input
                    size="sm"
                    label="Project Title"
                    value={project.title}
                    onChange={(e) =>
                      updateProfile(
                        "projects",
                        updateList(profile.projects, index, { ...project, title: e.target.value })
                      )
                    }
                    placeholder="Project title"
                  />
                <div>
                  <label className={TEXTAREA_LABEL_CLASS}>Project Description</label>
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
                    className={TEXTAREA_CLASS}
                  />
                </div>
                <Input
                    size="sm"
                    label="Media URL (Preview Image)"
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
                  />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onProjectImageDrop(index, e)}
                  className="rounded-koru-md border border-dashed border-koru-outline-variant bg-koru-surface-container px-3 py-3.5 text-center text-xs text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-high"
                >
                  Drag and drop an image here, or use the button below.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-koru-pill bg-koru-secondary-container px-3 text-xs font-medium text-koru-on-secondary-container transition hover:bg-koru-secondary-container/80 focus-within:ring-2 focus-within:ring-koru-focus">
                    <Upload size={13} />
                    <span>Upload image</span>
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
                    <span className="max-w-[150px] truncate text-koru-caption text-koru-on-surface-variant">
                      {project.mediaName}
                    </span>
                  ) : null}
                </div>
                <Input
                    size="sm"
                    label="Project Resource Link"
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
                  />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-koru-pill bg-koru-secondary-container px-3 text-xs font-medium text-koru-on-secondary-container transition hover:bg-koru-secondary-container/80 focus-within:ring-2 focus-within:ring-koru-focus">
                    <Upload size={13} />
                    <span>Upload PDF</span>
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
                    <span className="max-w-[150px] truncate text-koru-caption text-koru-on-surface-variant">
                      {project.projectFileName}
                    </span>
                  ) : null}
                </div>
                <div className="flex justify-end border-t border-koru-outline-faint pt-2">
                  <Button
                    variant="error"
                    size="sm"
                    startIcon={<Trash2 size={13} />}
                    onClick={() =>
                      updateProfile(
                        "projects",
                        profile.projects.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <span>Remove project</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-[140px]">
                <h3 className="font-display text-koru-heading text-koru-on-surface">
                  {project.title || "Untitled project"}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-koru-on-surface-variant">{project.description}</p>
                {isProjectAssetUrl(project.projectUrl) ? (
                  <div className="mt-4 border-t border-koru-outline-faint pt-4">
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-koru-pill bg-koru-secondary-container px-3 text-xs font-medium text-koru-on-secondary-container transition hover:bg-koru-secondary-container/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 focus-visible:ring-offset-koru-surface"
                    >
                      <span>Open {project.projectFileName || "project"}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        ))}
      </div>

      {editMode ? (
        <Button
          variant="outlined"
          className="mt-6"
          startIcon={<Plus size={14} />}
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
        >
          <span>Add project</span>
        </Button>
      ) : null}
    </Card>
  );
}
