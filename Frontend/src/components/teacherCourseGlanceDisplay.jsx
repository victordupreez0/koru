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

                // Fetch assignments, submissions, grades and events in parallel
                const [assignmentsData, submissionsData, gradesData, attendanceData, eventsData] = await Promise.all([
                    getCourseAssignments(activeCourseId).catch(() => []),
                    getCourseSubmissions(activeCourseId).catch(() => []),
                    getCourseGrades(activeCourseId).catch(() => []),
                    getCourseAttendance(activeCourseId).catch(() => []),
                    getAllEvents().catch(() => [])
                ]);

                if (!mounted) return;

                // 1. Compute Grading Tasks
                // A submission needs grading if it has no grade record yet.
                // We use the grade table as the source of truth rather than the
                // status string, because late submissions stay "Late" in the DB
                // even after being graded (fixed going forward in GradeController,
                // but cross-reference handles existing stale rows).
                const gradedSubmissionIds = new Set(
                    (Array.isArray(gradesData) ? gradesData : []).map(g => g.submissionId)
                );
                const tasks = assignmentsData
                    .map(assignment => {
                        const pendingSubmissions = submissionsData.filter(
                            sub => sub.assignmentId === assignment.id && !gradedSubmissionIds.has(sub.id)
                        );
                        return {
                            id: assignment.id,
                            title: assignment.title,
                            pendingCount: pendingSubmissions.length
                        };
                    })
                    .filter(task => task.pendingCount > 0);

                setGradingTasks(tasks);

                // 2. Compute Next Class
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
                        time: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                        room
                    });
                } else {
                    setNextClass(null);
                }

                // 3. Compute Attendance Stats
                if (attendanceData && attendanceData.length > 0) {
                    const total = attendanceData.length;
                    const attended = attendanceData.filter(r => r.status !== "Absent").length;
                    const overallRate = Math.round((attended / total) * 100);
                    const totalSessions = new Set(attendanceData.map(r => r.date?.split("T")[0])).size;

                    setAttendanceStats({
                        rate: overallRate,
                        sessions: totalSessions
                    });
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
        return <div className="text-xs text-gray-500 py-2">Select a course to see details.</div>;
    }

    if (loading) {
        return <div className="text-sm text-gray-400 py-4 text-center">Loading course overview...</div>;
    }

    return (
        <div className="w-full h-fit rounded-2xl mt-4">
            {/* Pending Grading Section */}
            <h3 className="font-medium text-sm text-gray-700">Pending Grading:</h3>
            {gradingTasks.length === 0 ? (
                <div className="my-2 bg-white rounded-xl shadow-sm w-full h-12 flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-xs text-gray-400 font-medium">All assignments graded! 🎉</span>
                </div>
            ) : (
                gradingTasks.map(task => (
                    <div
                        key={task.id}
                        className="my-2 bg-white rounded-xl shadow-sm w-full h-12 flex flex-row items-center space-x-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                        onClick={() => navigate(`/courses/${activeCourseId}/assignments`)}
                    >
                        {/* Purple icon badge */}
                        <div className="w-9 h-9 bg-purple-400 rounded-full ml-2 flex items-center justify-center shrink-0">
                            <MdEditNote className="w-6 h-6 text-white" />
                        </div>

                        {/* Task title and pending grading count */}
                        <div className="ml-2 flex flex-col justify-center space-y-0.5 flex-1 min-w-0">
                            <h3 className="text-sm font-bold truncate text-gray-800">{task.title}</h3>
                            <h3 className="text-xs text-gray-500 font-medium">
                                {task.pendingCount} submission{task.pendingCount !== 1 ? 's' : ''} to grade
                            </h3>
                        </div>

                        {/* Arrow icon */}
                        <div className="w-9 h-9 flex items-center justify-center mr-2 shrink-0">
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                ))
            )}

            {/* Next Class Section */}
            <h3 className="font-medium text-sm text-gray-700 mt-4">Next Class:</h3>
            {nextClass ? (
                <NextClassItem subject={nextClass.subject} time={nextClass.time} room={nextClass.room} />
            ) : (
                <div className="text-xs text-gray-500 py-2 font-medium">No upcoming classes scheduled</div>
            )}

            {/* Attendance Section */}
            <h3 className="font-medium text-sm text-gray-700 mt-4">Attendance Rate:</h3>
            {attendanceStats ? (
                <div
                    className="my-2 bg-white rounded-xl shadow-sm w-full h-14 flex flex-row items-center space-x-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/courses/${activeCourseId}/attendance`)}
                >
                    {/* Teal icon badge */}
                    <div className="w-9 h-9 bg-teal-400 rounded-full ml-2 flex items-center justify-center shrink-0">
                        <MdPeopleOutline className="w-6 h-6 text-white" />
                    </div>

                    {/* Attendance summary */}
                    <div className="ml-2 flex flex-col justify-center space-y-0.5 flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-800">Class Presence</h3>
                        <h3 className="text-xs text-gray-500 font-medium">
                            Across {attendanceStats.sessions} session{attendanceStats.sessions !== 1 ? 's' : ''}
                        </h3>
                    </div>

                    {/* Rate Badge */}
                    <div className="mr-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            attendanceStats.rate >= 80 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                            {attendanceStats.rate}%
                        </span>
                    </div>

                    {/* Arrow icon */}
                    <div className="w-9 h-9 flex items-center justify-center mr-1 shrink-0">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            ) : (
                <div className="text-xs text-gray-500 py-2 font-medium">No attendance records logged yet</div>
            )}
        </div>
    );
}
