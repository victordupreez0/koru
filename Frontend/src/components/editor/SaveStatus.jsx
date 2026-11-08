import React from "react";
import { Badge } from "../UI";

const STATES = {
    saved: { variant: "success", label: "Saved" },
    dirty: { variant: "neutral", label: "Saving soon…" },
    saving: { variant: "neutral", label: "Saving…" },
    error: { variant: "error", label: "Couldn't save, retrying" },
};

export default function SaveStatus({ status }) {
    const { variant, label } = STATES[status] ?? STATES.saved;
    return <Badge variant={variant} dot role="status" aria-live="polite">{label}</Badge>;
}
