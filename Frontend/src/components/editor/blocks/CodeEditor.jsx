import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { SQLite, sql } from "@codemirror/lang-sql";
import { HighlightStyle, StreamLanguage, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { pascal } from "@codemirror/legacy-modes/mode/pascal";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// The same colours as the read-only code block, taken from the design tokens.
const theme = EditorView.theme({
    "&": { backgroundColor: "var(--color-koru-inverse-surface)", color: "var(--color-koru-inverse-on-surface)", fontSize: "0.875rem", borderRadius: "var(--radius-koru-md)" },
    "&.cm-focused": { outline: "2px solid var(--color-koru-focus)", outlineOffset: "1px" },
    ".cm-scroller": { fontFamily: '"Fira Code", Consolas, monospace', lineHeight: "1.6", borderRadius: "var(--radius-koru-md)" },
    ".cm-content": { caretColor: "var(--color-koru-inverse-on-surface)", padding: "0.75rem 0" },
    ".cm-gutters": { backgroundColor: "transparent", color: "var(--color-koru-outline)", border: "none" },
    ".cm-activeLine": { backgroundColor: "rgb(255 255 255 / 0.06)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--color-koru-inverse-on-surface)" },
    ".cm-cursor": { borderLeftColor: "var(--color-koru-inverse-on-surface)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgb(255 255 255 / 0.2) !important" },
    ".cm-matchingBracket": { backgroundColor: "rgb(255 255 255 / 0.18)", outline: "none" },
}, { dark: true });

const colours = syntaxHighlighting(HighlightStyle.define([
    { tag: [t.keyword, t.operatorKeyword, t.modifier, t.controlKeyword, t.definitionKeyword], color: "var(--color-koru-inverse-primary)" },
    { tag: [t.string, t.special(t.string), t.character], color: "var(--color-koru-success-soft)" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "var(--color-koru-warning-soft)" },
    { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--color-koru-outline-variant)", fontStyle: "italic" },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.className, t.typeName, t.tagName], color: "var(--color-koru-info-soft)" },
    { tag: [t.propertyName, t.attributeName], color: "var(--color-koru-tertiary-container)" },
]));

const LANGUAGES = {
    python: () => [python(), indentUnit.of("    ")],
    javascript: () => [javascript()],
    sql: () => [sql({ dialect: SQLite, upperCaseKeywords: true })],
    web: () => [html()],
    pascal: () => [StreamLanguage.define(pascal)],
};

const SETUP = { foldGutter: false, autocompletion: false, highlightSelectionMatches: false, searchKeymap: false };

/** A real code editor (CodeMirror). Loaded only when a page has runnable code on it. */
export default function CodeEditor({ value, onChange, language, readOnly = false, minHeight = "7rem", maxHeight = "26rem", label = "Code" }) {
    const extensions = useMemo(() => [theme, colours, EditorView.contentAttributes.of({ "aria-label": label }), ...(LANGUAGES[language]?.() ?? [])], [language, label]);
    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme="none"
            basicSetup={SETUP}
            indentWithTab
            readOnly={readOnly}
            editable={!readOnly}
            minHeight={minHeight}
            maxHeight={maxHeight}
        />
    );
}
