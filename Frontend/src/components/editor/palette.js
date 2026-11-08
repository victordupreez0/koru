// The only colours the editor offers. Text colours are stored as CSS variables;
// block backgrounds are stored by name and mapped to a token when rendered.

export const TEXT_COLORS = [
    { label: "Default", color: null },
    { label: "Purple", color: "var(--color-koru-primary)" },
    { label: "Gray", color: "var(--color-koru-on-surface-variant)" },
    { label: "Blue", color: "var(--color-koru-info)" },
    { label: "Green", color: "var(--color-koru-success)" },
    { label: "Amber", color: "var(--color-koru-warning)" },
    { label: "Red", color: "var(--color-koru-error)" },
];

export const BACKGROUNDS = {
    gray: { label: "Gray", color: "var(--color-koru-surface-container-high)" },
    purple: { label: "Purple", color: "var(--color-koru-primary-subtle)" },
    blue: { label: "Blue", color: "var(--color-koru-info-soft)" },
    green: { label: "Green", color: "var(--color-koru-success-soft)" },
    amber: { label: "Amber", color: "var(--color-koru-warning-soft)" },
    red: { label: "Red", color: "var(--color-koru-error-container)" },
};

export const FONT_SIZES = [
    { label: "Small", value: "0.75rem" },
    { label: "Normal", value: null },
    { label: "Large", value: "1.25rem" },
    { label: "X-Large", value: "1.75rem" },
];
