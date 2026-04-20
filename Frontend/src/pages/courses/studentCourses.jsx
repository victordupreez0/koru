import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCourses } from "../../contexts/CoursesContext";
import CourseMenu from "../../components/coursesMenu";
import CourseSecondaryNav from "../../components/courseSecondaryNav";
import SideMenu from "../../components/sideMenu";
import Menu from "../../components/menu";
import ModuleAccordion from "../../components/moduleAccordion";
import { Bell, Calendar, Folder, Upload, InfoCircle, CheckCircle, CloseCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import AttendanceChart from "../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../components/UI/attendanceVisualizer";
import { getCourseAssignments } from "../../services/assignmentService";

/**
 * CourseContent Components
 */

const GRADES_DATA = [
    { id: 1, name: "Project 1: Research & Discovery", weight: "20%", grade: "85%", status: "Graded", date: "Mar 12, 2026" },
    { id: 2, name: "Project 2: Wireframes & Prototyping", weight: "30%", grade: "78%", status: "Graded", date: "Apr 05, 2026" },
    { id: 3, name: "Mid-Term UI Audit", weight: "10%", grade: "92%", status: "Graded", date: "Apr 15, 2026" },
    { id: 4, name: "Final Case Study Delivery", weight: "40%", grade: "-", status: "Pending", date: "Expected June" },
];

const ANNOUNCEMENTS_DATA = [
    {
        id: 1,
        title: "Project 3 Brief Released",
        lecturer: "Dr. Sarah Miller",
        date: "Today, 10:45 AM",
        preview: "The brief for Project 3: High-Fidelity Prototyping is now available in the Modules section. Please review the technical requirements before Monday's lecture.",
        label: "Notice",
        color: "#3C0078"
    },
    {
        id: 2,
        title: "Guest Lecture: Industry UX Trends",
        lecturer: "Prof. Mark Chen",
        date: "Yesterday, 2:15 PM",
        preview: "We have an exciting guest speaker from a leading fintech startup joining us next week Tuesday. Attendance is mandatory for UX300 students.",
        label: "Event",
        color: "#FF8731"
    },
    {
        id: 3,
        title: "Lab Room Change - Block D",
        lecturer: "Admin",
        date: "18 Apr 2026",
        preview: "The practical session for Friday will be moved to Lab 402 in Block D due to maintenance in the main studio.",
        label: "Update",
        color: "#87CEFA"
    }
];

// Hardcoded static references preserved for Attendance/Grades until their respective phases

const ATTENDANCE_STATS = [
    { label: "Total Sessions", value: "42", color: "#3C0078" },
    { label: "Attended", value: "38", color: "#87CEFA" },
    { label: "Missed", value: "4", color: "#FF8731" },
    { label: "Percentage", value: "90%", variant: "large" },
];

const ATTENDANCE_LOGS = [
    { date: "18 Apr 2026", type: "Lecture", status: "Present", time: "10:00 AM" },
    { date: "15 Apr 2026", type: "Tutorial", status: "Present", time: "14:00 PM" },
    { date: "11 Apr 2026", type: "Lecture", status: "Absent", time: "10:00 AM" },
    { date: "08 Apr 2026", type: "Practical", status: "Present", time: "11:30 AM" },
];

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

function CourseAnnouncementsView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
                <p className="text-gray-500 mt-2">Latest updates from your lecturers</p>
            </motion.header>
            <div className="space-y-6 max-w-4xl">
                {ANNOUNCEMENTS_DATA.map((post) => (
                    <motion.div key={post.id} variants={slideUp} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: post.color }} />
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: post.color }}>{post.label}</span>
                                <span className="text-sm text-gray-400">{post.date}</span>
                            </div>
                            <button className="text-gray-300 hover:text-gray-600"><Bell size={20} /></button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{post.title}</h2>
                        <p className="text-xs font-medium text-gray-500 mt-1">Posted by {post.lecturer}</p>
                        <p className="text-gray-600 mt-4 leading-relaxed">{post.preview}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function CourseAssignmentsView({ subject, activeCourseId }) {
    const [assignments, setAssignments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const computeStatusInfo = (item) => {
        // Hardcode "Usability Testing Report" to be "Submitted" for dev testing
        if (item.title === "Usability Testing Report" || item.title === "Literature Review Module") {
            return { status: 'Submitted', color: 'text-green-600', rank: 3, isSubmitted: true };
        }

        const now = new Date();
        const due = new Date(item.dueDate);
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        
        // As actual submissions aren't wired, we compute entirely by date heuristic
        if (diffDays < -7) return { status: 'Closed', color: 'text-gray-400', rank: 4, isClosed: true };
        if (diffDays < 0) return { status: 'Late', color: 'text-red-600', rank: 0 };
        if (diffDays <= 5) return { status: 'Due Soon', color: 'text-orange-500', rank: 1 };
        return { status: 'Due', color: 'text-blue-500', rank: 2 };
    };

    React.useEffect(() => {
        let mounted = true;
        async function fetch() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getCourseAssignments(activeCourseId);
                
                // Enqueue map & sort logic for the requested importance hierarchy
                const enriched = data.map(item => {
                    const info = computeStatusInfo(item);
                    return { ...item, ...info };
                }).sort((a, b) => a.rank - b.rank);

                if (mounted) setAssignments(enriched);
            } catch (err) {
                console.error("Failed bringing in assignments for course:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetch();
        return () => { mounted = false; };
    }, [activeCourseId]);

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-gray-500 mt-2 text-lg">{subject?.code || "Pending"} | Assessments & Briefs</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={20} /> Briefs Archive
                    </button>
                    {/* The global 'Submit Assignment' button was removed here as per instructions */}
                </div>
            </motion.header>
            
            {loading ? (
                <div className="text-gray-500 text-center py-20 font-medium">Loading remote course assignments...</div>
            ) : assignments.length === 0 ? (
                <div className="text-gray-500 text-center py-20 font-medium bg-gray-50 rounded-[40px] border border-gray-100">
                    No active assignments for this module yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {assignments.map((item, index) => (
                        <motion.div key={item.id} variants={slideUp} className={`bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${item.isClosed || item.isSubmitted ? 'opacity-60 bg-gray-50' : 'opacity-100'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight pr-4">{item.title}</h2>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap mt-1 ${item.color}`}>{item.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">{item.description}</p>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 uppercase font-bold tracking-widest">Weight:</span>
                                    <span className="text-gray-900 font-bold">{item.maxPoints} pts</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 uppercase font-bold tracking-widest">Due Date:</span>
                                    <span className="text-gray-900 font-bold">{new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <button className={`w-full mt-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-sm ${item.isClosed || item.isSubmitted ? 'bg-gray-800 hover:bg-black' : 'bg-[#3C0078] hover:bg-[#2A0054]'}`}>
                                    {(!item.isClosed && !item.isSubmitted) && <Upload size={16} />}
                                    {item.isClosed ? "View" : item.isSubmitted ? "View Submission" : "View & Submit"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function CourseAttendanceView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
                <p className="text-gray-500 mt-2">UX300 | Academic Presence Tracking</p>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <AttendanceChart attended={38} total={42} missed={4} />
                </motion.div>
                <motion.div variants={scaleIn}>
                    <AttendanceVisualizer />
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Session History</h2>
                    <button className="text-sm font-semibold text-[#3C0078] hover:underline flex items-center gap-2"><Calendar size={18} /> Download Report</button>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Session Type</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Time</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ATTENDANCE_LOGS.map((log, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-6 text-sm font-bold text-gray-900">{log.date}</td>
                                <td className="px-8 py-6 text-sm text-gray-600">{log.type}</td>
                                <td className="px-8 py-6 text-sm text-gray-400">{log.time}</td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-widest ${log.status === 'Present' ? 'text-green-600' : 'text-orange-600'}`}>{log.status}</span>
                                        {log.status === 'Present' ? <CheckCircle className="text-green-600" size={18} /> : <CloseCircle className="text-orange-600" size={18} />}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
}

function CourseGradesView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Grades</h1>
                <p className="text-gray-500 mt-2">UX300 | Academic Performance Overview</p>
            </motion.header>
            <motion.div variants={slideUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Assignment Name</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Weight</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {GRADES_DATA.map((item) => (
                            <motion.tr key={item.id} variants={slideUp} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{item.date}</div>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-600">{item.weight}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.status === "Graded" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>{item.status}</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="text-lg font-semibold text-gray-900">{item.grade}</span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
            <motion.div variants={slideUp} className="mt-8 flex justify-end">
                <div className="bg-[#3C0078] text-white px-8 py-6 rounded-3xl shadow-lg shadow-[#3C0078]/20 flex items-center gap-12">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Course Progress</span>
                        <span className="text-sm font-medium">Completed: 60%</span>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">Current Average</span>
                        <span className="text-2xl font-bold italic">82.4%</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function CourseHomeView({ subject, course, loading }) {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {loading ? "Loading course details..." : `${subject?.name || "Unknown"} | ${course?.term || ""}`}
        </h1>
        <p className="text-xl text-gray-700 mt-2">{loading ? "..." : subject?.code}</p>
      </header>

      {/* Left column – course overview with todo, next class & announcements */}
      <main className="space-y-12">
        <div className="w-full h-80 bg-[#D9D9D9] rounded-2xl shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <section>
            <h2 className="text-xl font-bold mb-4">Course Overview</h2>
            <div>
              <h3 className="font-bold text-sm mb-2 uppercase tracking-wide border-b border-black inline-block">
                {course?.term || "Term 1"}:
              </h3>
              <p className="text-sm leading-relaxed text-gray-800 mt-2">
                {loading ? "Loading..." : subject?.description || "No description provided."}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CourseModulesView() {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Third-tier Nav: Modules Accordion */}
      <div className="flex flex-col h-full border-r border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-8">Modules</h2>
        <ModuleAccordion />
      </div>

            {/* Main Content: Nested View with rounded border from screenshot */}
            <div className="flex-1 p-8 overflow-y-auto pb-24 ">
                <div className="bg-white p-12 rounded-[40px] border-2 border-gray-300 shadow-sm relative">
                    <header className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight">User Experience Design 300 | Semester 1</h1>
                        <p className="text-lg text-gray-700 mt-1">UX300</p>
                    </header>
                    <div className="w-full h-64 bg-[#D9D9D9] rounded-2xl mb-8"></div>
                    <section>
                        <h3 className="text-lg font-bold mb-4">Course Overview</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wide">Term 1:</h4>
                                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                                    Inclusive & Neurodiverse UX focuses on building a strong human-centred foundation...
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wide">Term 2:</h4>
                                <p className="text-xs leading-relaxed text-gray-800 mt-2">
                                    Inclusive & Neurodiverse UX focuses on building a strong human-centred foundation...
                                </p>
                            </div>
                        </div>
                    </section>
                    {/* Expand icon at bottom-right of the screenshot card */}
                    <div className="absolute bottom-6 right-6 p-2 bg-gray-200 rounded-full hover:bg-gray-300 cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Courses Page Component
 *
 * Supports two main views based on current path:
 * 1. Home (/courses)
 * 2. Modules (/courses/modules)
 */
export default function StudentCourses() {
    const location = useLocation();
    const navigate = useNavigate();
    const { visibleCourses, loading } = useCourses();

    // The route matches /courses/:courseId/:subpage 
    // E.g. pathParts = ["courses", "dfg897-...", "grades"]
    const pathParts = location.pathname.split('/').filter(Boolean);
    const activeCourseId = pathParts.length > 1 ? pathParts[1] : null;

    // React Router Guard: If the user navigates merely to /courses without specifying an ID, 
    // we drop them smoothly into the first available course.
    useEffect(() => {
        if (!loading && visibleCourses.length > 0) {
            const courseExistsInList = visibleCourses.find(c => c.id === activeCourseId);
            if (!activeCourseId || !courseExistsInList) {
                navigate(`/courses/${visibleCourses[0].id}`, { replace: true });
            }
        }
    }, [loading, visibleCourses, activeCourseId, navigate]);

    // Build the resolved standard course object
    const course = visibleCourses.find(c => c.id === activeCourseId) || visibleCourses[0] || null;
    const subject = course ? {
        name: course.subjectName,
        code: course.label,
        description: course.description
    } : null;
    
    // Normalize sub-path checks based on the end of the URL
    const path = location.pathname;
    
    const isGradesPage = path.endsWith("/grades");
    const isAnnouncementsPage = path.endsWith("/announcements");
    const isAssignmentsPage = path.endsWith("/assignments");
    const isAttendancePage = path.endsWith("/attendance");
    const isModulesPage = path.endsWith("/modules");
    
    // Home logic: If we are at /courses or /courses/:id NOT ending in a sub-path
    const isHomePage = !isGradesPage && !isAnnouncementsPage && !isAssignmentsPage && !isAttendancePage && !isModulesPage;

    return (
        <div className="flex h-screen overflow-hidden">
            {/* The global top menu that was previously disappearing */}
            <Menu />
            
            {/* Leftmost Course Navigation Bar */}
            <div className="flex flex-col h-full py-8 px-4 items-center gap-6 ">
                <CourseMenu />

                <div className="mt-auto">
                    <SideMenu />
                </div>
            </div>

      {/* Middle Section: Second Navigation Bar for course-internal links */}
      <div className="flex flex-col h-full border-r border-gray-200">
        <CourseSecondaryNav activeCourseId={activeCourseId || (visibleCourses[0]?.id)} />
      </div>

            {/* Main Content Area */}
            {isGradesPage ? (
                <CourseGradesView />
            ) : isAnnouncementsPage ? (
                <CourseAnnouncementsView />
            ) : isAssignmentsPage ? (
                <CourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
            ) : isAttendancePage ? (
                <CourseAttendanceView />
            ) : isModulesPage ? (
                <CourseModulesView />
            ) : (
                <CourseHomeView subject={subject} course={course} loading={loading} />
            )}
        </div>
    );
}
