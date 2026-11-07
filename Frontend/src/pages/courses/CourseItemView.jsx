import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Skeleton } from "../../components/UI";
import PageCanvas from "../../components/PageCanvas";
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
    { label: "Deep Purple", color: "var(--color-koru-primary)" }, // Brand purple
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
    
    const [saveAlert, setSaveAlert] = useState(false);
    const [sections, setSections] = useState([]);
    const [pageLoading, setPageLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageType, setPageType] = useState(null); // 'module' | 'item'
    const canvasRef = useRef(null);

    // Flattened ordered item list derived from course modules – used for Prev/Next navigation
    const [allItems, setAllItems] = useState([]);

    useEffect(() => {
        if (!activeCourseId) return;
        getCourseModules(activeCourseId)
            .then(mods => {
                const flat = [];
                const filteredMods = isStudentView
                    ? (mods ?? []).filter(m => m.isPublished)
                    : (mods ?? []);

                for (const mod of filteredMods) {
                    const items = isStudentView
                        ? (mod.items ?? []).filter(i => i.isPublished)
                        : (mod.items ?? []);
                    for (const item of items) {
                        flat.push({ id: item.id, label: item.label, type: item.type, isExternal: item.isExternal });
                    }
                }
                setAllItems(flat);
            })
            .catch(console.error);
    }, [activeCourseId, isStudentView]);

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
        if (!canvasRef.current) return;
        const updatedSections = canvasRef.current.getSections();
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

    return (
        <div className="w-full flex flex-col min-h-full">
            {pageLoading && (
                <div className="flex flex-col gap-5 p-6 md:p-10">
                    <Skeleton className="h-9 w-1/2" />
                    <div className="flex flex-col gap-3 mt-4">
                        {[90, 75, 85, 60, 80].map((w, i) => (
                            <Skeleton key={i} variant="rect" className="h-4" width={`${w}%`} />
                        ))}
                    </div>
                    <Skeleton className="h-48 mt-2" />
                    <div className="flex flex-col gap-3">
                        {[70, 85, 55, 75].map((w, i) => (
                            <Skeleton key={i} variant="rect" className="h-4" width={`${w}%`} />
                        ))}
                    </div>
                    <Skeleton className="h-28" />
                </div>
            )}
            {!pageLoading && (<>
            {/* Top Editor controls and Toggles */}
            <div className="flex items-center justify-between border-b border-koru-outline-faint pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => navigate(`/courses/${activeCourseId}/modules${window.location.search}`)}
                        startIcon={<ArrowLeft size={13} />}
                    >
                        Back to Modules
                    </Button>
                </div>
                
                {/* Save alert toast */}
                {saveAlert && (
                    <Alert variant="success" className="motion-safe:animate-pulse">
                        Layout Saved Successfully!
                    </Alert>
                )}

                {/* Edit/View toggle for teachers */}
                {!isStudentView && (
                    <Button
                        variant="filled"
                        size="sm"
                        onClick={() => {
                            if (isEditing) {
                                handleSave();
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        disabled={saving}
                        startIcon={
                            isEditing
                                ? (saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />)
                                : <Edit3 size={13} />
                        }
                    >
                        {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Layout"}
                    </Button>
                )}
            </div>

            {/* Title / Editor Container */}
            <div className="flex-1 flex flex-col bg-transparent min-h-[500px] p-6 md:p-10">
                {/* Title Input or View Label */}
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="font-display text-koru-title outline-none border-b border-koru-outline-faint focus:border-koru-primary/40 bg-transparent pb-2 mb-6 w-full text-koru-on-surface transition-colors placeholder:text-koru-outline-variant"
                        placeholder="Page Title"
                    />
                ) : (
                    <h1 className="font-display text-koru-title text-koru-on-surface mb-6">{title}</h1>
                )}
                <PageCanvas
                    ref={canvasRef}
                    sections={sections}
                    setSections={setSections}
                    isEditing={isEditing}
                    placeholder="Write some beautiful syllabus materials, assignments guidelines or course information here..."
                />
            </div>

            {/* Premium Bottom Navigation Footer (Canvas-style Prev / Next) */}
            <div className="flex items-center justify-between border-t border-koru-outline-faint pt-6 mt-8 shrink-0 pb-12 select-none">
                {prevItem ? (
                    <Card
                        as="button"
                        type="button"
                        variant="interactive"
                        tone="surface"
                        padding="none"
                        radius="lg"
                        onClick={() => handleItemNavigation(prevItem)}
                        className="flex flex-col text-left items-start gap-1 group py-2.5 px-5 cursor-pointer max-w-[280px] md:max-w-[340px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                    >
                        <span className="flex items-center gap-1 text-koru-caption font-medium text-koru-on-surface-variant uppercase tracking-widest">
                            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>Previous Item</span>
                        </span>
                        <span className="text-xs font-medium text-koru-primary truncate w-full mt-0.5 group-hover:underline">
                            {prevItem.label}
                        </span>
                    </Card>
                ) : (
                    <div className="w-10" />
                )}

                {nextItem ? (
                    <Card
                        as="button"
                        type="button"
                        variant="interactive"
                        tone="surface"
                        padding="none"
                        radius="lg"
                        onClick={() => handleItemNavigation(nextItem)}
                        className="flex flex-col text-right items-end gap-1 group py-2.5 px-5 cursor-pointer max-w-[280px] md:max-w-[340px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                    >
                        <span className="flex items-center gap-1 text-koru-caption font-medium text-koru-on-surface-variant uppercase tracking-widest">
                            <span>Next Item</span>
                            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-xs font-medium text-koru-primary truncate w-full mt-0.5 group-hover:underline">
                            {nextItem.label}
                        </span>
                    </Card>
                ) : (
                    <div className="w-10" />
                )}
            </div>
            </>)}
        </div>
    );
}
