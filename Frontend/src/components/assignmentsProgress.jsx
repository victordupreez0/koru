import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import AssignmentItem from "./UI/assignmentItem";
import ProgressRing from "./UI/progressRing";
import { useAuth } from "../contexts/AuthContext";
import { getStudentAssignments } from "../services/assignmentService";

// ──────────────────────────────────────────────
// Assignments data – easy to swap with backend later
// Each assignment needs: id, title, dueDate (display string),
// courseCode, completed (boolean)
// ──────────────────────────────────────────────
export default function AssignmentsProgress() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchAssignments() {
      if (!user?.userId) return;
      try {
        setLoading(true);
        const data = await getStudentAssignments(user.userId);
        
        // Map backend schema to our required UI schema
        const mapped = data.map(dbAssignment => ({
          id: dbAssignment.id,
          title: dbAssignment.title,
          dueDate: new Date(dbAssignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          courseCode: dbAssignment.course?.subject?.code || "N/A",
          completed: false, // Default to uncompleted until submission model is wired
        }));

        if (mounted) setAssignments(mapped);
      } catch (err) {
        console.error("Failed loading assignments:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAssignments();
    return () => { mounted = false; };
  }, [user?.userId]);

  // Fire confetti with brand colors
  function fireConfetti() {
    const colors = ["#3C0078", "#FF8731", "#87CEFA"];
    // Left burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.25, y: 0.3 },
      colors,
      gravity: 0.8,
      scalar: 1.1,
    });
    // Right burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.75, y: 0.3 },
      colors,
      gravity: 0.8,
      scalar: 1.1,
    });

    // Pulse background orbs vibrant for 3 seconds
    document.body.classList.add("orbs-vibrant");
    setTimeout(() => document.body.classList.remove("orbs-vibrant"), 3000);
  }

  // Toggle an assignment's completed status
  function toggleAssignment(id) {
    const target = assignments.find((a) => a.id === id);
    if (target && !target.completed) {
      fireConfetti();
    }
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
      <div className="flex items-center justify-between mt-5 mb-4">
        <h2 className="text-2xl font-['Gabarito']">Assignments</h2>
      </div>

      {/* ── Assignment Cards ── */}
      <div className="flex flex-col gap-3 min-h-[160px]">
        {loading ? (
            <div className="text-gray-400 text-sm font-medium w-full text-center mt-8">Loading assignments...</div>
        ) : assignments.length === 0 ? (
            <div className="text-gray-400 text-sm font-medium w-full text-center mt-8">You have no upcoming assignments.</div>
        ) : (
            assignments.map((assignment) => (
            <AssignmentItem
                key={assignment.id}
                title={assignment.title}
                dueDate={assignment.dueDate}
                courseCode={assignment.courseCode}
                completed={assignment.completed}
                onToggle={() => toggleAssignment(assignment.id)}
            />
            ))
        )}
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
