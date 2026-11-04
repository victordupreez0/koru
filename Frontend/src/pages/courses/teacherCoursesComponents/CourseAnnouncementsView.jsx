import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CloseSquare } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUp } from "./constants";
import {
    getCourseAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
} from "../../../services/announcementService";
import { useAuth } from "../../../contexts/AuthContext";
import { Avatar, Button, Card, Input, PageHeader, Skeleton } from "../../../components/UI";

export function CourseAnnouncementsView({ activeCourseId }) {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [posting, setPosting] = useState(false);

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        preview: "",
    });

    useEffect(() => {
        let mounted = true;
        async function fetchAnnouncements() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getCourseAnnouncements(activeCourseId);
                if (mounted) setAnnouncements(data || []);
            } catch (err) {
                console.error("Failed to load announcements:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchAnnouncements();
        return () => { mounted = false; };
    }, [activeCourseId]);

    const selectedAnnouncement = announcements.find(a => a.id === selectedId);

    const handlePost = async () => {
        if (!newAnnouncement.title || !newAnnouncement.preview) return;
        setPosting(true);
        try {
            const payload = {
                ...newAnnouncement,
                courseId: activeCourseId,
                lecturerId: user?.userId,
                lecturerName: user?.name || user?.fullName || "Lecturer",
            };
            const created = await createAnnouncement(payload);
            setAnnouncements(prev => [created, ...prev]);
            setIsAdding(false);
            setNewAnnouncement({ title: "", preview: "" });
        } catch (err) {
            console.error("Failed to post announcement:", err);
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            await deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            if (selectedId === id) setSelectedId(null);
        } catch (err) {
            console.error("Failed to delete announcement:", err);
        }
    };

    return (
        <motion.div className="flex-1 flex flex-col overflow-hidden h-full" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={slideUp} className="shrink-0">
                <PageHeader
                    className="mb-6"
                    title="Announcements"
                    subtitle="Manage and post updates for your students"
                    actions={!isAdding && (
                        <Button
                            variant="filled"
                            startIcon={<Plus size={16} />}
                            onClick={() => setIsAdding(true)}
                        >
                            Create Announcement
                        </Button>
                    )}
                />
            </motion.div>

            {/* Create form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -16, height: 0, transition: { duration: 0.18, ease: "easeIn" } }}
                        className="mb-6 overflow-hidden shrink-0"
                    >
                        <Card variant="outlined" tone="low" padding="lg" radius="2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-display text-koru-heading text-koru-on-surface">Drafting New Announcement</h3>
                                <Button
                                    variant="text"
                                    size="icon"
                                    aria-label="Close announcement form"
                                    onClick={() => setIsAdding(false)}
                                >
                                    <CloseSquare size={22} />
                                </Button>
                            </div>

                            <div className="flex flex-col gap-6 mb-6">
                                <Input
                                    label="Announcement Title"
                                    type="text"
                                    placeholder="What's the update about?"
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                />
                                <div>
                                    <label
                                        htmlFor="teacher-announcement-message"
                                        className="mb-1.5 block text-koru-label text-koru-on-surface-variant"
                                    >
                                        Announcement Message
                                    </label>
                                    <textarea
                                        id="teacher-announcement-message"
                                        rows={5}
                                        placeholder="Write your announcement details here..."
                                        className="w-full resize-none rounded-koru-xs bg-koru-surface-container-lowest px-4 py-3 text-sm leading-relaxed text-koru-on-surface shadow-koru-xs outline-none transition placeholder:text-koru-on-surface-variant/70 hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary"
                                        value={newAnnouncement.preview}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, preview: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="filled"
                                    onClick={handlePost}
                                    disabled={posting}
                                >
                                    {posting ? "Posting…" : "Post Announcement"}
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Split layout */}
            <div className="flex-1 flex flex-row gap-6 min-h-0 overflow-hidden relative">
                {/* Left list */}
                <div
                    className={`${
                        selectedId ? "hidden lg:flex" : "flex"
                    } flex-col gap-4 overflow-y-auto pr-2 transition-all duration-300 motion-reduce:transition-none ${
                        selectedId ? "w-full lg:w-[45%] lg:shrink-0" : "w-full"
                    }`}
                >
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <Card key={i} variant="outlined" tone="surface" className="flex gap-4 items-start">
                                <Skeleton variant="circle" width={40} height={40} className="shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton variant="text" width="75%" height={16} />
                                    <Skeleton variant="text" width="100%" />
                                    <Skeleton variant="text" width="50%" />
                                </div>
                            </Card>
                        ))
                    ) : announcements.map((post) => (
                        <Card
                            as={motion.div}
                            key={post.id}
                            onClick={() => setSelectedId(post.id)}
                            variants={slideUp}
                            variant="interactive"
                            tone={selectedId === post.id ? "brand" : "surface"}
                            className="cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 group shrink-0"
                        >
                            <div className="flex flex-1 items-start gap-4 pl-2 min-w-0">
                                <Avatar
                                    src={post.lecturerProfileImageUrl}
                                    seed={post.lecturerId || post.lecturerName}
                                    name={post.lecturerName || "Lecturer"}
                                    size="md"
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-display text-koru-heading text-koru-on-surface leading-snug group-hover:text-koru-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-koru-on-surface-variant text-sm leading-relaxed line-clamp-1 mt-0.5">
                                        {post.preview}
                                    </p>
                                    <p className="text-koru-caption font-medium text-koru-primary mt-1.5">
                                        Posted by {post.lecturerName || post.lecturer?.name || post.lecturer || "Lecturer"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex md:flex-col items-center md:items-end justify-end gap-2 pl-6 md:pl-0 shrink-0 self-stretch md:self-auto pt-3 md:pt-0">
                                <span className="text-koru-caption text-koru-on-surface-variant">
                                    {post.datePosted
                                        ? new Date(post.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        : (post.date || "")}
                                </span>
                                <button
                                    onClick={e => handleDelete(post.id, e)}
                                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-koru-xs text-koru-on-surface-variant hover:text-koru-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all"
                                    title="Delete announcement"
                                    aria-label="Delete announcement"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Right detail panel */}
                <AnimatePresence mode="wait">
                    {selectedId && selectedAnnouncement && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, transition: { duration: 0.15, ease: "easeIn" } }}
                            transition={{ type: "spring", damping: 30, stiffness: 250 }}
                            className="flex-1 w-full lg:w-[55%] flex flex-col overflow-y-auto"
                        >
                            <Card variant="outlined" tone="surface" padding="xl" radius="2xl" className="flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-sm font-medium text-koru-on-surface-variant">
                                        {selectedAnnouncement.datePosted
                                            ? new Date(selectedAnnouncement.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                            : (selectedAnnouncement.date || "")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="error"
                                            size="icon"
                                            onClick={() => handleDelete(selectedId)}
                                            title="Delete announcement"
                                            aria-label="Delete announcement"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                        <Button
                                            variant="tonal"
                                            size="icon"
                                            onClick={() => setSelectedId(null)}
                                            aria-label="Close announcement"
                                        >
                                            <CloseSquare size={22} />
                                        </Button>
                                    </div>
                                </div>

                                <h2 className="font-display text-koru-title text-koru-on-surface mb-4">
                                    {selectedAnnouncement.title}
                                </h2>

                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-koru-outline-variant">
                                    <Avatar
                                        src={selectedAnnouncement.lecturerProfileImageUrl}
                                        seed={selectedAnnouncement.lecturerId || selectedAnnouncement.lecturerName}
                                        name={selectedAnnouncement.lecturerName || "Lecturer"}
                                        size="md"
                                    />
                                    <div>
                                        <p className="text-koru-caption font-medium text-koru-on-surface-variant">Published By</p>
                                        <p className="font-medium text-koru-primary">
                                            {selectedAnnouncement.lecturerName || selectedAnnouncement.lecturer?.name || selectedAnnouncement.lecturer || "Lecturer"}
                                        </p>
                                    </div>
                                </div>

                                <div className="max-w-none flex-1">
                                    <p className="text-lg leading-relaxed text-koru-on-surface-variant mb-6">
                                        {selectedAnnouncement.preview}
                                    </p>
                                    <p className="text-koru-on-surface-variant/80 leading-relaxed text-sm">
                                        Please make sure to check the attached documents in the resources section if any are mentioned. If you have any follow-up questions regarding this announcement, feel free to reach out during office hours or through the discussion forum.
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
