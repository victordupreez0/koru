import React from "react";
import { Download, Edit3, Eye, EyeOff, Sparkles } from "lucide-react";
import { Alert, Badge, Button } from "./UI";

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
    <div className="mb-4 flex select-none flex-col gap-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Badge variant="primary">
            <Sparkles size={11} />
            <span>Verified University Profile</span>
          </Badge>
          <h1 className="mt-4 font-display text-koru-display text-koru-on-surface">Professional Profile Builder</h1>
          <p className="mt-3 max-w-3xl text-koru-body text-koru-on-surface-variant">
            Build a portfolio-rich profile with university-verified context, export an ATS-ready
            mini-CV, and control what is publicly visible.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={editMode ? "filled" : "outlined"}
            onClick={() => setEditMode((v) => !v)}
            disabled={publicRoute}
            startIcon={<Edit3 size={14} />}
          >
            <span>{editMode ? "Finish Editing" : "Edit Profile"}</span>
          </Button>
          <Button
            variant="outlined"
            onClick={() => setViewAsPublic((v) => !v)}
            disabled={publicRoute}
            startIcon={viewAsPublic ? <EyeOff size={14} /> : <Eye size={14} />}
          >
            <span>{viewAsPublic ? "Exit Preview" : "Preview Public"}</span>
          </Button>
          <Button
            variant="filled"
            onClick={handlePdfExport}
            disabled={isExporting}
            startIcon={<Download size={14} />}
          >
            <span>{isExporting ? "Exporting..." : "Export to PDF"}</span>
          </Button>
        </div>
      </div>

      {saveError && (
        <Alert variant="error" className="mt-4">
          {saveError}
        </Alert>
      )}
    </div>
  );
}
