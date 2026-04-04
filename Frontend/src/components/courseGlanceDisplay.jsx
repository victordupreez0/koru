import NextClassItem from "./UI/nextClassItem";
import ToDoItem from "./UI/toDoItem";


export default function CourseGlanceDisplay() {
    return(
        <>
        <div className="w-[350px] h-fit bg-gray-100 rounded-xl p-4 mt-4 border border-gray-200 ">

        <h3 className="font-medium">Todo:</h3>
        <ToDoItem />
        
        <h3 className="font-medium">Next Class:</h3>
        <NextClassItem />

        <h3 className="font-medium">Announcements:</h3>

        </div>
        
        
        </>
    )
}