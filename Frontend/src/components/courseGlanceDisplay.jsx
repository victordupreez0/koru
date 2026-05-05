import { useEffect, useState } from "react";
import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";
import { getCourseAnnouncements } from "../services/announcementService";
import { getAllEvents } from "../services/eventService";

// Course Glance detail card – renders inside the CourseGlance widget
// Groups three sections: outstanding to-do items, the next upcoming class,
// and recent announcements from lecturers
export default function CourseGlanceDisplay({ activeCourseId }) {
    const [announcements, setAnnouncements] = useState([]);
    const [nextClass, setNextClass] = useState(null);

    useEffect(() => {
        let mounted = true;
        
        async function fetchData() {
            if (!activeCourseId) return;
            try {
                // Fetch Announcements
                const annData = await getCourseAnnouncements(activeCourseId);
                if (mounted) setAnnouncements(annData.slice(0, 2));

                // Fetch Events to find the next class
                const evtData = await getAllEvents();
                if (mounted) {
                    const now = new Date();
                    console.log("[CourseGlance] All events:", evtData);
                    console.log("[CourseGlance] Active course ID:", activeCourseId);
                    console.log("[CourseGlance] Now:", now);
                    
                    const futureEvents = evtData
                        .filter(e => {
                            if (e.courseId !== activeCourseId) return false;
                            if (new Date(e.startTime) <= now) return false;
                            
                            const type = e.eventType?.toLowerCase() || "";
                            return type === "class" || type === "lecture" || type === "practical";
                        })
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    
                    console.log("[CourseGlance] Future class events for this course:", futureEvents);
                    
                    if (futureEvents.length > 0) {
                        const next = futureEvents[0];
                        const start = new Date(next.startTime);
                        const end = new Date(next.endTime);
                        
                        let room = "TBA";
                        if (next.description && next.description.includes("|")) {
                            room = next.description.split("|")[1];
                        }
                        
                        setNextClass({
                            subject: next.title || "Class",
                            time: `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}`,
                            room: room
                        });
                    } else {
                        setNextClass(null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data for glance:", err);
            }
        }
        
        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId]);

    return (
        <>
        <div className="w-full h-fit bg-white/50 dark:bg-slate-800/60 rounded-2xl p-4 mt-4 border border-gray-200 dark:border-slate-700">

                <h3 className="font-medium dark:text-slate-100">Todo:</h3>
                <ToDoItem activeCourseId={activeCourseId} />

                <h3 className="font-medium dark:text-slate-100 mt-4">Next Class:</h3>
                {nextClass ? (
                    <NextClassItem subject={nextClass.subject} time={nextClass.time} room={nextClass.room} />
                ) : (
                    <div className="text-xs text-gray-500 py-2">No upcoming classes scheduled</div>
                )}

                <h3 className="font-medium dark:text-slate-100 mb-2">Announcements:</h3>
                {announcements.length === 0 ? (
                    <div className="text-xs text-gray-500 py-2">No recent announcements</div>
                ) : (
                    announcements.map(a => (
                        <AnnouncementsItem 
                            key={a.id}
                            title={a.title}
                            message={a.preview}
                            time={new Date(a.datePosted).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        />
                    ))
                )}
            </div>

        </>
    )
}