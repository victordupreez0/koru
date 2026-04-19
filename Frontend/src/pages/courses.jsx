import React from "react";
import { Link, useLocation } from "react-router-dom";
import CourseMenu from "../components/coursesMenu";
import CourseSecondaryNav from "../components/courseSecondaryNav";
import SideMenu from "../components/sideMenu";
import ModuleAccordion from "../components/moduleAccordion";
import { Bell, Calendar, Folder, Upload, InfoCircle, CheckCircle, CloseCircle } from "@solar-icons/react";
import { motion } from "framer-motion";
import AttendanceChart from "../components/UI/attendanceChart";
import AttendanceVisualizer from "../components/UI/attendanceVisualizer";

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

const ASSIGNMENTS_DATA = [
    {
        id: "A1",
        title: "Project 3: High-Fidelity Prototype",
        label: "Major Project",
        dueDate: "12 May 2026",
        weight: "40%",
        status: "Open",
        description: "Submit your final high-fidelity Figma prototype with interactive states and design system documentation.",
        color: "#3C0078"
    },
    {
        id: "A2",
        title: "Lab Assignment: React Framer Motion",
        label: "Practical Lab",
        dueDate: "Tomorrow, 8:00 AM",
        weight: "10%",
        status: "Due Soon",
        description: "Animate a navigation menu using Framer Motion stagger children variants.",
        color: "#FF8731"
    },
    {
        id: "A3",
        title: "Academic Writing: Ethics in UX",
        label: "Research Paper",
        dueDate: "24 Apr 2026",
        weight: "15%",
        status: "Open",
        description: "A 1500-word critical analysis on the ethical implications of dark patterns in modern e-commerce.",
        color: "#87CEFA"
    }
];

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

function CourseAssignmentsView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-gray-500 mt-2 text-lg">UX300 | Assessments & Briefs</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={20} /> Briefs Archive
                    </button>
                    <button className="px-6 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg shadow-black/10">
                        <Upload size={20} /> Submit Assignment
                    </button>
                </div>
            </motion.header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {ASSIGNMENTS_DATA.map((item) => (
                    <motion.div key={item.id} variants={slideUp} className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-shadow flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: item.color }}>{item.label}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'Due Soon' ? 'text-orange-600' : 'text-gray-400'}`}>{item.status}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight mb-3">{item.title}</h2>
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">{item.description}</p>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-gray-50">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 uppercase font-bold tracking-widest">Weight:</span>
                                <span className="text-gray-900 font-bold">{item.weight}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 uppercase font-bold tracking-widest">Due Date:</span>
                                <span className="text-gray-900 font-bold">{item.dueDate}</span>
                            </div>
                            <button className="w-full mt-2 py-3 bg-gray-50 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-[#3C0078] hover:text-white transition-all flex items-center justify-center gap-2">
                                <InfoCircle size={16} /> View Full Brief
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
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

function CourseHomeView() {
    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">User Experience Design 300 | Semester 1</h1>
                <p className="text-xl text-gray-700 mt-2">UX300</p>
            </header>

            <main className="space-y-12">
                <div className="w-full h-80 bg-[#D9D9D9] rounded-2xl shadow-sm"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <section>
                        <h2 className="text-xl font-bold mb-4">Course Overview</h2>
                        <div>
                            <h3 className="font-bold text-sm mb-2 uppercase tracking-wide border-b border-black inline-block">Term 1:</h3>
                            <p className="text-sm leading-relaxed text-gray-800 mt-2">
                                Inclusive & Neurodiverse UX focuses on building a strong human-centred foundation for advanced UX practice.
                                You will explore accessibility, inclusive design patterns, cognitive load, sensory design, and universal design
                                thinking to better understand how diverse users experience digital products.
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
export default function Courses() {
    const location = useLocation();
    
    // Normalize path to handle trailing slashes and base path
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
            {/* Leftmost Course Navigation Bar */}
            <div className="flex flex-col h-full py-8 px-4 items-center gap-6 ">
                <CourseMenu />

                <div className="mt-auto">
                    <SideMenu />
                </div>
            </div>

            {/* Middle Section: Second Navigation Bar for course-internal links */}
            <div className="flex flex-col h-full border-r border-gray-200">
                <CourseSecondaryNav />
            </div>

            {/* Main Content Area */}
            {isGradesPage ? (
                <CourseGradesView />
            ) : isAnnouncementsPage ? (
                <CourseAnnouncementsView />
            ) : isAssignmentsPage ? (
                <CourseAssignmentsView />
            ) : isAttendancePage ? (
                <CourseAttendanceView />
            ) : isModulesPage ? (
                <CourseModulesView />
            ) : (
                <CourseHomeView />
            )}
        </div>
    );
}
