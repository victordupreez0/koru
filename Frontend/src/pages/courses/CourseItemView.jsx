import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Skeleton } from "../../components/UI";
import PageCanvas from "../../components/PageCanvas";
import SaveStatus from "../../components/editor/SaveStatus";
import { useAutosave } from "../../components/editor/useAutosave";
import { getPageContent, savePageContent, getCourseModules } from "../../services/moduleService";
import { ArrowLeft, ArrowRight, Check, Edit3 } from "lucide-react";

const savePage = ({ pageId, pageType, ...content }) => savePageContent(pageId, pageType, content);

export default function CourseItemView({ activeCourseId, activeItemId, isStudentView = false }) {
    const navigate = useNavigate();
    const { search } = useLocation();
    // Everything about the loaded page lives together, tagged with the page id it belongs to,
    // so moving to another page immediately shows the loading state and leaves edit mode.
    const [page, setPage] = useState({ id: null });
    const [editingId, setEditingId] = useState(null);
    const [reloadCount, setReloadCount] = useState(0);
    const pageLoading = page.id !== activeItemId;
    const isEditing = editingId === activeItemId;
    const { title = "", sections = [], pageType = null, error: loadError = null } = pageLoading ? {} : page;
    const canvasRef = useRef(null);
    const { status, schedule, flush } = useAutosave(savePage);

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
            navigate(`/courses/${activeCourseId}/items/${item.id}${search}`);
        } else if (item.type === "link") {
            alert(`Opening link: ${item.label}`);
        } else {
            alert(`Downloading attachment: ${item.label}`);
        }
    };

    // Load content from backend whenever the active item changes
    useEffect(() => {
        if (!activeItemId) return;
        let mounted = true;

        getPageContent(activeItemId)
            .then(({ pageType: pt, title: t, sections: s }) => {
                if (mounted) setPage({ id: activeItemId, pageType: pt, title: t, sections: s });
            })
            .catch(err => {
                console.error("Failed to load page content:", err);
                if (mounted) setPage({ id: activeItemId, error: err.message || "This page couldn't be loaded." });
            });

        return () => {
            mounted = false;
            flush();
        };
    }, [activeItemId, reloadCount, flush]);

    const queueSave = useCallback((nextTitle) => {
        if (!canvasRef.current) return;
        schedule({ pageId: activeItemId, pageType, title: nextTitle, sections: canvasRef.current.getSections() });
    }, [activeItemId, pageType, schedule]);

    const finishEditing = async () => {
        const latest = canvasRef.current?.getSections();
        if (await flush()) {
            if (latest) setPage(p => ({ ...p, sections: latest }));
            setEditingId(null);
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
                        onClick={() => navigate(`/courses/${activeCourseId}/modules${search}`)}
                        startIcon={<ArrowLeft size={13} />}
                    >
                        Back to Modules
                    </Button>
                </div>

                {!isStudentView && !loadError && (
                    <div className="flex items-center gap-3">
                        {isEditing && <SaveStatus status={status} />}
                        <Button
                            variant="filled"
                            size="sm"
                            onClick={() => (isEditing ? finishEditing() : setEditingId(activeItemId))}
                            startIcon={isEditing ? <Check size={13} /> : <Edit3 size={13} />}
                        >
                            {isEditing ? "Done" : "Edit page"}
                        </Button>
                    </div>
                )}
            </div>

            {isEditing && status === "error" && (
                <Alert variant="error" className="mb-4">
                    Your latest changes aren't saved yet. Keep this page open and we'll keep trying.
                </Alert>
            )}

            {loadError ? (
                <div className="flex flex-col items-start gap-3 p-6 md:p-10">
                    <Alert variant="error" title="This page couldn't be loaded">{loadError}</Alert>
                    <Button variant="tonal" size="sm" onClick={() => { setPage({ id: null }); setReloadCount(c => c + 1); }}>Try again</Button>
                </div>
            ) : (
            <div className="flex-1 flex flex-col bg-transparent min-h-[500px] p-6 md:p-10">
                {/* Title Input or View Label */}
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setPage(p => ({ ...p, title: e.target.value }));
                            queueSave(e.target.value);
                        }}
                        aria-label="Page title"
                        className="font-display text-koru-display outline-none border-b border-koru-outline-faint focus:border-koru-primary/40 bg-transparent pb-2 mb-6 w-full text-koru-on-surface transition-colors placeholder:text-koru-outline-variant"
                        placeholder="Page Title"
                    />
                ) : (
                    <h1 className="font-display text-koru-display text-koru-on-surface mb-6">{title}</h1>
                )}
                <PageCanvas
                    ref={canvasRef}
                    sections={sections}
                    isEditing={isEditing}
                    onChange={() => queueSave(title)}
                    placeholder={isEditing ? "Start writing, or type / to add a block" : "The lecturer hasn't added anything to this page yet."}
                />
            </div>
            )}

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
