import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";

// Course Glance detail card – renders inside the CourseGlance widget
// Groups three sections: outstanding to-do items, the next upcoming class,
// and recent announcements from lecturers
export default function CourseGlanceDisplay({ activeCourseId }) {
    return (
        <>
            <div className="w-full h-fit  rounded-2xl mt-4 ">

                <h3 className="font-medium">Todo:</h3>
                <ToDoItem activeCourseId={activeCourseId} />

                <h3 className="font-medium">Next Class:</h3>
                <NextClassItem />

                <h3 className="font-medium">Announcements:</h3>
                <AnnouncementsItem />
            </div>

        </>
    )
}