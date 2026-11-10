import React from "react";
import { inline } from "../draft";
import { safeUrl } from "../pageDocument";

/**
 * Instructions inside an activity, with the same light formatting as the page:
 * **bold**, *italic*, `code` and [links](https://…). Rendered as React elements, never as HTML.
 */
export default function Prose({ text, className, as: Tag = "p" }) {
    return (
        <Tag className={className}>
            {inline(text).map((part, i) => {
                const mark = part.marks?.[0];
                if (!mark) return part.text;
                if (mark.type === "bold") return <strong key={i} className="font-semibold">{part.text}</strong>;
                if (mark.type === "italic") return <em key={i}>{part.text}</em>;
                if (mark.type === "code") return <code key={i} className="rounded-koru-xs bg-koru-primary-subtle px-1 py-0.5 font-mono text-[0.875em] text-koru-primary">{part.text}</code>;
                const href = safeUrl(mark.attrs.href);
                return href ? <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-koru-primary underline underline-offset-2">{part.text}</a> : part.text;
            })}
        </Tag>
    );
}
