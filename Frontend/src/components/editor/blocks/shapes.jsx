/* eslint-disable react-refresh/only-export-components -- the token helpers live beside <Token> on purpose */
import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Pattern tokens: "<shape>:<colour>" (e.g. "circle:red") or "=<text>" for a number, letter
 * or emoji (e.g. "=7", "=🐝"). Shared with the server and the showcase content.
 */
export const SHAPES = ["circle", "square", "triangle", "star", "diamond", "heart", "hexagon", "arrow-up", "arrow-right", "arrow-down", "arrow-left"];

// The one place raw colours are allowed: bright, friendly and easy to tell apart.
export const COLORS = {
    red: "#E5383B",
    orange: "#F48C06",
    yellow: "#FFC300",
    green: "#2DB84C",
    blue: "#2F80ED",
    purple: "#8E44DA",
    pink: "#F25CA2",
    gray: "#7D8590",
};

/** { kind: "shape", shape, color } | { kind: "text", text } | null for anything else. */
export function parseToken(value) {
    if (typeof value !== "string" || value === "") return null;
    if (value.startsWith("=")) return value.length > 1 ? { kind: "text", text: value.slice(1) } : null;
    const [shape, color] = value.split(":");
    if (!SHAPES.includes(shape) || !(color in COLORS)) return null;
    return { kind: "shape", shape, color };
}

/** Words a screen reader says for a token: "red circle", "7". */
export function tokenLabel(value) {
    const t = parseToken(value);
    if (!t) return "empty";
    return t.kind === "text" ? t.text : `${t.color} ${t.shape.replace("-", " ")}`;
}

const polygon = (sides, outer, inner = null, turn = -90) =>
    Array.from({ length: inner ? sides * 2 : sides }, (_, i) => {
        const r = inner && i % 2 ? inner : outer;
        const a = ((turn + (i * 360) / (inner ? sides * 2 : sides)) * Math.PI) / 180;
        return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");

const STAR = polygon(5, 44, 19);
const HEXAGON = polygon(6, 42, null, 0);
const ARROW = "M50 8 L90 50 H66 V92 H34 V50 H10 Z";
const ARROW_TURN = { "arrow-up": 0, "arrow-right": 90, "arrow-down": 180, "arrow-left": 270 };

function ShapePath({ shape }) {
    switch (shape) {
        case "circle": return <circle cx="50" cy="50" r="40" />;
        case "square": return <rect x="12" y="12" width="76" height="76" rx="12" />;
        case "triangle": return <polygon points="50,10 92,86 8,86" />;
        case "star": return <polygon points={STAR} />;
        case "diamond": return <polygon points="50,6 92,50 50,94 8,50" />;
        case "heart": return <path d="M50 88 C22 68 8 52 8 34 C8 20 18 10 31 10 C40 10 46 15 50 23 C54 15 60 10 69 10 C82 10 92 20 92 34 C92 52 78 68 50 88 Z" />;
        case "hexagon": return <polygon points={HEXAGON} />;
        default: return <path d={ARROW} transform={`rotate(${ARROW_TURN[shape] ?? 0} 50 50)`} />;
    }
}

/** Draws one token as crisp inline SVG (shapes) or a rounded tile (text, numbers, emoji). */
export function Token({ value, size = 48, className }) {
    const t = parseToken(value);
    if (!t) return null;
    if (t.kind === "text") {
        return (
            <span
                role="img"
                aria-label={t.text}
                className={cn("inline-flex shrink-0 items-center justify-center rounded-koru-md bg-koru-surface-container-highest font-bold leading-none text-koru-on-surface shadow-koru-xs", className)}
                style={{ width: size, height: size, fontSize: size * (t.text.length > 2 ? 0.32 : 0.5) }}
            >
                {t.text}
            </span>
        );
    }
    return (
        <svg role="img" aria-label={tokenLabel(value)} viewBox="0 0 100 100" width={size} height={size} className={cn("shrink-0", className)}>
            <g fill={COLORS[t.color]} stroke="rgba(0,0,0,0.18)" strokeWidth="4" strokeLinejoin="round">
                <ShapePath shape={t.shape} />
            </g>
        </svg>
    );
}
