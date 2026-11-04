import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";
import { getCourseAnnouncements, markAnnouncementAsRead } from "../services/announcementService";
import { getAllEvents } from "../services/eventService";
import { Skeleton } from "./UI";

const MIN_LOADING_MS = 1500;

function SectionLabel({ children, className = "" }) {
    return (
        <p className={`text-koru-caption font-medium text-koru-on-surface-variant ${className}`}>
            {children}
        </p>
    );
}

function NextClassSkeleton() {
    return (
        <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint">
            <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="w-2/3" />
                <Skeleton variant="text" className="h-2.5 w-1/2" />
            </div>
        </div>
    );
}

function AnnouncementSkeleton() {
    return (
        <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint">
            <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="h-2.5 w-1/2" />
            </div>
            <Skeleton variant="text" className="h-2.5 w-8 shrink-0" />
        </div>
    );
}

export default function CourseGlanceDisplay({ activeCourseId }) {
    const [announcements, setAnnouncements] = useState([]);
    const [nextClass, setNextClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            if (!activeCourseId) {
                if (mounted) setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const [annData, evtData] = await Promise.all([
                    getCourseAnnouncements(activeCourseId, user?.userId).catch(() => []),
                    getAllEvents().catch(() => []),
                    new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
                ]);

                if (!mounted) return;

                setAnnouncements(Array.isArray(annData) ? annData.slice(0, 2) : []);

                const now = new Date();
                const futureEvents = (Array.isArray(evtData) ? evtData : [])
                    .filter(e => {
                        if (e.courseId !== activeCourseId) return false;
                        if (new Date(e.startTime) <= now) return false;
                        const type = e.eventType?.toLowerCase() || "";
                        return type === "class" || type === "lecture" || type === "practical";
                    })
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                if (futureEvents.length > 0) {
                    const next = futureEvents[0];
                    const start = new Date(next.startTime);
                    const end = new Date(next.endTime);
                    let room = "TBA";
                    if (next.description && next.description.includes("|")) {
                        room = next.description.split("|")[1] || "TBA";
                    }
                    setNextClass({
                        subject: next.title || "Class",
                        date: start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
                        time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`,
                        room,
                    });
                } else {
                    setNextClass(null);
                }
            } catch (err) {
                console.error("Failed to fetch data for glance:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId, user?.userId]);

    return (
        <div className="mt-4 h-fit w-full">
            <SectionLabel>To Do</SectionLabel>
            <ToDoItem activeCourseId={activeCourseId} />

            <SectionLabel className="mt-5">Next Class</SectionLabel>
            {loading ? (
                <NextClassSkeleton />
            ) : nextClass ? (
                <NextClassItem subject={nextClass.subject} date={nextClass.date} time={nextClass.time} room={nextClass.room} />
            ) : (
                <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No upcoming classes scheduled</div>
            )}

            <SectionLabel className="mt-5">Announcements</SectionLabel>
            {loading ? (
                <>{[1, 2].map(i => <AnnouncementSkeleton key={i} />)}</>
            ) : announcements.length === 0 ? (
                <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No recent announcements</div>
            ) : (
                announcements.map(a => (
                    <AnnouncementsItem
                        key={a.id}
                        title={a.title}
                        message={a.preview}
                        time={new Date(a.datePosted).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        isRead={a.isRead}
                        onClick={async () => {
                            try {
                                if (user?.userId && !a.isRead) {
                                    await markAnnouncementAsRead(a.id, user.userId);
                                }
                            } catch (err) {
                                console.error("Failed to mark announcement as read:", err);
                            }
                            navigate(`/courses/${activeCourseId}/announcements`);
                        }}
                    />
                ))
            )}
        </div>
    );
}
