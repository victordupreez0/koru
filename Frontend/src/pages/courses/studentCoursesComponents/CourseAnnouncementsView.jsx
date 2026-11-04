import React, { useState, useEffect } from "react";
import { CloseSquare } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, slideUp } from "./constants";
import { getCourseAnnouncements, markAnnouncementAsRead, markAllAnnouncementsAsRead } from "../../../services/announcementService";
import { useAuth } from "../../../contexts/AuthContext";
import { Avatar, Button, Card, EmptyState, Skeleton } from "../../../components/UI";

export default function CourseAnnouncementsView({ activeCourseId }) {
    const [selectedId, setSelectedId] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        let mounted = true;
        async function fetchAnnouncements() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getCourseAnnouncements(activeCourseId, user?.userId);
                if (mounted) setAnnouncements(data || []);
            } catch (err) {
                console.error("Failed to load announcements:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchAnnouncements();
        return () => { mounted = false; };
    }, [activeCourseId, user?.userId]);

    const selectedAnnouncement = announcements.find(a => a.id === selectedId);

    const handleSelectAnnouncement = async (post) => {
        setSelectedId(post.id);
        if (user?.userId && !post.isRead) {
            // Optimistic local state update
            setAnnouncements(prev => prev.map(a => a.id === post.id ? { ...a, isRead: true } : a));
            try {
                await markAnnouncementAsRead(post.id, user.userId);
            } catch (err) {
                console.error("Failed to mark announcement as read:", err);
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!activeCourseId || !user?.userId) return;
        // Optimistic local state update
        setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
        try {
            await markAllAnnouncementsAsRead(activeCourseId, user.userId);
        } catch (err) {
            console.error("Failed to mark all announcements as read:", err);
        }
    };

    return (
        <motion.div className="flex-1 flex flex-col overflow-hidden h-full" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 shrink-0">
                <div>
                    <h1 className="font-display text-koru-title text-koru-on-surface">Announcements</h1>
                    <p className="text-koru-body text-koru-on-surface-variant mt-2">Latest updates from your lecturers</p>
                </div>
                {announcements.some(a => !a.isRead) && (
                    <Button
                        variant="tonal"
                        onClick={handleMarkAllRead}
                        className="self-start sm:self-auto"
                    >
                        Mark All as Read
                    </Button>
                )}
            </motion.header>

            {/* Split layout container */}
            <div className="flex-1 flex flex-row gap-6 min-h-0 overflow-hidden relative">
                {/* Left Column: List (Shrinks when an item is selected) */}
                <div 
                    className={`${
                        selectedId ? "hidden lg:flex" : "flex"
                    } flex-col gap-4 overflow-y-auto pr-2 transition-all duration-300 ${
                        selectedId ? "w-full lg:w-[45%] lg:shrink-0" : "w-full"
                    }`}
                >
                    {loading ? (
                        <div className="flex flex-col gap-4 w-full">
                            {[1, 2, 3, 4].map(i => (
                                <Card key={i} variant="outlined" tone="surface" className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 pl-2">
                                        <Skeleton variant="circle" className="w-10 h-10 shrink-0 mt-0.5" />
                                        <div className="flex-1 flex flex-col gap-2.5">
                                            <Skeleton variant="rect" className="h-5" width={`${45 + (i * 17) % 35}%`} />
                                            <Skeleton variant="text" className="w-4/5" />
                                            <Skeleton variant="text" className="w-32 mt-0.5" />
                                        </div>
                                    </div>
                                    <Skeleton variant="text" className="w-20 shrink-0" />
                                </Card>
                            ))}
                        </div>
                    ) : announcements.length === 0 ? (
                        <EmptyState size="sm" title="No announcements yet." className="w-full" />
                    ) : announcements.map((post) => (
                        <motion.div
                            key={post.id}
                            onClick={() => handleSelectAnnouncement(post)}
                            variants={slideUp}
                            className={`p-5 rounded-koru-md transition-all duration-200 ease-koru-out cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 group shrink-0 ring-1 ring-inset ${
                                selectedId === post.id 
                                    ? "bg-koru-primary-subtle ring-koru-primary/30 shadow-koru-card-hover" 
                                    : "bg-koru-surface-container-lowest ring-koru-outline-faint shadow-koru-card hover:shadow-koru-card-hover"
                            }`}
                        >

                            {/* Left & Middle detail content */}
                            <div className="flex flex-1 items-start gap-4 pl-2 min-w-0">
                                <Avatar

                                    src={post.lecturerProfileImageUrl}

                                    seed={post.lecturerId || post.lecturerName}

                                    name={post.lecturerName || "Lecturer"}

                                    size="md"

                                    className="mt-0.5"

                                />

                                {/* Title, author, preview */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h2 className={`font-display text-koru-heading leading-snug group-hover:text-koru-primary transition-colors ${!post.isRead ? "font-medium text-koru-on-surface" : "text-koru-on-surface-variant"}`}>
                                            {post.title}
                                        </h2>
                                        {!post.isRead && (
                                            <span className="flex h-2.5 w-2.5 shrink-0 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-koru-primary motion-reduce:animate-none"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-koru-primary"></span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-koru-on-surface-variant text-sm leading-relaxed line-clamp-1">
                                        {post.preview}
                                    </p>
                                    <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-primary mt-1.5 opacity-70">
                                        Posted by {post.lecturerName || post.lecturer?.name || post.lecturer || "Lecturer"}
                                    </p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="shrink-0 pl-6 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0 border-koru-outline-faint self-stretch md:self-auto flex md:flex-col items-center md:items-end justify-end">
                                <span className="text-koru-caption text-koru-on-surface-variant font-medium whitespace-nowrap">
                                    {post.datePosted
                                        ? new Date(post.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        : (post.date || "")}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Right Column: Detail Panel */}
                <AnimatePresence mode="wait">
                    {selectedId && selectedAnnouncement && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, transition: { duration: 0.15, ease: "easeIn" } }}
                            transition={{ type: "spring", damping: 30, stiffness: 250 }}
                            className={`${
                                selectedId ? "flex" : "hidden lg:flex"
                            } flex-1 w-full lg:w-[55%] bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint rounded-koru-3xl p-8 flex flex-col shadow-koru-card overflow-y-auto`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-medium text-koru-on-surface-variant">
                                    {selectedAnnouncement.datePosted
                                        ? new Date(selectedAnnouncement.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        : (selectedAnnouncement.date || "")}
                                </span>
                                <Button
                                    variant="tonal"
                                    size="icon"
                                    aria-label="Close announcement"
                                    onClick={() => setSelectedId(null)}
                                >
                                    <CloseSquare size={22} />
                                </Button>
                            </div>

                            <h2 className="font-display text-koru-title text-koru-on-surface leading-tight mb-4">
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
                                    <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Published By</p>
                                    <p className="font-medium text-koru-primary">{selectedAnnouncement.lecturerName || selectedAnnouncement.lecturer?.name || selectedAnnouncement.lecturer || "Lecturer"}</p>
                                </div>
                            </div>

                            <div className="prose max-w-none flex-1">
                                <p className="text-koru-heading leading-relaxed text-koru-on-surface-variant mb-6">
                                    {selectedAnnouncement.preview}
                                </p>
                                <p className="text-koru-on-surface-variant leading-relaxed text-sm">
                                    Please make sure to check the attached documents in the resources section if any are mentioned. If you have any follow-up questions regarding this announcement, feel free to reach out to the lecturer during office hours or post in the discussion forum.
                                </p>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
