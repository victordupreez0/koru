import { useEffect, useState } from "react";
import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";
import { getCourseAnnouncements } from "../services/announcementService";

// Course Glance detail card – renders inside the CourseGlance widget
// Groups three sections: outstanding to-do items, the next upcoming class,
// and recent announcements from lecturers
export default function CourseGlanceDisplay({ activeCourseId }) {
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        let mounted = true;
        async function fetchAnnouncements() {
            if (!activeCourseId) return;
            try {
                const data = await getCourseAnnouncements(activeCourseId);
                // Only show the 2 most recent announcements in the glance view
                if (mounted) setAnnouncements(data.slice(0, 2));
            } catch (err) {
                console.error("Failed to fetch announcements for glance:", err);
            }
        }
        fetchAnnouncements();
        return () => { mounted = false; };
    }, [activeCourseId]);

    return (
        <>
            <div className="w-full h-fit bg-white/50 rounded-2xl p-4 mt-4 border border-gray-200 ">

                <h3 className="font-medium">Todo:</h3>
                <ToDoItem activeCourseId={activeCourseId} />

                <h3 className="font-medium">Next Class:</h3>
                <NextClassItem />

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