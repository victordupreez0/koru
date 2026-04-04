


import { MdEditNote, MdCheckBoxOutlineBlank } from "react-icons/md";


const todos = [
    { title: "Research Document", due: "Due Tomorrow" },
    { title: "Read Chapter 5", due: "Due Friday" },
    { title: "Submit Assignment", due: "Due Next Week" },
];

export default function ToDoItem() {
    return (
        <>
            {todos.map((todo, idx) => (
                <div key={idx} className="my-2 bg-white rounded-lg w-full h-12 flex flex-row items-center space-x-2">
                    <div className="w-9 h-9 bg-gray-200 rounded-md ml-2 flex items-center justify-center">
                        <MdEditNote className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="ml-2 flex flex-col justify-center space-y-1 flex-1">
                        <h3 className="text-sm">{todo.title}</h3>
                        <h3 className="text-xs text-gray-500">{todo.due}</h3>
                    </div>
                    <div className="w-9 h-9 flex items-center justify-center mr-2">
                        <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400" />
                    </div>
                </div>
            ))}
        </>
    );
}
