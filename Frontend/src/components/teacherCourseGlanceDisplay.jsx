import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEditNote, MdPeopleOutline } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import NextClassItem from "./UI/nextClassItem";
import { getCourseAssignments } from "../services/assignmentService";
import { getCourseSubmissions } from "../services/submissionService";
import { getCourseAttendance } from "../services/attendanceService";
import { getAllEvents } from "../services/eventService";
import { getCourseGrades } from "../services/gradeService";
import { Badge, Skeleton } from "./UI";

const MIN_LOADING_MS = 1500;

const ROW_CLASS =
    "my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 text-left shadow-koru-card ring-1 ring-inset ring-koru-outline-faint cursor-pointer transition duration-150 ease-koru-out hover:bg-koru-surface-container-low hover:shadow-koru-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus";

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

function SectionLabel({ children, className = "" }) {
    return (
        <p className={`text-koru-caption font-medium text-koru-on-surface-variant ${className}`}>
            {children}
        </p>
    );
}

export default function TeacherCourseGlanceDisplay({ activeCourseId }) {
    const [loading, setLoading] = useState(false);
    const [gradingTasks, setGradingTasks] = useState([]);
    const [nextClass, setNextClass] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            if (!activeCourseId) return;
            try {
                setLoading(true);

                const [assignmentsData, submissionsData, gradesData, attendanceData, eventsData] = await Promise.all([
                    getCourseAssignments(activeCourseId).catch(() => []),
                    getCourseSubmissions(activeCourseId).catch(() => []),
                    getCourseGrades(activeCourseId).catch(() => []),
                    getCourseAttendance(activeCourseId).catch(() => []),
                    getAllEvents().catch(() => []),
                    new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
                ]);

                if (!mounted) return;

                const gradedSubmissionIds = new Set(
                    (Array.isArray(gradesData) ? gradesData : []).map(g => g.submissionId)
                );
                const tasks = assignmentsData
                    .map(assignment => {
                        const pendingSubmissions = submissionsData.filter(
                            sub => sub.assignmentId === assignment.id && !gradedSubmissionIds.has(sub.id)
                        );
                        return { id: assignment.id, title: assignment.title, pendingCount: pendingSubmissions.length };
                    })
                    .filter(task => task.pendingCount > 0);

                setGradingTasks(tasks);

                const now = new Date();
                const futureEvents = eventsData
                    .filter(e => {
                        if (e.courseId !== activeCourseId) return false;
                        if (new Date(e.startTime) <= now) return false;
                        const type = e.eventType?.toLowerCase() || "";
                        return type === "class" || type === "lecture" || type === "practical";
                    })
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                if (futureEvents.length > 0) {
                    const next = futureEvents[0];
                    const start = new Date(next.startTime);
                    const end = new Date(next.endTime);
                    let room = "TBA";
                    if (next.description && next.description.includes("|")) {
                        room = next.description.split("|")[1] || "TBA";
                    }
                    setNextClass({
                        subject: next.title || "Class",
                        date: start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
                        time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`,
                        room,
                    });
                } else {
                    setNextClass(null);
                }

                if (attendanceData && attendanceData.length > 0) {
                    const total = attendanceData.length;
                    const attended = attendanceData.filter(r => r.status !== "Absent").length;
                    const overallRate = Math.round((attended / total) * 100);
                    const totalSessions = new Set(attendanceData.map(r => r.date?.split("T")[0])).size;
                    setAttendanceStats({ rate: overallRate, sessions: totalSessions });
                } else {
                    setAttendanceStats(null);
                }

            } catch (err) {
                console.error("Failed to fetch teacher glance data:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId]);

    if (!activeCourseId) {
        return <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">Select a course to see details.</div>;
    }

    if (loading) {
        return (
            <div className="w-full mt-4 space-y-1">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
            </div>
        );
    }

    return (
        <div className="mt-4 h-fit w-full">
            <SectionLabel>Pending Grading</SectionLabel>
            {gradingTasks.length === 0 ? (
                <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">All assignments graded</div>
            ) : (
                gradingTasks.map(task => (
                    <button
                        type="button"
                        key={task.id}
                        className={ROW_CLASS}
                        onClick={() => navigate(`/courses/${activeCourseId}/assignments`)}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koru-primary-container/60">
                            <MdEditNote className="h-5 w-5 text-koru-primary" />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                            <h3 className="truncate text-koru-label text-koru-on-surface">{task.title}</h3>
                            <p className="text-koru-caption text-koru-on-surface-variant">
                                {task.pendingCount} submission{task.pendingCount !== 1 ? "s" : ""} to grade
                            </p>
                        </div>

                        <div className="flex h-9 w-6 shrink-0 items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-koru-outline" />
                        </div>
                    </button>
                ))
            )}

            <SectionLabel className="mt-5">Next Class</SectionLabel>
            {nextClass ? (
                <NextClassItem subject={nextClass.subject} date={nextClass.date} time={nextClass.time} room={nextClass.room} />
            ) : (
                <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No upcoming classes scheduled</div>
            )}

            <SectionLabel className="mt-5">Attendance Rate</SectionLabel>
            {attendanceStats ? (
                <button
                    type="button"
                    className={ROW_CLASS}
                    onClick={() => navigate(`/courses/${activeCourseId}/attendance`)}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koru-info-soft">
                        <MdPeopleOutline className="h-5 w-5 text-koru-info" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                        <h3 className="text-koru-label text-koru-on-surface">Class Presence</h3>
                        <p className="text-koru-caption text-koru-on-surface-variant">
                            Across {attendanceStats.sessions} session{attendanceStats.sessions !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <Badge variant={attendanceStats.rate >= 80 ? "success" : "error"}>
                            {attendanceStats.rate}%
                        </Badge>
                    </div>

                    <div className="flex h-9 w-6 shrink-0 items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-koru-outline" />
                    </div>
                </button>
            ) : (
                <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No attendance records logged yet</div>
            )}
        </div>
    );
}
