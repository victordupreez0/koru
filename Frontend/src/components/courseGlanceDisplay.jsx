import AnnouncementsItem from "./UI/announcementsItem";
import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";


export default function CourseGlanceDisplay() {
    return (
        <>
            <div className="w-full h-fit bg-white/50 rounded-2xl p-4 mt-4 border border-gray-200 ">

                <h3 className="font-medium">Todo:</h3>
                <ToDoItem />

                <h3 className="font-medium">Next Class:</h3>
                <NextClassItem />

                <h3 className="font-medium">Announcements:</h3>
                <AnnouncementsItem />
            </div>


        </>
    )
}