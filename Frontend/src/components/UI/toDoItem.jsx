
import { MdEditNote, MdCheckBoxOutlineBlank } from "react-icons/md";

// Static placeholder list of to-do tasks – will be replaced by backend data later
const todos = [
    { title: "Research Document", due: "Due Tomorrow" },
    { title: "Read Chapter 5", due: "Due Friday" },
    { title: "Submit Assignment", due: "Due Next Week" },
];

// To-Do item list – renders inside the Course Glance card
// Each row shows a task icon, the task title, its due date, and a checkbox placeholder
export default function ToDoItem() {
    return (
        <>
            {todos.map((todo, idx) => (
                <div
                    key={idx}
                    className="my-2 bg-white rounded-lg w-full h-12 flex flex-row items-center space-x-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:bg-[#9161C0]/5"
                >
                    {/* Purple icon badge */}
                    <div className="w-9 h-9 bg-[#9161C0] rounded-md ml-2 flex items-center justify-center">
                        <MdEditNote className="w-6 h-6 text-white" />
                    </div>

                    {/* Task title and due date */}
                    <div className="ml-2 flex flex-col justify-center space-y-1 flex-1">
                        <h3 className="text-sm font-bold">{todo.title}</h3>
                        <h3 className="text-xs text-gray-500">{todo.due}</h3>
                    </div>

                    {/* Checkbox placeholder – will toggle completion state later */}
                    <div className="w-9 h-9 flex items-center justify-center mr-2">
                        <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                    </div>
                </div>
            ))}
        </>
    );
}
