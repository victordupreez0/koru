import { Extension } from "@tiptap/core";
import TextStyle from "@tiptap/extension-text-style";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { newBlockId, toEmbed } from "./pageDocument";
import { BACKGROUNDS } from "./palette";
import { nodesForFiles } from "./uploads";

/** Text style that can also carry a font size. */
export const TextStyleWithSize = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: (el) => el.style.fontSize || null,
                renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
            },
        };
    },
});

/** Block background colour, saved in the document by palette name. */
export const BlockBackground = Extension.create({
    name: "blockBackground",
    addGlobalAttributes() {
        return [{
            types: ["paragraph", "heading"],
            attributes: {
                background: {
                    default: null,
                    parseHTML: (el) => (BACKGROUNDS[el.dataset.background] ? el.dataset.background : null),
                    renderHTML: (attrs) => {
                        const bg = BACKGROUNDS[attrs.background];
                        return bg ? { "data-background": attrs.background, style: `background-color: ${bg.color}` } : {};
                    },
                },
            },
        }];
    },
});

/** Every interactive block needs a unique id; duplicating or pasting one gets a new id. */
export const UniqueBlockIds = Extension.create({
    name: "uniqueBlockIds",
    addProseMirrorPlugins() {
        return [new Plugin({
            key: new PluginKey("uniqueBlockIds"),
            appendTransaction(transactions, _old, state) {
                if (!transactions.some((t) => t.docChanged)) return null;
                const seen = new Set();
                let tr = null;
                state.doc.descendants((node, pos) => {
                    if (node.attrs.blockId === undefined) return;
                    if (node.attrs.blockId && !seen.has(node.attrs.blockId)) {
                        seen.add(node.attrs.blockId);
                        return;
                    }
                    tr ??= state.tr;
                    tr.setNodeMarkup(pos, undefined, { ...node.attrs, blockId: newBlockId() });
                });
                return tr;
            },
        })];
    },
});

/** Keeps an empty line at the end so you can always type after a block at the bottom. */
export const TrailingParagraph = Extension.create({
    name: "trailingParagraph",
    addProseMirrorPlugins() {
        const editor = this.editor;
        return [new Plugin({
            key: new PluginKey("trailingParagraph"),
            appendTransaction(_transactions, _old, state) {
                if (!editor.isEditable || state.doc.lastChild?.isTextblock) return null;
                return state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create());
            },
        })];
    },
});

const KEEP_PASTED_STYLES = /^(font-weight|font-style|text-decoration)/i;

/**
 * Pasted Word or web content brings its own fonts and colours. Keep bold, italic and
 * underline, drop the rest so pages stay on the design system's type and colour.
 * Copy and paste inside the editor (data-pm-slice) is left alone.
 */
export function cleanPastedHtml(html) {
    if (html.includes("data-pm-slice")) return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("[style]").forEach((el) => {
        const kept = el.getAttribute("style").split(";").map((s) => s.trim()).filter((s) => KEEP_PASTED_STYLES.test(s));
        if (kept.length) el.setAttribute("style", kept.join(";"));
        else el.removeAttribute("style");
    });
    return doc.body.innerHTML;
}

/** Paste or drop an image or file to upload it; paste a video link on an empty line to embed it. */
export const PasteAndDrop = Extension.create({
    name: "pasteAndDrop",
    addProseMirrorPlugins() {
        const editor = this.editor;
        return [new Plugin({
            key: new PluginKey("pasteAndDrop"),
            props: {
                transformPastedHTML: cleanPastedHtml,
                handlePaste(view, event) {
                    const files = [...(event.clipboardData?.files ?? [])];
                    if (files.length) {
                        editor.chain().focus().insertContent(nodesForFiles(files)).run();
                        return true;
                    }
                    const text = event.clipboardData?.getData("text/plain")?.trim();
                    const { $from, empty } = view.state.selection;
                    if (empty && $from.parent.type.name === "paragraph" && !$from.parent.content.size && toEmbed(text)) {
                        editor.chain().focus().insertContent({ type: "embed", attrs: { url: text } }).run();
                        return true;
                    }
                    return false;
                },
                handleDrop(view, event, _slice, moved) {
                    const files = [...(event.dataTransfer?.files ?? [])];
                    if (moved || !files.length) return false;
                    const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    editor.chain().focus().insertContentAt(at?.pos ?? view.state.selection.from, nodesForFiles(files)).run();
                    return true;
                },
            },
        })];
    },
});
