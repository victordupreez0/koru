import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";

// Course Glance detail card – renders inside the CourseGlance widget
// Groups three sections: outstanding to-do items, the next upcoming class,
// and recent announcements from lecturers
export default function CourseGlanceDisplay({ activeCourseId }) {
    return (
        <>
        <div className="w-full h-fit bg-white/50 dark:bg-slate-800/60 rounded-2xl p-4 mt-4 border border-gray-200 dark:border-slate-700">

                <h3 className="font-medium dark:text-slate-100">Todo:</h3>
                <ToDoItem activeCourseId={activeCourseId} />

                <h3 className="font-medium dark:text-slate-100">Next Class:</h3>
                <NextClassItem />

                <h3 className="font-medium dark:text-slate-100">Announcements:</h3>
                <AnnouncementsItem />
            </div>

        </>
    )
}