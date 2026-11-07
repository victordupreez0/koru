import React from "react";
import { getNotes, createNote, updateNote, deleteNote } from "../../../services/noteService";
import { useAuth } from "../../../contexts/AuthContext";
import { Plus, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Button, Card, Skeleton } from "../../../components/UI";
import NovelEditor from "../../../components/NovelEditor";

export default function CourseNotesView({ activeCourseId }) {
    const { user } = useAuth();
    const [notes, setNotes] = React.useState([]);
    const [activeNote, setActiveNote] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [expanded, setExpanded] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        async function fetchNotes() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getNotes(user?.userId);
                const courseNotes = data.filter(n => n.courseId === activeCourseId);
                if (mounted) {
                    setNotes(courseNotes);
                    if (courseNotes.length > 0) setActiveNote(courseNotes[0]);
                }
            } catch (err) {
                console.error("Failed bringing in notes:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchNotes();
        return () => { mounted = false; };
    }, [activeCourseId]);

    const handleCreateNote = async () => {
        const newNote = {
            title: "",
            content: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
            courseId: activeCourseId,
            studentId: user?.userId,
            authorId: user?.userId
        };
        try {
            const created = await createNote(newNote);
            setNotes(prev => [...prev, created]);
            setActiveNote(created);
        } catch (err) {
            console.error("Failed to create note:", err);
        }
    };

    const handleUpdateNote = async (updatedContent) => {
        if (!activeNote) return;
        try {
            const updated = { ...activeNote, content: JSON.stringify(updatedContent) };
            await updateNote(activeNote.id, updated);
            setNotes(prev => prev.map(n => n.id === activeNote.id ? updated : n));
        } catch (err) {
            console.error("Failed to update note:", err);
        }
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden">
            {/* Notes sidebar — animates width to 0 when expanded */}
            <div
                className="flex flex-col h-full border-r border-koru-outline-variant shrink-0 overflow-hidden"
                style={{
                    width: expanded ? 0 : 320,
                    padding: expanded ? '2rem 0' : '2rem',
                    borderRightWidth: expanded ? 0 : 1,
                    opacity: expanded ? 0 : 1,
                    transition: 'width 0.35s ease, padding 0.35s ease, border-right-width 0.35s ease, opacity 0.2s ease',
                }}
            >
                <div className="flex justify-between items-center mb-8 min-w-[256px]">
                    <h2 className="font-display text-koru-title text-koru-on-surface">Notes</h2>
                    <Button variant="tonal" size="icon" aria-label="New note" onClick={handleCreateNote}>
                        <Plus size={20} />
                    </Button>
                </div>
                {loading ? (
                    <div className="space-y-2 overflow-y-auto min-w-[256px]">
                        {[1, 2, 3].map(i => (
                            <Card key={i} tone="low" radius="lg" padding="sm" className="flex items-start justify-between gap-2">
                                <div className="flex-1 flex flex-col gap-2">
                                    <Skeleton variant="rect" className="h-4" width={`${50 + (i * 23) % 40}%`} />
                                    <Skeleton variant="text" className="w-20" />
                                </div>
                                <Skeleton className="w-6 h-6 shrink-0" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 overflow-y-auto min-w-[256px]">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className={`group w-full text-left p-4 rounded-koru-lg transition-colors flex items-start justify-between gap-2 cursor-pointer ${activeNote?.id === note.id ? 'bg-koru-primary text-koru-on-primary' : 'bg-koru-surface-container-low hover:bg-koru-surface-container-high text-koru-on-surface'}`}
                                onClick={() => setActiveNote(note)}
                            >
                                <div className="min-w-0">
                                    <div className={`font-medium text-sm truncate ${!note.title ? 'opacity-40' : ''}`}>{note.title || "New Note"}</div>
                                    <div className={`text-xs mt-1 ${activeNote?.id === note.id ? 'text-koru-on-primary/70' : 'text-koru-on-surface-variant'}`}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await deleteNote(note.id);
                                            setNotes(prev => prev.filter(n => n.id !== note.id));
                                            if (activeNote?.id === note.id) setActiveNote(null);
                                        } catch (err) {
                                            console.error("Failed to delete note:", err);
                                        }
                                    }}
                                    className={`shrink-0 p-1 rounded-koru-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${activeNote?.id === note.id ? 'text-koru-on-primary/60 hover:text-koru-on-primary hover:bg-koru-on-primary/10' : 'text-transparent group-hover:text-koru-on-surface-variant focus-visible:text-koru-on-surface-variant hover:!text-koru-error hover:!bg-koru-error-container'}`}
                                    title="Delete note"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {notes.length === 0 && (
                            <div className="text-sm text-koru-on-surface-variant text-center py-4">No notes yet. Click + to create one.</div>
                        )}
                    </div>
                )}
            </div>

            <div
                className="flex-1 overflow-y-auto pb-24"
                style={{
                    padding: expanded ? '3rem' : '2rem',
                    transition: 'padding 0.35s ease',
                }}
            >
                {activeNote ? (
                    <div
                        className={`relative flex flex-col ${
                            expanded
                                ? 'bg-transparent min-h-full rounded-none'
                                : 'bg-koru-surface-container-lowest py-8 pr-8 pl-12 rounded-koru-3xl ring-1 ring-inset ring-koru-outline-faint shadow-koru-card min-h-[600px]'
                        }`}
                        style={{ transition: 'padding 0.3s ease, border-radius 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease' }}
                    >
                        {/* Expand / Collapse button */}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                            className={`absolute z-10 p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                expanded
                                    ? 'top-0 right-0 bg-koru-surface-container-highest/60 hover:bg-koru-surface-container-highest'
                                    : 'top-6 right-6 bg-koru-surface-container hover:bg-koru-surface-container-highest'
                            }`}
                            title={expanded ? 'Collapse' : 'Expand'}
                        >
                            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <input
                            type="text"
                            value={activeNote.title}
                            onChange={(e) => {
                                const updatedTitle = e.target.value;
                                setActiveNote(prev => ({ ...prev, title: updatedTitle }));
                                setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: updatedTitle } : n));
                            }}
                            onBlur={async () => {
                                try {
                                    await updateNote(activeNote.id, activeNote);
                                } catch (err) {
                                    console.error("Failed to update note title", err);
                                }
                            }}
                            className="font-display text-koru-display mb-8 outline-none border-b border-transparent focus:border-koru-outline-variant bg-transparent w-full pb-2 transition-colors text-koru-on-surface placeholder:text-koru-outline-variant"
                            placeholder="New Note"
                        />
                        <div className="flex-1 relative novel-editor-wrapper" key={activeNote.id}>
                            <NovelEditor
                                initialContent={(() => {
                                    try {
                                        const parsed = activeNote.content ? JSON.parse(activeNote.content) : null;
                                        if (parsed && parsed.content && parsed.content.length > 0) return parsed;
                                    } catch {}
                                    return { type: "doc", content: [{ type: "paragraph" }] };
                                })()}
                                placeholder="Type something..."
                                onUpdate={({ editor }) => {
                                    if (editor) handleUpdateNote(editor.getJSON());
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-koru-on-surface-variant">
                        Select a note or create a new one to start writing.
                    </div>
                )}
            </div>
        </div>
    );
}
