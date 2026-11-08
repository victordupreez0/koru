import React, { useRef, useEffect, useState, useCallback } from "react";
import { useEditor } from "novel";
import {
    Plus,
    GripVertical,
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Code2,
    Copy,
    CopyPlus,
    Trash2,
    Palette,
    ChevronRight,
} from "lucide-react";
import { BACKGROUNDS, TEXT_COLORS } from "./editor/palette";

// ── Turn Into options (command + args for single-chain execution) ──
const TURN_INTO_OPTIONS = [
    { label: "Text", icon: Type, command: "setParagraph", args: undefined },
    { label: "Heading 1", icon: Heading1, command: "setHeading", args: { level: 1 } },
    { label: "Heading 2", icon: Heading2, command: "setHeading", args: { level: 2 } },
    { label: "Heading 3", icon: Heading3, command: "setHeading", args: { level: 3 } },
    { label: "Bullet List", icon: List, command: "toggleBulletList", args: undefined },
    { label: "Numbered List", icon: ListOrdered, command: "toggleOrderedList", args: undefined },
    { label: "Checklist", icon: ListChecks, command: "toggleTaskList", args: undefined },
    { label: "Quote", icon: Quote, command: "toggleBlockquote", args: undefined },
    { label: "Code Block", icon: Code2, command: "toggleCodeBlock", args: undefined },
];

const BG_OPTIONS = [{ key: null, label: "None", color: null }, ...Object.entries(BACKGROUNDS).map(([key, v]) => ({ key, ...v }))];

// Top-level DOM children map 1:1 to document children, apart from editor widgets.
const topLevelBlocks = (editor) =>
    Array.from(editor.view.dom.children).filter((el) => !el.matches(".ProseMirror-gapcursor, .ProseMirror-widget"));

// Where a dragged block would land: the gap between blocks nearest the pointer's height.
function dropGap(editor, clientY, wrapper) {
    const blocks = topLevelBlocks(editor);
    let index = blocks.findIndex((el) => {
        const r = el.getBoundingClientRect();
        return clientY < r.top + r.height / 2;
    });
    if (index === -1) index = blocks.length;
    const wrapperTop = wrapper.getBoundingClientRect().top;
    const top = index < blocks.length ? blocks[index].getBoundingClientRect().top - 3 : blocks[blocks.length - 1].getBoundingClientRect().bottom + 3;
    return { index, top: top - wrapperTop };
}

function moveBlock(editor, fromIndex, toIndex) {
    const { doc, tr } = editor.state;
    if (toIndex === fromIndex || toIndex === fromIndex + 1) return;
    const posOf = (i) => {
        let pos = 0;
        for (let n = 0; n < i; n++) pos += doc.child(n).nodeSize;
        return pos;
    };
    const node = doc.child(fromIndex);
    const from = posOf(fromIndex);
    tr.delete(from, from + node.nodeSize);
    tr.insert(tr.mapping.map(posOf(toIndex)), node);
    editor.view.dispatch(tr);
    editor.view.focus();
}

export default function NovelBlockMenu() {
    const { editor } = useEditor();
    const [handlePos, setHandlePos] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [subMenu, setSubMenu] = useState(null); // "turnInto" | "color" | null
    const [hoveredBlock, setHoveredBlock] = useState(null);
    const containerRef = useRef(null);
    const menuRef = useRef(null);
    const handleHovered = useRef(false);
    const savedBlockPos = useRef(null); // Store block position when menu opens
    const draggedIndex = useRef(null);
    const [dropTop, setDropTop] = useState(null);
    const [openUp, setOpenUp] = useState(false);

    // Find the closest top-level block by Y position
    const getClosestBlock = useCallback((clientY) => {
        if (!editor) return null;
        let closest = null;
        let closestDist = Infinity;
        for (const child of topLevelBlocks(editor)) {
            const rect = child.getBoundingClientRect();
            const inside = clientY >= rect.top - 4 && clientY <= rect.bottom + 4;
            const dist = (inside ? 0 : 1e6) + Math.abs(clientY - (rect.top + rect.height / 2));
            if (dist < closestDist) {
                closestDist = dist;
                closest = child;
            }
        }
        return closest;
    }, [editor]);

    // Track mouse movement on the wrapper so the padding/gutter area is included
    useEffect(() => {
        if (!editor) return;
        const wrapper = editor.view.dom.closest('.novel-editor-wrapper');
        if (!wrapper) return;

        const hoverArea = wrapper.parentElement || wrapper;

        const onMouseMove = (e) => {
            if (menuOpen) return;
            const block = getClosestBlock(e.clientY);
            if (!block) {
                setHandlePos(null);
                setHoveredBlock(null);
                return;
            }

            const wrapperRect = wrapper.getBoundingClientRect();
            const blockRect = block.getBoundingClientRect();
            // Get the first line's height for centering
            const computedStyle = window.getComputedStyle(block);
            const fontSize = parseFloat(computedStyle.fontSize) || 16;
            const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.5;
            setHandlePos({
                top: blockRect.top - wrapperRect.top,
                firstLineHeight: lineHeight,
            });
            setHoveredBlock(block);
        };

        const onMouseLeave = (e) => {
            if (menuOpen) return;
            const related = e.relatedTarget;
            if (hoverArea.contains(related)) return;
            if (containerRef.current && containerRef.current.contains(related)) return;
            // Small delay to allow moving to handles
            setTimeout(() => {
                if (!handleHovered.current && !menuOpen) {
                    setHandlePos(null);
                    setHoveredBlock(null);
                }
            }, 100);
        };

        hoverArea.addEventListener("mousemove", onMouseMove);
        hoverArea.addEventListener("mouseleave", onMouseLeave);
        return () => {
            hoverArea.removeEventListener("mousemove", onMouseMove);
            hoverArea.removeEventListener("mouseleave", onMouseLeave);
        };
    }, [editor, menuOpen, getClosestBlock]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
                setSubMenu(null);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

    // ── Helper: find a DOM block's node and start position in the document ──
    const getBlockPos = useCallback((block) => {
        if (!block || !editor) return null;
        const { doc } = editor.state;
        const index = topLevelBlocks(editor).indexOf(block);
        if (index < 0 || index >= doc.childCount) return null;
        let blockStart = 0;
        for (let i = 0; i < index; i++) blockStart += doc.child(i).nodeSize;
        return { blockStart, node: doc.child(index) };
    }, [editor]);

    // Dragging the grip moves the whole block to the gap shown by the purple line.
    const handleDragStart = useCallback((e) => {
        const index = topLevelBlocks(editor).indexOf(hoveredBlock);
        if (index < 0) {
            e.preventDefault();
            return;
        }
        draggedIndex.current = index;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", hoveredBlock.textContent || "");
        e.dataTransfer.setDragImage(hoveredBlock, 0, 0);
    }, [editor, hoveredBlock]);

    useEffect(() => {
        if (!editor) return;
        const wrapper = editor.view.dom.closest(".novel-editor-wrapper");
        const area = wrapper?.parentElement;
        if (!area) return;

        const onDragOver = (e) => {
            if (draggedIndex.current === null) return;
            e.preventDefault();
            setDropTop(dropGap(editor, e.clientY, wrapper).top);
        };
        // Capture phase, so ProseMirror doesn't also treat this as dropped text.
        const onDrop = (e) => {
            if (draggedIndex.current === null) return;
            e.preventDefault();
            e.stopPropagation();
            moveBlock(editor, draggedIndex.current, dropGap(editor, e.clientY, wrapper).index);
            draggedIndex.current = null;
            setDropTop(null);
        };
        const onDragEnd = () => {
            draggedIndex.current = null;
            setDropTop(null);
        };

        area.addEventListener("dragover", onDragOver, true);
        area.addEventListener("drop", onDrop, true);
        area.addEventListener("dragend", onDragEnd, true);
        return () => {
            area.removeEventListener("dragover", onDragOver, true);
            area.removeEventListener("drop", onDrop, true);
            area.removeEventListener("dragend", onDragEnd, true);
        };
    }, [editor]);

    // ── Action Handlers ──
    const selectBlock = useCallback(() => {
        const info = getBlockPos(hoveredBlock);
        if (!info) {
            editor?.commands.focus();
            return;
        }
        const { blockStart, node } = info;
        // For empty blocks, just place cursor inside; for blocks with content, select all
        if (node.textContent.length === 0) {
            editor.chain().focus().setTextSelection(blockStart + 1).run();
        } else {
            editor.chain().focus().setTextSelection({ from: blockStart + 1, to: blockStart + node.nodeSize - 1 }).run();
        }
    }, [hoveredBlock, editor, getBlockPos]);

    const handleAddBlock = useCallback(() => {
        const info = getBlockPos(hoveredBlock);
        if (!info) return;
        const insertPos = info.blockStart + info.node.nodeSize;
        // Inserting a "/" opens the slash menu straight away, like Notion's plus button.
        editor.chain().insertContentAt(insertPos, { type: "paragraph", content: [{ type: "text", text: "/" }] }).setTextSelection(insertPos + 2).focus().run();
    }, [hoveredBlock, editor, getBlockPos]);

    const handleCopy = useCallback(() => {
        if (!hoveredBlock) return;
        navigator.clipboard.writeText(hoveredBlock.textContent || "");
        setMenuOpen(false);
        setSubMenu(null);
    }, [hoveredBlock]);

    const handleDuplicate = useCallback(() => {
        const info = getBlockPos(hoveredBlock);
        if (info) {
            const { blockStart, node } = info;
            editor.chain().focus().insertContentAt(blockStart + node.nodeSize, node.toJSON()).run();
        }
        setMenuOpen(false);
        setSubMenu(null);
    }, [hoveredBlock, editor, getBlockPos]);

    const handleDelete = useCallback(() => {
        const info = getBlockPos(hoveredBlock);
        if (info) {
            const { blockStart, node } = info;
            editor.chain().focus().deleteRange({ from: blockStart, to: blockStart + node.nodeSize }).run();
        }
        setMenuOpen(false);
        setSubMenu(null);
    }, [hoveredBlock, editor, getBlockPos]);

    const handleTurnInto = useCallback(({ command, args }) => {
        if (!editor) return;
        const pos = savedBlockPos.current;
        setMenuOpen(false);
        setSubMenu(null);
        setHandlePos(null);
        setHoveredBlock(null);

        setTimeout(() => {
            if (pos !== null) {
                // Use ProseMirror transaction directly — no focus/selection needed
                const { state, dispatch } = editor.view;
                const $pos = state.doc.resolve(pos);
                const blockStart = $pos.before($pos.depth || 1);
                const node = state.doc.nodeAt(blockStart);

                if (node) {
                    const schema = state.schema;
                    let tr;

                    if (command === "setHeading" && args?.level) {
                        tr = state.tr.setNodeMarkup(blockStart, schema.nodes.heading, { level: args.level });
                    } else if (command === "setParagraph") {
                        tr = state.tr.setNodeMarkup(blockStart, schema.nodes.paragraph);
                    } else {
                        // For toggles (lists, quotes, code), fall back to chain
                        editor.chain().focus().setTextSelection(pos)[command](args).run();
                        return;
                    }

                    dispatch(tr);
                    editor.view.focus();
                }
            }
        }, 50);
    }, [editor]);

    const handleTextColor = useCallback((color) => {
        if (!editor) return;
        selectBlock();
        if (color) {
            editor.chain().focus().setColor(color).run();
        } else {
            editor.chain().focus().unsetColor().run();
        }
        setMenuOpen(false);
        setSubMenu(null);
    }, [editor, selectBlock]);

    const handleBgColor = useCallback((background) => {
        const info = getBlockPos(hoveredBlock);
        if (info) {
            const { blockStart, node } = info;
            editor.chain().focus().command(({ tr }) => {
                tr.setNodeMarkup(blockStart, undefined, { ...node.attrs, background });
                return true;
            }).run();
        }
        setMenuOpen(false);
        setSubMenu(null);
    }, [editor, hoveredBlock, getBlockPos]);

    if (!handlePos) return null;

    const dropLine = dropTop === null ? null : (
        <div aria-hidden="true" className="pointer-events-none absolute z-30 h-[3px] rounded-koru-pill bg-koru-primary" style={{ top: dropTop, left: 0, right: 0 }} />
    );

    // Blocks like images and quizzes can be moved, copied and deleted but not restyled as text.
    const hovered = getBlockPos(hoveredBlock)?.node;
    const isTextual = !!hovered && !hovered.isAtom;
    const canHaveBackground = hovered?.type.name === "paragraph" || hovered?.type.name === "heading";

    return (
        <>
        {dropLine}
        <div
            ref={containerRef}
            className="absolute flex items-center gap-0.5 z-40"
            style={{
                top: handlePos.top,
                left: -52,
                height: handlePos.firstLineHeight || 'auto',
            }}
            onMouseEnter={() => { handleHovered.current = true; }}
            onMouseLeave={(e) => {
                handleHovered.current = false;
                // Don't hide if moving back to the hover area or into the menu
                const related = e.relatedTarget;
                const wrapper = editor?.view?.dom?.closest('.novel-editor-wrapper');
                const hoverArea = wrapper?.parentElement || wrapper;
                if (hoverArea && hoverArea.contains(related)) return;
                if (menuRef.current && menuRef.current.contains(related)) return;
                if (!menuOpen) {
                    setHandlePos(null);
                    setHoveredBlock(null);
                }
            }}
        >
            {/* Plus button */}
            <button
                type="button"
                onClick={handleAddBlock}
                className="cursor-pointer rounded-koru-sm p-1 text-koru-outline transition-all hover:bg-koru-surface-container-high hover:text-koru-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                title="Add block below"
                aria-label="Add block below"
            >
                <Plus size={16} />
            </button>

            {/* Grip: drag to move, click for the menu */}
            <button
                type="button"
                draggable
                onDragStart={handleDragStart}
                onClick={(e) => {
                    setOpenUp(e.currentTarget.getBoundingClientRect().bottom + 260 > window.innerHeight);
                    // Save the block position before opening the menu
                    const info = getBlockPos(hoveredBlock);
                    savedBlockPos.current = info ? info.blockStart + 1 : null;
                    setMenuOpen(!menuOpen);
                    setSubMenu(null);
                }}
                className="rounded-koru-sm p-1 text-koru-outline transition-all hover:bg-koru-surface-container-high hover:text-koru-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus cursor-grab active:cursor-grabbing"
                title="Drag to move, click for options"
                aria-label="Block options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
            >
                <GripVertical size={16} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    className={`absolute left-0 ${openUp ? "bottom-8" : "top-8"} w-56 rounded-koru-md bg-koru-surface-container-lowest py-1 text-sm text-koru-on-surface shadow-koru-lg ring-1 ring-inset ring-koru-outline-faint z-50`}
                >
                    {isTextual && (
                        <>
                            {/* Turn Into */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-koru-surface-container transition-colors"
                                    onMouseEnter={() => setSubMenu("turnInto")}
                                    onClick={() => setSubMenu("turnInto")}
                                >
                                    <span className="flex items-center gap-2"><Type size={14} /> Turn into</span>
                                    <ChevronRight size={14} className="text-koru-on-surface-variant" />
                                </button>
                                {subMenu === "turnInto" && (
                                    <div className={`absolute left-full ${openUp ? "bottom-0" : "top-0"} ml-1 w-48 rounded-koru-md bg-koru-surface-container-lowest py-1 text-koru-on-surface shadow-koru-lg ring-1 ring-inset ring-koru-outline-faint z-50`}>
                                        {TURN_INTO_OPTIONS.map((opt) => (
                                            <button
                                                type="button"
                                                key={opt.label}
                                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-koru-surface-container transition-colors text-left"
                                                onClick={() => handleTurnInto(opt)}
                                            >
                                                <opt.icon size={14} className="text-koru-on-surface-variant" />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Color */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-koru-surface-container transition-colors"
                                    onMouseEnter={() => setSubMenu("color")}
                                    onClick={() => setSubMenu("color")}
                                >
                                    <span className="flex items-center gap-2"><Palette size={14} /> Color</span>
                                    <ChevronRight size={14} className="text-koru-on-surface-variant" />
                                </button>
                                {subMenu === "color" && (
                                    <div className={`absolute left-full ${openUp ? "bottom-0" : "top-0"} ml-1 w-52 rounded-koru-md bg-koru-surface-container-lowest p-3 text-koru-on-surface shadow-koru-lg ring-1 ring-inset ring-koru-outline-faint z-50`}>
                                        <div className="mb-2 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Text</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {TEXT_COLORS.map((c) => (
                                                <button
                                                    type="button"
                                                    key={c.label}
                                                    title={c.label}
                                                    aria-label={`Text ${c.label}`}
                                                    className="h-6 w-6 cursor-pointer rounded-full ring-1 ring-inset ring-koru-outline-variant transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                                    style={{ backgroundColor: c.color || "var(--color-koru-on-surface)" }}
                                                    onClick={() => handleTextColor(c.color)}
                                                />
                                            ))}
                                        </div>
                                        {canHaveBackground && (
                                            <>
                                                <div className="mb-2 mt-3 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Background</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {BG_OPTIONS.map((c) => (
                                                        <button
                                                            type="button"
                                                            key={c.label}
                                                            title={c.label}
                                                            aria-label={`Background ${c.label}`}
                                                            className="h-6 w-6 cursor-pointer rounded-koru-xs ring-1 ring-inset ring-koru-outline-variant transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                                            style={{ backgroundColor: c.color || "var(--color-koru-surface-container-lowest)" }}
                                                            onClick={() => handleBgColor(c.key)}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="my-1 border-t border-koru-outline-faint" />

                            {/* Copy */}
                            <button
                                type="button"
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-koru-surface-container transition-colors"
                                onClick={handleCopy}
                                onMouseEnter={() => setSubMenu(null)}
                            >
                                <Copy size={14} className="text-koru-on-surface-variant" /> Copy
                            </button>
                        </>
                    )}

                    {/* Duplicate */}
                    <button
                        type="button"
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-koru-surface-container transition-colors"
                        onClick={handleDuplicate}
                        onMouseEnter={() => setSubMenu(null)}
                    >
                        <CopyPlus size={14} className="text-koru-on-surface-variant" /> Duplicate
                    </button>

                    <div className="my-1 border-t border-koru-outline-faint" />

                    {/* Delete */}
                    <button
                        type="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-koru-error hover:bg-koru-error-container transition-colors"
                        onClick={handleDelete}
                        onMouseEnter={() => setSubMenu(null)}
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
        </>
    );
}
