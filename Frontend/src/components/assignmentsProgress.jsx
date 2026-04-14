import { useState, useMemo } from "react";
import { MdAdd } from "react-icons/md";
import AssignmentItem from "./UI/assignmentItem";
import ProgressRing from "./UI/progressRing";

// ──────────────────────────────────────────────
// Assignments data – easy to swap with backend later
// Each assignment needs: id, title, dueDate (display string),
// courseCode, completed (boolean)
// ──────────────────────────────────────────────
const initialAssignments = [
  {
    id: 1,
    title: "High Fidelity Wireframes",
    dueDate: "Mar 2 at 20:00",
    courseCode: "UX300",
    completed: false,
  },
  {
    id: 2,
    title: "Essay Draft",
    dueDate: "Mar 10 at 20:00",
    courseCode: "VC300",
    completed: false,
  },
  {
    id: 3,
    title: "Progress Mark",
    dueDate: "Mar 21 at 10:00",
    courseCode: "DV300",
    completed: false,
  },
];

export default function AssignmentsProgress() {
  const [assignments, setAssignments] = useState(initialAssignments);

  // Toggle an assignment's completed status
  function toggleAssignment(id) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  }

  // Calculate overall progress
  const progress = useMemo(() => {
    if (assignments.length === 0) return 0;
    const done = assignments.filter((a) => a.completed).length;
    return Math.round((done / assignments.length) * 100);
  }, [assignments]);

  return (
    <div className="w-full">
      {/* ── Assignments Header ── */}
      <div className="flex items-center gap-2.5 mt-5 mb-4">
        <h2 className="text-2xl font-['Gabarito']">Assignments</h2>
        <button
          className="w-7 h-7 rounded-full border-2 border-[#3C0078] flex items-center justify-center bg-transparent p-0 hover:bg-[#3C0078]/8 transition-colors cursor-pointer"
          aria-label="Add assignment"
        >
          <MdAdd className="w-4 h-4 text-[#3C0078]" />
        </button>
      </div>

      {/* ── Assignment Cards ── */}
      <div className="flex flex-col gap-3">
        {assignments.map((assignment) => (
          <AssignmentItem
            key={assignment.id}
            title={assignment.title}
            dueDate={assignment.dueDate}
            courseCode={assignment.courseCode}
            completed={assignment.completed}
            onToggle={() => toggleAssignment(assignment.id)}
          />
        ))}
      </div>

      {/* ── Progress Header ── */}
      <h2 className="text-2xl font-['Gabarito'] mt-8 mb-2">Progress</h2>

      {/* ── Progress Ring ── */}
      <div className="w-full bg-gray-100 rounded-2xl border border-gray-200 p-4">
        <ProgressRing percentage={progress} />
      </div>
    </div>
  );
}
