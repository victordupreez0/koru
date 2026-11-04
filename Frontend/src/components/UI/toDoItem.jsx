import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdEditNote } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { getCourseAssignments } from "../../services/assignmentService";
import { getStudentSubmissions } from "../../services/submissionService";
import { useAuth } from "../../contexts/AuthContext";
import Skeleton from "./Skeleton";

const MIN_LOADING_MS = 1500;

function SkeletonRow() {
    return (
        <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint">
            <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="h-2.5 w-1/2" />
            </div>
        </div>
    );
}

export default function ToDoItem({ activeCourseId }) {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        let mounted = true;
        async function fetchAssignments() {
            if (!activeCourseId) {
                setTodos([]);
                return;
            }
            try {
                setLoading(true);
                const [data, submissions] = await Promise.all([
                    getCourseAssignments(activeCourseId),
                    user?.userId ? getStudentSubmissions(user.userId).catch(() => []) : Promise.resolve([]),
                    new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
                ]);

                const submittedAssignmentIds = new Set(
                    (Array.isArray(submissions) ? submissions : []).map(s => s.assignmentId)
                );

                const now = new Date();
                const upcoming = data
                    .filter(a => new Date(a.dueDate) > now && !submittedAssignmentIds.has(a.id))
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 3)
                    .map(a => {
                        const due = new Date(a.dueDate);
                        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                        let dueLabel = "Due soon";
                        if (diffDays === 1) dueLabel = "Due tomorrow";
                        else if (diffDays <= 7) dueLabel = `Due in ${diffDays} days`;
                        else dueLabel = `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                        return { id: a.id, courseId: activeCourseId, title: a.title, due: dueLabel };
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
    }, [activeCourseId, user?.userId]);

    if (loading) {
        return <>{[1, 2].map(i => <SkeletonRow key={i} />)}</>;
    }

    if (todos.length === 0) {
        return <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No upcoming tasks</div>;
    }

    return (
        <>
            {todos.map((todo, idx) => (
                <button
                    type="button"
                    key={idx}
                    className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 text-left shadow-koru-card ring-1 ring-inset ring-koru-outline-faint cursor-pointer transition duration-150 ease-koru-out hover:bg-koru-surface-container-low hover:shadow-koru-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                    onClick={() => navigate(`/courses/${todo.courseId}/assignments/${todo.id}`)}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koru-primary-container/60">
                        <MdEditNote className="h-5 w-5 text-koru-primary" aria-hidden="true" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                        <h3 className="truncate text-koru-label text-koru-on-surface">{todo.title}</h3>
                        <p className="text-koru-caption text-koru-on-surface-variant">{todo.due}</p>
                    </div>

                    <div className="flex h-9 w-6 shrink-0 items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-koru-outline" aria-hidden="true" />
                    </div>
                </button>
            ))}
        </>
    );
}
