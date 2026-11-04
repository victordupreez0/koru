import { useState, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import AssignmentItem from "./UI/assignmentItem";
import ProgressRing from "./UI/progressRing";
import { useAuth } from "../contexts/AuthContext";
import { getStudentAssignments } from "../services/assignmentService";
import { getStudentSubmissions } from "../services/submissionService";
import { getStudentStats } from "../services/attendanceService";
import { Card, Skeleton } from "./UI";

const MIN_LOADING_MS = 1500;

function SkeletonAssignment() {
  return (
    <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint">
      <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="h-2.5 w-1/2" />
      </div>
      <Skeleton variant="circle" className="h-6 w-6 shrink-0" />
    </div>
  );
}

function SkeletonRing() {
  return (
    <div className="p-4 flex flex-col items-center gap-3">
      <Skeleton variant="text" className="h-2.5 w-20" />
      <Skeleton variant="circle" className="h-28 w-28" />
    </div>
  );
}

export default function AssignmentsProgress() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [attendanceRate, setAttendanceRate] = useState(100);
  const [loading, setLoading] = useState(true);

  const getRankAndState = (dbAssignment, submissions) => {
    const submitted = submissions.some(s => s.assignmentId === dbAssignment.id);
    if (submitted) return { rank: 4, uiState: "Submitted", isCompleted: true };
    if (dbAssignment.isClosed) return { rank: 3, uiState: "Closed", isCompleted: false };
    const now = new Date();
    const due = new Date(dbAssignment.dueDate);
    const diffDays = (due - now) / (1000 * 60 * 60 * 24);
    if (diffDays < -7) return { rank: 3, uiState: "Closed", isCompleted: false };
    if (diffDays < 0)  return { rank: 0, uiState: "Late",   isCompleted: false };
    if (diffDays <= 5) return { rank: 1, uiState: "Due Soon", isCompleted: false };
    return { rank: 2, uiState: "Due", isCompleted: false };
  };

  useEffect(() => {
    let mounted = true;
    async function fetchAssignmentsAndStats() {
      if (!user?.userId) return;
      try {
        setLoading(true);
        const [data, subs, stats] = await Promise.all([
          getStudentAssignments(user.userId),
          getStudentSubmissions(user.userId).catch(() => []),
          getStudentStats(user.userId).catch(() => null),
          new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
        ]);

        const mapped = data.map(dbAssignment => {
          const { rank, uiState, isCompleted } = getRankAndState(dbAssignment, subs || []);
          return {
            id: dbAssignment.id,
            courseId: dbAssignment.courseId,
            title: dbAssignment.title,
            dueDate: new Date(dbAssignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
            courseCode: dbAssignment.course?.subject?.code || "N/A",
            completed: isCompleted,
            rank,
            uiState,
          };
        }).sort((a, b) => a.rank - b.rank);

        if (mounted) {
          setAssignments(mapped);
          if (stats && typeof stats.overallAttendanceRate === "number") {
            setAttendanceRate(stats.overallAttendanceRate);
          }
        }
      } catch (err) {
        console.error("Failed loading data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAssignmentsAndStats();
    return () => { mounted = false; };
  }, [user?.userId]);

  function fireConfetti() {
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = ["--color-koru-primary", "--color-koru-accent", "--color-koru-sky"]
      .map((token) => rootStyle.getPropertyValue(token).trim())
      .filter(Boolean);
    confetti({ particleCount: 80, spread: 70, origin: { x: 0.25, y: 0.3 }, colors, gravity: 0.8, scalar: 1.1 });
    confetti({ particleCount: 80, spread: 70, origin: { x: 0.75, y: 0.3 }, colors, gravity: 0.8, scalar: 1.1 });
    document.body.classList.add("orbs-vibrant");
    setTimeout(() => document.body.classList.remove("orbs-vibrant"), 3000);
  }

  function toggleAssignment(id) {
    const target = assignments.find((a) => a.id === id);
    if (target && !target.completed) fireConfetti();
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  }

  const progress = useMemo(() => {
    if (assignments.length === 0) return 0;
    const done = assignments.filter((a) => a.completed).length;
    return Math.round((done / assignments.length) * 100);
  }, [assignments]);

  const nextThree = useMemo(
    () => assignments.filter((a) => !a.completed).slice(0, 3),
    [assignments]
  );

  return (
    <Card variant="outlined" tone="low" radius="lg" padding="sm" className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between mt-5 mb-5">
        <h2 className="font-display text-koru-heading text-koru-on-surface">Assignments</h2>
      </div>

      <div className="flex flex-col pr-2">
        <div className="flex flex-col">
          {loading ? (
            <>{[0, 1, 2].map(i => <SkeletonAssignment key={i} />)}</>
          ) : nextThree.length === 0 ? (
            <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No upcoming assignments.</div>
          ) : (
            nextThree.map((assignment) => (
              <AssignmentItem
                key={assignment.id}
                assignmentId={assignment.id}
                courseId={assignment.courseId}
                title={assignment.title}
                dueDate={assignment.dueDate}
                courseCode={assignment.courseCode}
                completed={assignment.completed}
                uiState={assignment.uiState}
                onToggle={() => toggleAssignment(assignment.id)}
              />
            ))
          )}
        </div>

        {/* Progress section pushed to bottom of equalised card via mt-auto */}
        <h2 className="mb-4 mt-auto pt-8 font-display text-koru-heading text-koru-on-surface">Progress & Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <>{[0, 1].map(i => <SkeletonRing key={i} />)}</>
          ) : (
            <>
              <div className="p-4 flex flex-col items-center">
                <span className="mb-2 text-koru-caption font-medium text-koru-primary/70">Assignments</span>
                <ProgressRing percentage={progress} size={110} strokeWidth={8} />
              </div>
              <div className="p-4 flex flex-col items-center">
                <span className="mb-2 text-koru-caption font-medium text-koru-primary/70">Attendance</span>
                <ProgressRing percentage={attendanceRate} size={110} strokeWidth={8} />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
