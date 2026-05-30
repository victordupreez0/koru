import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NovelEditor from "../../components/NovelEditor";
import { uploadImageToCloudinary } from "../../services/cloudinaryService";
import { getPageContent, savePageContent, getCourseModules } from "../../services/moduleService";
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
    Image as ImageIcon, 
    Video as VideoIcon, 
    Code2, 
    AlertCircle, 
    Eye, 
    Edit3, 
    Save, 
    ArrowLeft, 
    ArrowRight,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Palette,
    Paperclip,
    FileText,
    Link as LinkIcon,
    Plus,
    X,
    ExternalLink,
    Loader
} from "lucide-react";


// Curated brand color options for text
const TEXT_COLORS = [
    { label: "Default", color: "#1f2937" }, // Slate 800
    { label: "Deep Purple", color: "#3C0078" }, // Brand purple
    { label: "Slate Gray", color: "#6b7280" },
    { label: "Indigo Blue", color: "#2563eb" },
    { label: "Emerald Green", color: "#059669" },
    { label: "Warm Amber", color: "#d97706" },
    { label: "Crimson Red", color: "#dc2626" },
];

// Presets for quick-select images to wow the user immediately without typing a URL
const IMAGE_PRESETS = [
    { label: "Abstract Learning Pattern", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" },
    { label: "Design System Grid", url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80" },
    { label: "Creative Workspace", url: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1000&q=80" }
];


export default function CourseItemView({ activeCourseId, activeItemId, isStudentView = false }) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("Blank Page");
    const [editorInstance, setEditorInstance] = useState(null);
    const [showEmbedMenu, setShowEmbedMenu] = useState(false);
    const [showColorMenu, setShowColorMenu] = useState(false);
    
    // Embed states
    const [imageUrl, setImageUrl] = useState("");
    const [codeSnippet, setCodeSnippet] = useState("");
    const [codeLang, setCodeLang] = useState("css");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    
    const [saveAlert, setSaveAlert] = useState(false);
    const [sections, setSections] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageType, setPageType] = useState(null); // 'module' | 'item'
    const fileInputRef = useRef(null);
    const editorMapRef = useRef({});

    // Flattened ordered item list derived from course modules – used for Prev/Next navigation
    const [allItems, setAllItems] = useState([]);

    useEffect(() => {
        if (!activeCourseId) return;
        getCourseModules(activeCourseId)
            .then(mods => {
                const flat = [];
                for (const mod of mods) {
                    flat.push({ id: mod.id, label: mod.title, type: "document" });
                    for (const item of (mod.items ?? [])) {
                        flat.push({ id: item.id, label: item.label, type: item.type, isExternal: item.isExternal });
                    }
                }
                setAllItems(flat);
            })
            .catch(console.error);
    }, [activeCourseId]);

    // Compute Previous and Next items from the live course modules list
    const { prevItem, nextItem } = useMemo(() => {
        const index = allItems.findIndex(item => item.id === activeItemId);
        if (index === -1) return { prevItem: null, nextItem: null };
        return {
            prevItem: index > 0 ? allItems[index - 1] : null,
            nextItem: index < allItems.length - 1 ? allItems[index + 1] : null,
        };
    }, [allItems, activeItemId]);

    // Handle Prev/Next click
    const handleItemNavigation = (item) => {
        if (!item) return;
        if (item.type === "document") {
            navigate(`/courses/${activeCourseId}/items/${item.id}${isStudentView ? "?viewAs=student" : ""}`);
        } else if (item.type === "link") {
            alert(`Opening link: ${item.label}`);
        } else {
            alert(`Downloading attachment: ${item.label}`);
        }
    };

    // Build a default single empty text section
    const makeDefaultSections = (fallbackTitle) => {
        const emptyDoc = {
            type: "doc",
            content: [
                { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: fallbackTitle }] },
                { type: "paragraph", content: [{ type: "text", text: "Click Edit to start building this page..." }] },
            ],
        };
        return [{ id: `text-${Date.now()}`, type: "text", content: emptyDoc }];
    };

    // Load content from backend whenever the active item changes
    useEffect(() => {
        if (!activeItemId) return;
        let mounted = true;
        editorMapRef.current = {};
        setPageLoading(true);
        setIsEditing(false);

        getPageContent(activeItemId)
            .then(({ pageType: pt, title: t, sections: s, raw }) => {
                if (!mounted) return;
                setPageType(pt);
                setTitle(t || "Untitled");
                if (s && s.length > 0) {
                    setSections(s);
                } else {
                    setSections(makeDefaultSections(t || raw?.title || raw?.label || "New Page"));
                }
            })
            .catch(err => {
                console.error("Failed to load page content:", err);
                if (mounted) {
                    setTitle("New Page");
                    setSections(makeDefaultSections("New Page"));
                }
            })
            .finally(() => { if (mounted) setPageLoading(false); });

        return () => { mounted = false; };
    }, [activeItemId]);

    const handleSave = async () => {
        const updatedSections = sections.map(s => {
            if (s.type === "text") {
                const inst = editorMapRef.current[s.id];
                return inst ? { ...s, content: inst.getJSON() } : s;
            }
            return s;
        });
        setSections(updatedSections);
        setSaving(true);
        try {
            await savePageContent(activeItemId, pageType, { title, sections: updatedSections });
            setSaveAlert(true);
            setIsEditing(false);
            setTimeout(() => setSaveAlert(false), 2000);
        } catch (err) {
            console.error("Failed to save page content:", err);
        } finally {
            setSaving(false);
        }
    };

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
        const html = `<img src="${url.trim()}" alt="Visual" style="width:100%;max-height:340px;object-fit:cover;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin:24px 0;display:block;" />`;
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

    // Code embed insertion – appends to embedsHtml state
    const handleInsertCode = () => {
        if (!codeSnippet.trim()) return;
        const escaped = codeSnippet.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<pre style="background:#111827;color:#f3f4f6;padding:20px;border-radius:16px;font-family:monospace;font-size:12px;overflow-x:auto;margin:24px 0;"><code>${escaped}</code></pre>`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setCodeSnippet("");
        setShowEmbedMenu(false);
    };

    // Callout box insertion – adds a new embed section
    const handleInsertCallout = () => {
        const html = `<div style="padding:20px 24px;background:rgba(60,0,120,0.05);border-left:4px solid #3C0078;border-radius:0 16px 16px 0;margin:24px 0;color:#3C0078;"><div style="font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">ℹ Alert Box</div><div style="font-size:13px;font-weight:500;opacity:0.9;">Enter your notification details or custom block guidelines here.</div></div>`;
        setSections(prev => [...prev, { id: `embed-${Date.now()}`, type: "embed", html }]);
        setShowEmbedMenu(false);
    };

    // Move a section one step up or down in the ordered list
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

    // Remove a section by id (any type)
    const removeSection = (id) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    // Add a new empty text editor section at the bottom
    const addTextSection = () => {
        // Pass a valid empty doc so Novel fires onCreate reliably (null skips it)
        const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
        setSections(prev => [...prev, { id: `text-${Date.now()}`, type: "text", content: emptyDoc }]);
    };

    return (
        <div className="w-full flex flex-col min-h-full">
            {pageLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader size={24} className="animate-spin text-gray-400" />
                </div>
            )}
            {!pageLoading && (<>
            {/* Top Editor controls and Toggles */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        Module Document Item
                    </span>
                </div>
                
                {/* Save alert toast */}
                {saveAlert && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-extrabold rounded-lg shadow-2xs border border-green-100 animate-pulse">
                        <Sparkles size={13} className="text-green-500" />
                        <span>Layout Saved Successfully!</span>
                    </div>
                )}

                {/* Edit/View toggle for teachers */}
                {!isStudentView && (
                    <button
                        onClick={() => {
                            if (isEditing) {
                                handleSave();
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        disabled={saving}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl cursor-pointer shadow-2xs border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                            isEditing 
                            ? "bg-green-600 border-green-700 text-white hover:bg-green-700" 
                            : "bg-[#3C0078] border-[#2A0054] text-white hover:bg-[#2A0054]"
                        }`}
                    >
                        {isEditing ? (
                            <>
                                {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
                                <span>{saving ? "Saving..." : "Save Changes"}</span>
                            </>
                        ) : (
                            <>
                                <Edit3 size={13} />
                                <span>Edit Layout</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Title / Editor Container */}
            <div className="flex-1 flex flex-col bg-white min-h-[500px] p-6 md:p-10">
                {/* Title Input or View Label */}
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-3xl font-black outline-none border-b border-gray-100 focus:border-[#3C0078]/40 pb-2 mb-6 w-full text-gray-900 transition-colors placeholder:text-gray-300"
                        placeholder="Page Title"
                    />
                ) : (
                    <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{title}</h1>
                )}

                {/* Gorgeous Canvas-Style Editor Toolbar */}
                {isEditing && (
                    <div className="sticky top-2 flex flex-wrap items-center gap-1 bg-gray-50/95 backdrop-blur-xs border border-gray-200/80 p-2 rounded-2xl mb-6 shadow-md z-30">
                        {/* Heading Selector */}
                        <button onClick={() => handleFormat("paragraph")} className="px-2 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200 rounded-lg" title="Paragraph">P</button>
                        <button onClick={() => handleFormat("heading", 1)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 1"><Heading1 size={14} /></button>
                        <button onClick={() => handleFormat("heading", 2)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 2"><Heading2 size={14} /></button>
                        <button onClick={() => handleFormat("heading", 3)} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Heading 3"><Heading3 size={14} /></button>
                        
                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Font size picker dropdown */}
                        <div className="relative group/size">
                            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-extrabold text-gray-600 hover:bg-gray-200 rounded-lg">
                                <span>Size</span>
                                <ChevronDown size={10} />
                            </button>
                            <div className="absolute hidden group-hover/size:flex flex-col bg-white border border-gray-200 p-1 rounded-xl shadow-lg mt-1 min-w-[120px] left-0">
                                <button onClick={() => handleFontSize("small")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Small (12px)</button>
                                <button onClick={() => handleFontSize("normal")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Normal (15px)</button>
                                <button onClick={() => handleFontSize("large")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Large (20px)</button>
                                <button onClick={() => handleFontSize("xlarge")} className="text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-black text-sm">X-Large (28px)</button>
                            </div>
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Standard Mark Styles */}
                        <button onClick={() => handleFormat("bold")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Bold"><Bold size={14} /></button>
                        <button onClick={() => handleFormat("italic")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Italic"><Italic size={14} /></button>
                        <button onClick={() => handleFormat("underline")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Underline"><Underline size={14} /></button>
                        <button onClick={() => handleFormat("strike")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Strikethrough"><Strikethrough size={14} /></button>
                        <button onClick={() => handleFormat("code")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Inline Code"><Code size={14} /></button>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Color Picker dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowColorMenu(!showColorMenu)}
                                className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg flex items-center gap-0.5" 
                                title="Text Color"
                            >
                                <Palette size={14} />
                                <ChevronDown size={10} />
                            </button>
                            {showColorMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowColorMenu(false)} />
                                    <div className="absolute z-30 bg-white border border-gray-200 p-2 rounded-2xl shadow-xl mt-1.5 flex flex-col gap-1 min-w-[140px] left-0">
                                        <div className="text-[9px] font-black text-gray-400 uppercase px-1 mb-1 tracking-wider">Brand Palette</div>
                                        {TEXT_COLORS.map(c => (
                                            <button
                                                key={c.label}
                                                onClick={() => {
                                                    handleFormat("color", c.color);
                                                    setShowColorMenu(false);
                                                }}
                                                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 rounded-lg w-full text-left font-semibold text-gray-700"
                                            >
                                                <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: c.color || "#000" }} />
                                                <span>{c.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Lists and Quotes */}
                        <button onClick={() => handleFormat("bullet")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Bullet List"><List size={14} /></button>
                        <button onClick={() => handleFormat("ordered")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Numbered List"><ListOrdered size={14} /></button>
                        <button onClick={() => handleFormat("quote")} className="p-1 text-gray-600 hover:bg-gray-200 rounded-lg" title="Blockquote"><Quote size={14} /></button>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        {/* Interactive "+ Insert Embed" Menu */}                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />                        <div className="relative">
                            <button 
                                onClick={() => setShowEmbedMenu(!showEmbedMenu)}
                                disabled={uploading}
                                className="flex items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#3C0078] border border-purple-100 hover:bg-purple-100 cursor-pointer shadow-3xs disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Plus size={11} />
                                <span>{uploading ? "Uploading…" : "Insert Embed"}</span>
                            </button>
                            {showEmbedMenu && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setShowEmbedMenu(false)} />
                                    <div className="absolute z-30 bg-white border border-gray-200 p-4 rounded-3xl shadow-2xl mt-1.5 flex flex-col gap-3 min-w-[320px] left-0 md:left-auto md:right-0">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-0.5">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Embed Suite</span>
                                            <button onClick={() => setShowEmbedMenu(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                                        </div>

                                        {/* Image section */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Insert Image</label>
                                            {/* Upload from device → Cloudinary */}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-[#3C0078]/20 rounded-xl text-[10px] font-bold text-[#3C0078] hover:bg-[#3C0078]/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <Paperclip size={12} />
                                                {uploading ? "Uploading…" : "Upload from device"}
                                            </button>
                                            {/* URL input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Or paste image URL..."
                                                    value={imageUrl}
                                                    onChange={(e) => setImageUrl(e.target.value)}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40"
                                                />
                                                <button onClick={() => handleInsertImage(imageUrl)} className="px-3 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg">Add</button>
                                            </div>
                                            {/* Preselected quick images */}
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {IMAGE_PRESETS.map((p, idx) => (
                                                    <button
                                                        key={p.label}
                                                        onClick={() => handleInsertImage(p.url)}
                                                        className="text-[9px] font-bold px-2 py-1 bg-gray-100 text-gray-600 hover:bg-[#3C0078]/5 hover:text-[#3C0078] rounded-md transition-colors text-left truncate max-w-[140px]"
                                                        title={p.label}
                                                    >
                                                        Preset {idx + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* YouTube Video iframe */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">YouTube/Vimeo Embed</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Paste video URL..."
                                                    value={youtubeUrl}
                                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40"
                                                />
                                                <button onClick={() => handleInsertVideo(youtubeUrl)} className="px-3 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg">Embed</button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* Styled Code snippet */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Code Snippet (Dark-theme Block)</label>
                                            <textarea
                                                placeholder="Paste source code snippet here..."
                                                rows={2}
                                                value={codeSnippet}
                                                onChange={(e) => setCodeSnippet(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-[#3C0078]/40 font-mono resize-none"
                                            />
                                            <button onClick={handleInsertCode} className="py-1 px-3 bg-[#3C0078] text-white text-[10px] font-bold uppercase rounded-lg self-end mt-1">Insert Block</button>
                                        </div>

                                        <div className="h-px bg-gray-100 my-1" />

                                        {/* Styled Notice Box */}
                                        <button
                                            onClick={handleInsertCallout}
                                            className="flex items-center justify-center gap-2 p-2 bg-[#3C0078]/3 border border-[#3C0078]/10 text-[#3C0078] hover:bg-[#3C0078]/8 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors"
                                        >
                                            <AlertCircle size={13} />
                                            <span>Insert Styled Alert Callout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sections — text and embeds rendered in reorderable order */}
                <div className="flex-1 flex flex-col gap-6 font-medium text-xs leading-relaxed text-gray-800">
                    {sections.map((section, idx) => (
                        <div key={section.id} className="relative">
                            {/* Section reorder / remove controls — edit mode only */}
                            {isEditing && (
                                <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-gray-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 mr-auto select-none">
                                        {section.type === "text" ? "Text" : "Embed"}
                                    </span>
                                    <button
                                        onClick={() => moveSection(section.id, "up")}
                                        disabled={idx === 0}
                                        title="Move up"
                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                                    >
                                        <ChevronUp size={13} />
                                    </button>
                                    <button
                                        onClick={() => moveSection(section.id, "down")}
                                        disabled={idx === sections.length - 1}
                                        title="Move down"
                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 transition-colors"
                                    >
                                        <ChevronDown size={13} />
                                    </button>
                                    {sections.length > 1 && (
                                        <button
                                            onClick={() => removeSection(section.id)}
                                            title="Remove section"
                                            className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {section.type === "text" ? (
                                <div
                                    className="novel-editor-wrapper select-text"
                                    onFocus={() => setEditorInstance(editorMapRef.current[section.id])}
                                >
                                    <NovelEditor
                                        initialContent={section.content}
                                        editable={isEditing}
                                        placeholder="Write some beautiful syllabus materials, assignments guidelines or course information here..."
                                        onCreate={({ editor }) => {
                                            editorMapRef.current[section.id] = editor;
                                            setEditorInstance(editor);
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
                        <button
                            onClick={addTextSection}
                            className="flex items-center gap-2 self-start text-[11px] font-bold text-[#3C0078]/60 hover:text-[#3C0078] border border-dashed border-[#3C0078]/20 hover:border-[#3C0078]/40 rounded-xl px-4 py-2.5 transition-all hover:bg-[#3C0078]/5"
                        >
                            <Plus size={13} />
                            Add text section
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Bottom Navigation Footer (Canvas-style Prev / Next) */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8 shrink-0 pb-12 select-none">
                {prevItem ? (
                    <button
                        onClick={() => handleItemNavigation(prevItem)}
                        className="flex flex-col text-left items-start gap-1 group py-2.5 px-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all cursor-pointer max-w-[280px] md:max-w-[340px]"
                    >
                        <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>Previous Item</span>
                        </span>
                        <span className="text-xs font-bold text-[#3C0078] truncate w-full mt-0.5 group-hover:underline">
                            {prevItem.label}
                        </span>
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                {nextItem ? (
                    <button
                        onClick={() => handleItemNavigation(nextItem)}
                        className="flex flex-col text-right items-end gap-1 group py-2.5 px-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all cursor-pointer max-w-[280px] md:max-w-[340px]"
                    >
                        <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Next Item</span>
                            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-xs font-bold text-[#3C0078] truncate w-full mt-0.5 group-hover:underline">
                            {nextItem.label}
                        </span>
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>
            </>)}
        </div>
    );
}
