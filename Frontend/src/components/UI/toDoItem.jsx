import { useState, useEffect } from "react";
import { MdEditNote } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { getCourseAssignments } from "../../services/assignmentService";

// To-Do item list – renders inside the Course Glance card
// Each row shows a task icon, the task title, its due date, and a checkbox placeholder
export default function ToDoItem({ activeCourseId }) {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function fetchAssignments() {
            if (!activeCourseId) {
                setTodos([]);
                return;
            }
            try {
                setLoading(true);
                const data = await getCourseAssignments(activeCourseId);
                
                // Filter for upcoming assignments (Due Date hasn't passed)
                const now = new Date();
                const upcoming = data
                    .filter(a => new Date(a.dueDate) > now)
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 3) // showing max 3 upcoming ones
                    .map(a => {
                        const due = new Date(a.dueDate);
                        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                        let dueLabel = "Due soon";
                        if (diffDays === 1) dueLabel = "Due Tomorrow";
                        else if (diffDays <= 7) dueLabel = `Due in ${diffDays} days`;
                        else dueLabel = `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                        
                        return { title: a.title, due: dueLabel };
                    });

                if (mounted) setTodos(upcoming);
            } catch (err) {
                console.error("Failed to load upcoming to-dos:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchAssignments();
        return () => { mounted = false; };
    }, [activeCourseId]);

    if (loading) {
        return <div className="text-sm text-gray-400 py-2">Loading tasks...</div>;
    }

    if (todos.length === 0) {
        return <div className="text-sm text-gray-400 py-2">No upcoming tasks!</div>;
    }

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

                    {/* Arrow icon */}
                    <div className="w-9 h-9 flex items-center justify-center mr-2">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            ))}
        </>
    );
}
