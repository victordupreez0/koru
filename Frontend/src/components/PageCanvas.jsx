import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import NovelEditor from "./NovelEditor";
import { Button, Card, Input } from "./UI";
import { cn } from "../utils/cn";
import { uploadImageToCloudinary } from "../services/cloudinaryService";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Plus,
    X,
    ChevronUp,
    ChevronDown,
    Palette,
    Paperclip,
    AlertCircle,
    Loader
} from "lucide-react";

// Curated brand color options for text
const TEXT_COLORS = [
    { label: "Default", color: "var(--color-koru-on-surface)" },
    { label: "Deep Purple", color: "var(--color-koru-primary)" },
    { label: "Slate Gray", color: "var(--color-koru-on-surface-variant)" },
    { label: "Indigo Blue", color: "var(--color-koru-info)" },
    { label: "Emerald Green", color: "var(--color-koru-success)" },
    { label: "Warm Amber", color: "var(--color-koru-warning)" },
    { label: "Crimson Red", color: "var(--color-koru-error)" },
];

// Presets for quick-select images
const IMAGE_PRESETS = [
    { label: "Abstract Learning Pattern", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" },
    { label: "Design System Grid", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80" },
    { label: "Creative Workspace", url: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1000&q=80" }
];

function ToolbarButton({ className, children, ...props }) {
    return (
        <button
            type="button"
            className={cn(
                "flex cursor-pointer items-center rounded-koru-sm p-1 text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

function MenuItem({ className, children, ...props }) {
    return (
        <button
            type="button"
            className={cn(
                "w-full cursor-pointer rounded-koru-sm px-2 py-1.5 text-left text-xs text-koru-on-surface-variant transition-colors hover:bg-koru-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

const PageCanvas = forwardRef(({
    sections = [],
    setSections,
    isEditing = false,
    placeholder = "Write some beautiful content here..."
}, ref) => {
    const [editorInstance, setEditorInstance] = useState(null);
    const [showEmbedMenu, setShowEmbedMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Embed states
    const [imageUrl, setImageUrl] = useState("");
    const [codeSnippet, setCodeSnippet] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");

    const fileInputRef = useRef(null);
    const editorMapRef = useRef({});

    // Expose serialized sections to parent component on save
    useImperativeHandle(ref, () => ({
        getSections: () => {
            return sections.map(s => {
                if (s.type === "text") {
                    const inst = editorMapRef.current[s.id];
                    return inst ? { ...s, content: inst.getJSON() } : s;
                }
                return s;
            });
        }
    }));

    // Text formatting actions helper
    const handleFormat = (command, val = undefined) => {
        if (!editorInstance) return;
        editorInstance.chain().focus();

        if (command === "heading") {
            editorInstance.chain().focus().toggleHeading({ level: val }).run();
        } else if (command === "paragraph") {
            editorInstance.chain().focus().setParagraph().run();
        } else if (command === "bold") {
            editorInstance.chain().focus().toggleBold().run();
        } else if (command === "italic") {
            editorInstance.chain().focus().toggleItalic().run();
        } else if (command === "underline") {
            editorInstance.chain().focus().toggleUnderline().run();
        } else if (command === "strike") {
            editorInstance.chain().focus().toggleStrike().run();
        } else if (command === "code") {
            editorInstance.chain().focus().toggleCode().run();
        } else if (command === "bullet") {
            editorInstance.chain().focus().toggleBulletList().run();
        } else if (command === "ordered") {
            editorInstance.chain().focus().toggleOrderedList().run();
        } else if (command === "quote") {
            editorInstance.chain().focus().toggleBlockquote().run();
        } else if (command === "color") {
            editorInstance.chain().focus().setColor(val).run();
        }
    };

    // Font size sizing helper (custom spans inside editor)
    const handleFontSize = (sizeName) => {
        if (!editorInstance) return;
        let fontSize = "15px";
        if (sizeName === "small") fontSize = "12px";
        if (sizeName === "large") fontSize = "20px";
        if (sizeName === "xlarge") fontSize = "28px";

        editorInstance.chain().focus().insertContent(`<span style="font-size: ${fontSize}">${editorInstance.state.doc.slice(editorInstance.state.selection.from, editorInstance.state.selection.to).textContent || "Sample Sized Text"}</span>`).run();
    };

    // Image file upload → Cloudinary CDN URL
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = "";
        try {
            setUploading(true);
            setShowEmbedMenu(false);
            const url = await uploadImageToCloudinary(file);
            handleInsertImage(url);
        } catch (err) {
            console.error("Image upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    // Image insertion – adds a new embed section
    const handleInsertImage = (url) => {
        if (!url.trim()) return;
        const html = `<img src="${url.trim()}" alt="Visual" style="width:100%;max-height:340px;object-fit:cover;border-radius:16px;border:1px solid var(--color-koru-outline-variant);box-shadow:var(--shadow-koru-xs);margin:24px 0;display:block;" />`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setImageUrl("");
        setShowEmbedMenu(false);
    };

    // Video insertion – appends to embedsHtml state
    const handleInsertVideo = (url) => {
        if (!url.trim()) return;
        let embedUrl = url.trim();
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            if (match && match[2].length === 11) {
                embedUrl = `https://www.youtube.com/embed/${match[2]}`;
            }
        }
        const html = `<div style="position:relative;width:100%;padding-top:56.25%;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin:24px 0;"><iframe src="${embedUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setYoutubeUrl("");
        setShowEmbedMenu(false);
    };

    // Code embed insertion
    const handleInsertCode = () => {
        if (!codeSnippet.trim()) return;
        const escaped = codeSnippet.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<pre style="background:var(--color-koru-inverse-surface);color:var(--color-koru-inverse-on-surface);padding:20px;border-radius:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin:24px 0;"><code>${escaped}</code></pre>`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setCodeSnippet("");
        setShowEmbedMenu(false);
    };

    // Callout box insertion
    const handleInsertCallout = () => {
        const html = `<div style="padding:20px 24px;background:var(--color-koru-primary-subtle);border-left:4px solid var(--color-koru-primary);border-radius:0 16px 16px 0;margin:24px 0;color:var(--color-koru-on-primary-container);"><div style="font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">ℹ Alert Box</div><div style="font-size:13px;font-weight:500;opacity:0.9;">Enter your notification details or custom block guidelines here.</div></div>`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setShowEmbedMenu(false);
    };

    // Move a section one step up or down
    const moveSection = (id, direction) => {
        setSections(prev => {
            const idx = prev.findIndex(s => s.id === id);
            if (idx === -1) return prev;
            const newIdx = direction === "up" ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
            return next;
        });
    };

    // Remove a section by id
    const removeSection = (id) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    // Add a new empty text editor section at the bottom
    const addTextSection = () => {
        const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
        setSections(prev => [...prev, { id: `text-${Date.now()}`, type: "text", content: emptyDoc }]);
    };

    return (
        <div className="flex-1 flex flex-col bg-transparent">
            {/* Gorgeous Canvas-Style Editor Toolbar */}
            {isEditing && (
                <div className="sticky top-2 z-30 mb-6 flex select-none flex-wrap items-center gap-1 rounded-koru-xl bg-koru-surface-container-high p-2 shadow-koru-md">
                    {/* Heading Selector */}
                    <ToolbarButton onClick={() => handleFormat("paragraph")} title="Paragraph" className="px-2 text-[10px] font-medium">P</ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("heading", 1)} title="Heading 1"><Heading1 size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("heading", 2)} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("heading", 3)} title="Heading 3"><Heading3 size={14} /></ToolbarButton>

                    <div className="mx-1 h-4 w-px bg-koru-outline-variant" />

                    {/* Font size picker dropdown */}
                    <div className="relative group/size">
                        <ToolbarButton className="gap-1 px-2 text-[10px] font-medium">
                            <span>Size</span>
                            <ChevronDown size={10} />
                        </ToolbarButton>
                        <Card
                            variant="elevated"
                            tone="surface"
                            radius="lg"
                            padding="none"
                            className="absolute left-0 mt-1 hidden min-w-[120px] flex-col p-1 group-hover/size:flex"
                        >
                            <MenuItem onClick={() => handleFontSize("small")}>Small (12px)</MenuItem>
                            <MenuItem onClick={() => handleFontSize("normal")}>Normal (15px)</MenuItem>
                            <MenuItem onClick={() => handleFontSize("large")} className="font-medium">Large (20px)</MenuItem>
                            <MenuItem onClick={() => handleFontSize("xlarge")} className="text-sm font-medium">X-Large (28px)</MenuItem>
                        </Card>
                    </div>

                    <div className="mx-1 h-4 w-px bg-koru-outline-variant" />

                    {/* Standard Mark Styles */}
                    <ToolbarButton onClick={() => handleFormat("bold")} title="Bold"><Bold size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("italic")} title="Italic"><Italic size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("underline")} title="Underline"><Underline size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("strike")} title="Strikethrough"><Strikethrough size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("code")} title="Inline Code"><Code size={14} /></ToolbarButton>

                    <div className="mx-1 h-4 w-px bg-koru-outline-variant" />

                    {/* Color Picker dropdown */}
                    <div className="relative">
                        <ToolbarButton
                            onClick={() => setShowColorMenu(!showColorMenu)}
                            className="gap-0.5"
                            title="Text Color"
                        >
                            <Palette size={14} />
                            <ChevronDown size={10} />
                        </ToolbarButton>
                        {showColorMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowColorMenu(false)} />
                                <Card
                                    variant="elevated"
                                    tone="surface"
                                    radius="xl"
                                    padding="none"
                                    className="absolute left-0 z-30 mt-1.5 flex min-w-[140px] flex-col gap-1 p-2"
                                >
                                    <div className="mb-1 px-1 text-[9px] font-medium uppercase tracking-wider text-koru-on-surface-variant">Brand Palette</div>
                                    {TEXT_COLORS.map(c => (
                                        <MenuItem
                                            key={c.label}
                                            onClick={() => {
                                                handleFormat("color", c.color);
                                                setShowColorMenu(false);
                                            }}
                                            className="flex items-center gap-2 font-medium"
                                        >
                                            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-koru-outline-variant" style={{ backgroundColor: c.color || "currentColor" }} />
                                            <span>{c.label}</span>
                                        </MenuItem>
                                    ))}
                                </Card>
                            </>
                        )}
                    </div>

                    <div className="mx-1 h-4 w-px bg-koru-outline-variant" />

                    {/* Lists and Quotes */}
                    <ToolbarButton onClick={() => handleFormat("bullet")} title="Bullet List"><List size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("ordered")} title="Numbered List"><ListOrdered size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => handleFormat("quote")} title="Blockquote"><Quote size={14} /></ToolbarButton>

                    <div className="mx-1 h-4 w-px bg-koru-outline-variant" />

                    {/* Interactive "+ Insert Embed" Menu */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <div className="relative">
                        <Button
                            variant="tonal"
                            size="sm"
                            onClick={() => setShowEmbedMenu(!showEmbedMenu)}
                            disabled={uploading}
                            startIcon={<Plus size={11} />}
                            className="uppercase tracking-wider"
                        >
                            {uploading ? "Uploading…" : "Insert Embed"}
                        </Button>
                        {showEmbedMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowEmbedMenu(false)} />
                                <Card
                                    variant="elevated"
                                    tone="surface"
                                    radius="2xl"
                                    padding="none"
                                    className="absolute left-0 z-30 mt-1.5 flex min-w-[320px] flex-col gap-3 p-4 md:left-auto md:right-0"
                                >
                                    <div className="mb-0.5 flex items-center justify-between pb-1.5">
                                        <span className="text-[10px] font-medium uppercase tracking-widest text-koru-on-surface-variant">Media Embed Suite</span>
                                        <ToolbarButton onClick={() => setShowEmbedMenu(false)} title="Close" aria-label="Close embed menu"><X size={12} /></ToolbarButton>
                                    </div>

                                    {/* Image section */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-medium uppercase text-koru-on-surface-variant">Insert Image</span>
                                        <Button
                                            variant="outlined"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            startIcon={<Paperclip size={12} />}
                                        >
                                            {uploading ? "Uploading…" : "Upload from device"}
                                        </Button>
                                        <div className="flex items-start gap-2">
                                            <Input
                                                size="sm"
                                                type="text"
                                                aria-label="Image URL"
                                                placeholder="Or paste image URL..."
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                containerClassName="flex-1"
                                            />
                                            <Button onClick={() => handleInsertImage(imageUrl)} className="uppercase">Add</Button>
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {IMAGE_PRESETS.map((p, idx) => (
                                                <button
                                                    key={p.label}
                                                    type="button"
                                                    onClick={() => handleInsertImage(p.url)}
                                                    className="max-w-[140px] cursor-pointer truncate rounded-koru-sm bg-koru-surface-container px-2 py-1 text-left text-[9px] font-medium text-koru-on-surface-variant transition-colors hover:bg-koru-primary-container hover:text-koru-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                                    title={p.label}
                                                >
                                                    Preset {idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="my-1 h-px bg-koru-outline-faint" />

                                    {/* YouTube Video iframe */}
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-medium uppercase text-koru-on-surface-variant">YouTube/Vimeo Embed</span>
                                        <div className="flex items-start gap-2">
                                            <Input
                                                size="sm"
                                                type="text"
                                                aria-label="Video URL"
                                                placeholder="Paste video URL..."
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                containerClassName="flex-1"
                                            />
                                            <Button onClick={() => handleInsertVideo(youtubeUrl)} className="uppercase">Embed</Button>
                                        </div>
                                    </div>

                                    <div className="my-1 h-px bg-koru-outline-faint" />

                                    {/* Styled Code snippet */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="page-canvas-code-snippet" className="text-[10px] font-medium uppercase text-koru-on-surface-variant">Code Snippet</label>
                                        <textarea
                                            id="page-canvas-code-snippet"
                                            placeholder="Paste source code snippet here..."
                                            rows={2}
                                            value={codeSnippet}
                                            onChange={(e) => setCodeSnippet(e.target.value)}
                                            className="resize-none rounded-koru-xs bg-koru-surface-container-lowest p-2 font-mono text-xs text-koru-on-surface shadow-koru-xs outline-none transition focus:ring-1 focus:ring-inset focus:ring-koru-primary"
                                        />
                                        <Button size="sm" onClick={handleInsertCode} className="mt-1 self-end uppercase">Insert Block</Button>
                                    </div>

                                    <div className="my-1 h-px bg-koru-outline-faint" />

                                    {/* Styled Notice Box */}
                                    <Button
                                        variant="tonal"
                                        size="sm"
                                        onClick={handleInsertCallout}
                                        startIcon={<AlertCircle size={13} />}
                                        className="uppercase tracking-wider"
                                    >
                                        Insert Styled Alert Callout
                                    </Button>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sections — text and embeds rendered in reorderable order */}
            <div className="flex-1 flex flex-col gap-6 font-medium text-xs leading-relaxed text-koru-on-surface">
                {sections.map((section, idx) => (
                    <div key={section.id} className="relative">
                        {/* Section reorder / remove controls — edit mode only */}
                        {isEditing && (
                            <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-koru-outline-faint select-none">
                                <span className="text-[9px] font-medium uppercase tracking-widest text-koru-outline mr-auto select-none">
                                    {section.type === "text" ? "Text" : "Embed"}
                                </span>
                                <button
                                    onClick={() => moveSection(section.id, "up")}
                                    disabled={idx === 0}
                                    title="Move up"
                                    className="p-1 rounded-koru-sm text-koru-on-surface-variant hover:text-koru-on-surface hover:bg-koru-surface-container disabled:opacity-25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                >
                                    <ChevronUp size={13} />
                                </button>
                                <button
                                    onClick={() => moveSection(section.id, "down")}
                                    disabled={idx === sections.length - 1}
                                    title="Move down"
                                    className="p-1 rounded-koru-sm text-koru-on-surface-variant hover:text-koru-on-surface hover:bg-koru-surface-container disabled:opacity-25 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                >
                                    <ChevronDown size={13} />
                                </button>
                                {sections.length > 1 && (
                                    <button
                                        onClick={() => removeSection(section.id)}
                                        title="Remove section"
                                        className="p-1 rounded-koru-sm text-koru-error hover:bg-koru-error-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        )}

                        {section.type === "text" ? (
                            <div
                                className="novel-editor-wrapper select-text relative w-full"
                                onFocus={() => setEditorInstance(editorMapRef.current[section.id])}
                            >
                                <NovelEditor
                                    initialContent={section.content}
                                    editable={isEditing}
                                    placeholder={placeholder}
                                    onCreate={({ editor }) => {
                                        editorMapRef.current[section.id] = editor;
                                        // If this is the first editor, make it the default active formatting instance
                                        if (!editorInstance) {
                                            setEditorInstance(editor);
                                        }
                                    }}
                                    onUpdate={({ editor }) => {
                                        editorMapRef.current[section.id] = editor;
                                    }}
                                    showBubbleMenu={false}
                                    showSlashCommands={false}
                                    className="min-h-[1.5rem]"
                                />
                            </div>
                        ) : (
                            <div className="select-text" dangerouslySetInnerHTML={{ __html: section.html }} />
                        )}
                    </div>
                ))}

                {/* Add text section — edit mode only */}
                {isEditing && (
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={addTextSection}
                        startIcon={<Plus size={13} />}
                        className="self-start"
                    >
                        Add text section
                    </Button>
                )}
            </div>
        </div>
    );
});

PageCanvas.displayName = "PageCanvas";

export default PageCanvas;
