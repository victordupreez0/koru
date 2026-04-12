import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";

// Course Glance detail card – renders inside the CourseGlance widget
// Groups three sections: outstanding to-do items, the next upcoming class,
// and recent announcements from lecturers
export default function CourseGlanceDisplay() {
    return(
        <>
        <div className="w-[350px] h-fit bg-gray-100 rounded-xl p-4 mt-4 border border-gray-200 ">

        {/* Outstanding tasks for this course */}
        <h3 className="font-medium">Todo:</h3>
        <ToDoItem />
        
        {/* Next scheduled class session */}
        <h3 className="font-medium">Next Class:</h3>
        <NextClassItem />

        {/* Recent lecturer announcements */}
        <h3 className="font-medium">Announcements:</h3>
        <AnnouncementsItem />
        </div>
        
        
        </>
    )
}