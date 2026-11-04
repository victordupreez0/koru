import React from "react";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { isValidUrl } from "../pages/profile/profileUtils";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { Card } from "./UI";

// linkEntries: [[label, url], ...]  — all 4 links are shown,
// invalid/empty ones are styled grey and clicks are prevented.
export default function ProfileLinks({ linkEntries }) {
  return (
    <Card as="section" variant="outlined" tone="surface" padding="lg" radius="xl">
      <ProfileSectionHeader icon={<LinkIcon size={20} />}>Connected Platforms</ProfileSectionHeader>

      <div className="flex flex-wrap gap-2.5">
        {linkEntries.map(([label, url]) => (
          <a
            key={label}
            href={isValidUrl(url) ? url : undefined}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-8 items-center gap-1.5 rounded-koru-pill px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 focus-visible:ring-offset-koru-surface ${
              isValidUrl(url)
                ? "bg-koru-secondary-container text-koru-on-secondary-container hover:bg-koru-secondary-container/80"
                : "cursor-not-allowed bg-koru-surface-container text-koru-on-surface-variant/60"
            }`}
            onClick={(e) => {
              if (!isValidUrl(url)) e.preventDefault();
            }}
          >
            <span>{label}</span>
            <ExternalLink size={12} />
          </a>
        ))}
      </div>
    </Card>
  );
}
