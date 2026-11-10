// How a page is stored: { title, sections: [{ id, type: "text", content: <Tiptap doc> }] }.
// New pages always have exactly one section holding one document, so blocks can be
// dragged and undone freely. Older pages had many sections plus raw HTML embeds; those
// are converted into typed blocks on load, so no stored HTML is ever injected into the page.

const SECTION_ID = "main";

export const emptyDoc = () => ({ type: "doc", content: [{ type: "paragraph" }] });

const paragraph = (text) => ({
    type: "paragraph",
    ...(text ? { content: [{ type: "text", text }] } : {}),
});

/** Only absolute http(s) URLs are allowed anywhere a URL ends up in the page. */
export function safeUrl(value) {
    try {
        const url = new URL(String(value ?? "").trim());
        return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch {
        return null;
    }
}

const YOUTUBE_ID = /^[\w-]{11}$/;

function youtubeId(url) {
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return url.pathname.split("/")[1];
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const [, kind, id] = url.pathname.split("/");
    return ["embed", "shorts", "live", "v"].includes(kind) ? id : null;
}

/**
 * Turns a link someone pasted into a URL that is safe to put in an iframe.
 * The iframe src is always computed from this list, never read from stored data.
 * Returns { src, provider } or null when the site isn't supported.
 */
export function toEmbed(rawUrl) {
    const href = safeUrl(rawUrl);
    if (!href) return null;
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    const id = youtubeId(url);
    if (id && YOUTUBE_ID.test(id)) return { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${id}` };

    if (host === "vimeo.com" && /^\d+$/.test(parts[0] ?? "")) return { provider: "Vimeo", src: `https://player.vimeo.com/video/${parts[0]}` };
    if (host === "player.vimeo.com" && parts[0] === "video") return { provider: "Vimeo", src: `https://player.vimeo.com/video/${parts[1]}` };

    if (host === "docs.google.com") {
        const [kind, d, docId, published] = parts;
        if (d !== "d" || !docId) return kind === "forms" ? { provider: "Google Forms", src: `https://docs.google.com/${parts.join("/")}?embedded=true` } : null;
        if (kind === "presentation") {
            return docId === "e"
                ? { provider: "Google Slides", src: `https://docs.google.com/presentation/d/e/${published}/embed` }
                : { provider: "Google Slides", src: `https://docs.google.com/presentation/d/${docId}/embed` };
        }
        if (kind === "document") return { provider: "Google Docs", src: `https://docs.google.com/document/d/${docId}/preview` };
        if (kind === "spreadsheets") return { provider: "Google Sheets", src: `https://docs.google.com/spreadsheets/d/${docId}/preview` };
        if (kind === "forms") return { provider: "Google Forms", src: `https://docs.google.com/forms/d/${docId}/viewform?embedded=true` };
        return null;
    }
    if (host === "drive.google.com" && parts[0] === "file" && parts[1] === "d") return { provider: "Google Drive", src: `https://drive.google.com/file/d/${parts[2]}/preview` };

    if (host === "canva.com" && parts[0] === "design" && parts.length >= 3) return { provider: "Canva", src: `https://www.canva.com/design/${parts[1]}/${parts[2]}/view?embed` };

    if (host === "figma.com" && ["file", "design", "proto", "board"].includes(parts[0])) {
        return { provider: "Figma", src: `https://www.figma.com/embed?embed_host=koru&url=${encodeURIComponent(href)}` };
    }

    // The two tools South African schools use for block coding: Scratch projects and micro:bit programs.
    if (host === "scratch.mit.edu" && parts[0] === "projects" && /^\d+$/.test(parts[1] ?? "")) return { provider: "Scratch", src: `https://scratch.mit.edu/projects/${parts[1]}/embed` };
    if (host === "makecode.microbit.org" && /^_[A-Za-z0-9]+$/.test(parts[0] ?? "")) return { provider: "MakeCode", src: `https://makecode.microbit.org/---run?id=${parts[0]}` };
    return null;
}

/** Converts one old raw-HTML section into safe blocks. DOMParser never runs scripts or loads images. */
function legacyEmbedToBlocks(html) {
    const body = new DOMParser().parseFromString(html ?? "", "text/html").body;

    const img = body.querySelector("img[src]");
    if (img) {
        const src = safeUrl(img.getAttribute("src"));
        const alt = img.getAttribute("alt");
        return src ? [{ type: "image", attrs: { src, alt: alt === "Visual" ? "" : alt } }] : [];
    }

    const iframe = body.querySelector("iframe[src]");
    if (iframe) {
        const url = iframe.getAttribute("src");
        if (toEmbed(url)) return [{ type: "embed", attrs: { url } }];
        const href = safeUrl(url);
        return href ? [{ type: "paragraph", content: [{ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }] }] : [];
    }

    const code = body.querySelector("pre");
    if (code) {
        const text = code.textContent;
        return [{ type: "codeBlock", attrs: { language: null }, ...(text ? { content: [{ type: "text", text }] } : {}) }];
    }

    // Callouts were <div><div>label</div><div>message</div></div>; anything else becomes plain text.
    const box = body.firstElementChild;
    if (box?.children.length === 2) return [{ type: "callout", attrs: { variant: "info" }, content: [paragraph(box.children[1].textContent.trim())] }];
    const text = body.textContent.trim();
    return text ? [paragraph(text)] : [];
}

/** Merges stored sections (old or new) into the single document the editor edits. */
export function toPageDoc(sections) {
    const content = [];
    for (const section of sections ?? []) {
        if (section.type === "embed") content.push(...legacyEmbedToBlocks(section.html));
        else if (section.content?.content) content.push(...section.content.content);
    }
    return content.length ? { type: "doc", content } : emptyDoc();
}

export const fromPageDoc = (doc) => [{ id: SECTION_ID, type: "text", content: doc }];

/** Parses a stored Content string. Unparseable content is kept as text, never thrown away. */
export function parseStoredContent(raw) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
    } catch {
        // Not JSON: an old plain-text or HTML page, handled below.
    }
    const text = new DOMParser().parseFromString(String(raw), "text/html").body.textContent.trim();
    return { sections: fromPageDoc({ type: "doc", content: [paragraph(text)] }) };
}

export function isDocEmpty(doc) {
    const nodes = doc?.content ?? [];
    return nodes.every((n) => n.type === "paragraph" && !n.content?.length);
}

export const newBlockId = () => crypto.randomUUID();
