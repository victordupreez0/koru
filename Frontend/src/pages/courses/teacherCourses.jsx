import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCourses } from "../../contexts/CoursesContext";
import CourseMenu from "../../components/coursesMenu";
import CourseSecondaryNav from "../../components/courseSecondaryNav";
import SideMenu from "../../components/sideMenu";
import Menu from "../../components/menu";
import ModuleAccordion from "../../components/moduleAccordion";
import { Bell, Calendar, Folder, Upload, InfoCircle, CheckCircle, CloseCircle, CloseSquare, User, Filter } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import AttendanceChart from "../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../components/UI/attendanceVisualizer";
import { getCourseAssignments } from "../../services/assignmentService";
import {
    EditorRoot,
    EditorContent,
    EditorCommand,
    EditorCommandItem,
    EditorCommandList,
    EditorCommandEmpty,
    EditorBubble,
    EditorBubbleItem,
    StarterKit,
    Placeholder,
    TiptapUnderline,
    Color,
    TextStyle,
    createSuggestionItems,
    renderItems,
    handleCommandNavigation,
    useEditor,
} from "novel";
import { getNotes, createNote, updateNote, deleteNote } from "../../services/noteService";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, Trash2, Maximize2, Minimize2 } from "lucide-react";
import NovelBlockMenu from "../../components/NovelBlockMenu";

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
    const [selectedId, setSelectedId] = useState(null);
    const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_DATA);
    const [isAdding, setIsAdding] = useState(false);
    
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        preview: "",
        label: "Notice",
        color: "#3C0078",
        lecturer: "Dr. Sarah Miller" // Hardcoded for teacher view
    });

    const selectedAnnouncement = announcements.find(a => a.id === selectedId);

    const handlePost = () => {
        if (!newAnnouncement.title || !newAnnouncement.preview) return;
        
        const announcement = {
            ...newAnnouncement,
            id: Date.now(),
            date: "Today, Just Now"
        };
        
        setAnnouncements([announcement, ...announcements]);
        setIsAdding(false);
        setNewAnnouncement({
            title: "",
            preview: "",
            label: "Notice",
            color: "#3C0078",
            lecturer: "Dr. Sarah Miller"
        });
    };

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Announcements</h1>
                    <p className="text-gray-500 mt-2">Latest updates from your lecturers</p>
                </div>
                {!isAdding && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAdding(true)}
                        className="bg-[#3C0078] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#3C0078]/20"
                    >
                        <Plus size={18} />
                        Create Announcement
                    </motion.button>
                )}
            </motion.header>

            <div className="max-w-6xl">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="bg-white p-8 rounded-[38px] border-2 border-dashed border-[#3C0078]/20 shadow-sm mb-12 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-gray-900 italic">Drafting New Announcement</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <CloseSquare size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-8 mb-8">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-[3]">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Announcement Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="What's the update about?"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all"
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Label</label>
                                        <select 
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all appearance-none"
                                            value={newAnnouncement.label}
                                            onChange={(e) => {
                                                const labels = {
                                                    "Notice": "#3C0078",
                                                    "Event": "#FF8731",
                                                    "Update": "#87CEFA"
                                                };
                                                setNewAnnouncement({...newAnnouncement, label: e.target.value, color: labels[e.target.value]});
                                            }}
                                        >
                                            <option>Notice</option>
                                            <option>Event</option>
                                            <option>Update</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Announcement Message</label>
                                    <textarea 
                                        rows={6}
                                        placeholder="Write your announcement details here..."
                                        className="w-full bg-gray-50 border-none rounded-2xl px-8 py-6 text-gray-900 text-lg font-medium focus:ring-2 focus:ring-[#3C0078]/20 transition-all resize-none leading-relaxed"
                                        value={newAnnouncement.preview}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, preview: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <button 
                                    onClick={handlePost}
                                    className="bg-[#3C0078] text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-[#2A0054] transition-all shadow-lg shadow-[#3C0078]/20"
                                >
                                    Post Announcement
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {announcements.map((post) => (
                        <motion.div 
                            key={post.id} 
                            layoutId={`ann_container_${post.id}`}
                            onClick={() => setSelectedId(post.id)}
                            variants={slideUp} 
                            className="bg-white p-8 rounded-[38px] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
                            whileHover={{ y: -5 }}
                        >
                            <motion.div 
                                layoutId={`ann_stripe_${post.id}`}
                                className="absolute left-0 top-0 bottom-0 w-1.5" 
                                style={{ backgroundColor: post.color }} 
                            />
                            <div className="flex justify-between items-start mb-6">
                                <motion.div layoutId={`ann_meta_${post.id}`} className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: post.color }}>{post.label}</span>
                                    <span className="text-sm text-gray-400">{post.date}</span>
                                </motion.div>
                                <motion.div layoutId={`ann_icon_${post.id}`} className="text-gray-200">
                                    <Bell size={24} />
                                </motion.div>
                            </div>
                            <motion.h2 
                                layoutId={`ann_title_${post.id}`}
                                className="text-2xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight"
                            >
                                {post.title}
                            </motion.h2>
                            <motion.div layoutId={`ann_author_${post.id}`}>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#3C0078] mt-2 opacity-60">Posted by {post.lecturer}</p>
                            </motion.div>
                            <motion.p layoutId={`ann_preview_${post.id}`} className="text-gray-500 mt-4 leading-relaxed line-clamp-2">
                                {post.preview}
                            </motion.p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedId && (
                    <>
                        {/* Overlay backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
                        />

                        {/* Modal container */}
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                layoutId={`ann_container_${selectedId}`}
                                className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden pointer-events-auto"
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            >
                                <motion.div 
                                    layoutId={`ann_stripe_${selectedId}`}
                                    className="absolute left-0 top-0 bottom-0 w-3" 
                                    style={{ backgroundColor: selectedAnnouncement.color }} 
                                />
                                
                                <div className="p-12">
                                    <div className="flex justify-between items-start mb-10">
                                        <motion.div layoutId={`ann_meta_${selectedId}`} className="flex items-center gap-4">
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: selectedAnnouncement.color }}>
                                                {selectedAnnouncement.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">{selectedAnnouncement.date}</span>
                                        </motion.div>
                                        <div className="flex gap-2">
                                            <motion.div layoutId={`ann_icon_${selectedId}`} className="text-gray-100 hidden md:block">
                                                <Bell size={32} />
                                            </motion.div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                            >
                                                <CloseSquare size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    <motion.h2 
                                        layoutId={`ann_title_${selectedId}`}
                                        className="text-4xl font-black text-gray-900 leading-tight mb-4"
                                    >
                                        {selectedAnnouncement.title}
                                    </motion.h2>

                                    <motion.div layoutId={`ann_author_${selectedId}`} className="flex items-center gap-3 mb-10 pb-10 border-b border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#3C0078]">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Published By</p>
                                            <p className="font-bold text-[#3C0078]">{selectedAnnouncement.lecturer}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="prose prose-purple max-w-none"
                                    >
                                        <motion.p layoutId={`ann_preview_${selectedId}`} className="text-xl leading-relaxed text-gray-600 mb-6 font-medium">
                                            {selectedAnnouncement.preview}
                                        </motion.p>
                                        <p className="text-gray-500 leading-relaxed text-lg">
                                            Please make sure to check the attached documents in the resources section if any are mentioned. If you have any follow-up questions regarding this announcement, feel free to reach out to the lecturer during office hours or post in the discussion forum.
                                        </p>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-12 flex items-center justify-between"
                                    >
                                        <button 
                                            onClick={() => setSelectedId(null)}
                                            className="px-8 py-3 rounded-2xl bg-[#3C0078]/5 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078] hover:text-white transition-all"
                                        >
                                            Back to list
                                        </button>
                                        <div className="flex gap-4">
                                            <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Delete</span>
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-400 hover:text-[#3C0078] transition-colors">
                                                <Letter size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Share</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
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
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Attendance & Presence</h1>
                    <p className="text-gray-500 mt-2">UX300 | Academic Presence Analytics</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Export Log
                    </button>
                    <button className="px-6 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-semibold shadow-lg shadow-[#3C0078]/20 hover:bg-[#2A0054] transition-all">
                        Take Attendance
                    </button>
                </div>
            </motion.header>

            {/* Attendance Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-stretch">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Class Attendance Overview</h3>
                                <p className="text-sm text-gray-400">Semester 1 | UX300</p>
                            </div>
                            <div className="bg-green-50 px-4 py-2 rounded-2xl">
                                <span className="text-green-600 font-bold text-sm">+5.2% from last wk</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            <AttendanceChart attended={84} total={100} missed={16} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-[40px] p-8 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Weekly Rate</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">92%</span>
                            <span className="text-sm opacity-60">Avg</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>On track with semester goal</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex-1 group hover:border-[#3C0078]/20 transition-all cursor-pointer">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Class Engagement</span>
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-end justify-between gap-1 h-16">
                                {[30, 80, 45, 95, 60, 40, 85].map((h, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-full rounded-t-lg transition-all duration-500 bg-gray-100 group-hover:bg-[#3C0078]/10 ${i === 3 ? 'bg-[#3C0078]' : ''}`}
                                        style={{ height: `${h}%` }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3C0078]">Peak Activity</p>
                                    <p className="text-xl font-black italic">Thursday</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Avg Session</p>
                                    <p className="text-xl font-black italic">42m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-12">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Students Attendance</h2>
                    <div className="flex gap-2">
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100"><Filter size={20} /></button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/30">
                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Info</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Sessions Present</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Present Rate</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STUDENT_GRADES_DATA.map((student) => (
                            <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078] shadow-sm">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{student.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <span className="text-sm font-bold text-gray-900">24/26 Sessions</span>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-base font-black italic text-gray-900">{student.attendance}</span>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    parseInt(student.attendance) > 80 ? 'bg-green-500' : 
                                                    parseInt(student.attendance) > 70 ? 'bg-orange-400' : 'bg-red-500'
                                                }`}
                                                style={{ width: student.attendance }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                        parseInt(student.attendance) > 85 ? "bg-green-100 text-green-700" :
                                        parseInt(student.attendance) > 75 ? "bg-blue-50 text-blue-700" :
                                        parseInt(student.attendance) > 65 ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                    }`}>
                                        {parseInt(student.attendance) > 85 ? "Excellent" : "Regular"}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="px-5 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white group-hover:border-[#3C0078] transition-all whitespace-nowrap shadow-sm">
                                        View Student
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
}

const STUDENT_GRADES_DATA = [
    { id: 1, name: "Alice Johnson", email: "alice.j@student.ac.za", attendance: "95%", avgGrade: "88%", status: "Good", avatar: "AJ" },
    { id: 2, name: "Bob Smith", email: "bob.s@student.ac.za", attendance: "82%", avgGrade: "74%", status: "At Risk", avatar: "BS" },
    { id: 3, name: "Charlie Davis", email: "charlie.d@student.ac.za", attendance: "91%", avgGrade: "92%", status: "Excellent", avatar: "CD" },
    { id: 4, name: "Diana Prince", email: "diana.p@student.ac.za", attendance: "98%", avgGrade: "85%", status: "Good", avatar: "DP" },
    { id: 5, name: "Ethan Hunt", email: "ethan.h@student.ac.za", attendance: "65%", avgGrade: "58%", status: "Critical", avatar: "EH" },
    { id: 6, name: "Fiona Apple", email: "fiona.a@student.ac.za", attendance: "89%", avgGrade: "79%", status: "Good", avatar: "FA" },
];

function CourseGradesView() {
    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Grades & Performance</h1>
                    <p className="text-gray-500 mt-2">UX300 | Class Performance Analytics</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Export CSV
                    </button>
                </div>
            </motion.header>

            {/* Grades Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-stretch">
                <motion.div variants={scaleIn} className="lg:col-span-2">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Class Average Distribution</h3>
                                <p className="text-sm text-gray-400">Total Assignments | UX300</p>
                            </div>
                            <div className="bg-[#3C0078]/5 px-4 py-2 rounded-2xl">
                                <span className="text-[#3C0078] font-bold text-sm">Target: 75%</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            {/* Reusing chart logic but focused on grades */}
                            <AttendanceChart attended={78} total={100} missed={22} label="Grade Distribution" />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-[40px] p-8 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Class Average</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">78.4%</span>
                            <span className="text-sm opacity-60">Avg</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>12 students above target</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex-1 group hover:border-[#3C0078]/20 transition-all">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block mb-6">Highest Performance</span>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black italic text-xl shadow-inner">
                                A+
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic text-gray-900 leading-none">94.2%</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Emma Watson</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={slideUp} className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-12">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Students List</h2>
                    <div className="flex gap-2">
                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100"><InfoCircle size={20} /></button>
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/30">
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Student Info</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Attendance</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Avg Grade</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                            <th className="px-10 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STUDENT_GRADES_DATA.map((student) => (
                            <motion.tr key={student.id} variants={slideUp} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#3C0078]/5 border-2 border-[#3C0078]/10 flex items-center justify-center font-black text-xs text-[#3C0078] shadow-sm">
                                            {student.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors">{student.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-base font-bold text-gray-900">{student.attendance}</span>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    parseInt(student.attendance) > 80 ? 'bg-green-500' : 
                                                    parseInt(student.attendance) > 70 ? 'bg-orange-400' : 'bg-red-500'
                                                }`}
                                                style={{ width: student.attendance }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-center">
                                    <span className="text-lg font-black italic text-gray-900">{student.avgGrade}</span>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                        student.status === "Excellent" ? "bg-green-100 text-green-700" :
                                        student.status === "Good" ? "bg-blue-50 text-blue-700" :
                                        student.status === "At Risk" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="px-5 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white group-hover:border-[#3C0078] transition-all whitespace-nowrap shadow-sm">
                                        View Student
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
}

function CourseHomeView({ subject, course, loading }) {
  // Use subject imageUrl or a placeholder if not present
  var sampleImg = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
  const courseImage = subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight">
          {loading ? "Loading course details..." : `${subject?.name || "Unknown"} | ${course?.term || ""}`}
        </h1>
        <p className="text-xl text-gray-500 mt-3 font-medium">{loading ? "..." : subject?.code}</p>
      </header>

      {/* Left column – course overview with todo, next class & announcements */}
      <main className="space-y-24 w-full flex flex-col items-center">
        <div className="w-full h-[500px] rounded-[60px] shadow-sm overflow-hidden">
          <img 
            src={courseImage} 
            alt={subject?.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="w-full max-w-6xl space-y-24">
          <section>
            <h2 className="text-3xl font-bold mb-12 tracking-tight">Course Overview</h2>
            <div className="flex flex-col md:flex-row gap-24 items-stretch">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs mb-6 uppercase tracking-[0.2em] text-[#3C0078] border-b-2 border-[#3C0078] inline-block pb-1">
                    Term 1
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-600 min-h-[120px]">
                    {loading ? "Loading..." : subject?.description || "In this term, students will focus on the foundational principles of user experience design, understanding user psychology, and master the basics of research methodologies."}
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="#" className="inline-flex items-center gap-2 text-[#3C0078] font-bold text-sm uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Full Term Overview <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between border-l border-gray-100 pl-24">
                <div>
                  <h3 className="font-bold text-xs mb-6 uppercase tracking-[0.2em] text-[#3C0078] border-b-2 border-[#3C0078] inline-block pb-1">
                    Term 2
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-600 min-h-[120px]">
                    Building on the foundations, Term 2 shifts towards advanced prototyping, usability testing, and the integration of professional design hand-off processes for industry-standard delivery.
                  </p>
                </div>
                <div className="mt-8">
                  <Link to="#" className="inline-flex items-center gap-2 text-[#3C0078] font-bold text-sm uppercase tracking-widest hover:translate-x-1 transition-transform">
                    Full Term Overview <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
            {/* Lecturer Section on the Left */}
            <div className="bg-gray-50/30 rounded-[60px] p-12 border border-gray-100 flex flex-col items-center md:items-start text-center md:text-left gap-12">
              <div className="flex flex-col md:flex-row items-center gap-14">
                <div className="relative group shrink-0">
                  {/* Enhanced Glowing Pulse Animation - Now Teal */}
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.25, 1],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute -inset-10 rounded-full bg-[#14B8A6]/20 blur-3xl z-0"
                  />
                  
                  {/* Enhanced Floating Ring - Now Teal */}
                  <motion.div 
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 15, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="absolute -inset-4 rounded-full border-2 border-dashed border-[#14B8A6]/40 z-0"
                  />
                  
                  {/* Lecturer Image MUCH LARGER - No Shadow */}
                  <div className="w-56 h-56 rounded-full overflow-hidden border-8 border-white relative z-10">
                    <img 
                      src={subject?.lecturerImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"} 
                      alt="Lecturer" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-[10px] font-black text-[#14B8A6] uppercase tracking-[0.4em] block">Module Head</span>
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{subject?.lecturerName || "Dr. Sarah Miller"}</h3>
                  <p className="text-gray-600 font-bold text-lg tracking-tight">Design Lead & Senior Researcher</p>
                </div>
              </div>

              <div className="w-full">
                <a 
                  href={`mailto:${subject?.lecturerEmail || "sarah.miller@university.ac.za"}`}
                  className="w-full md:w-auto inline-flex justify-center items-center gap-4 bg-transparent border-2 border-[#14B8A6] text-[#14B8A6] px-10 py-4 rounded-full font-bold text-base tracking-widest uppercase transition-all duration-300 hover:bg-[#14B8A6] hover:text-white hover:shadow-xl hover:shadow-[#14B8A6]/20"
                >
                  <span>Email Lecturer</span>
                  <span className="text-xl">→</span>
                </a>
              </div>
            </div>

            {/* Quick Links Section on the Right - Asymmetric and Clean */}
            <div className="flex flex-col p-4">
              <h3 className="text-2xl font-bold mb-8 tracking-tight pl-4 text-gray-900">Quick Links</h3>
              
              <div className="flex flex-wrap gap-4 items-start content-start">
                <a
                  href="#"
                  className="bg-white border-2 border-gray-100 text-gray-700 px-8 py-5 rounded-[28px] font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white flex items-center gap-3"
                >
                  <span>Figma Workflow</span>
                  <span className="opacity-30">/</span>
                </a>

                <a
                  href="#"
                  className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-5 rounded-[28px] font-bold text-xs tracking-widst uppercase transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white"
                >
                  <span>Terms</span>
                </a>

                <a
                  href="#"
                  className="bg-white border-2 border-gray-100 text-gray-700 px-8 py-5 rounded-[28px] font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white flex items-center gap-3"
                >
                  <span>Miro Board</span>
                  <span className="opacity-30">#</span>
                </a>

                <a
                  href="#"
                  className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-5 rounded-[28px] font-bold text-xs tracking-widest uppercase transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white"
                >
                  <span>Attendance</span>
                </a>

                <a
                  href="#"
                  className="w-full bg-white border-2 border-gray-100 text-gray-700 p-8 rounded-[40px] font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:border-[#14B8A6] hover:bg-[#14B8A6] hover:text-white flex justify-between items-center group"
                >
                  <span>Request Contact Session</span>
                  <span className="text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all">→</span>
                </a>
              </div>
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

function CourseNotesView({ activeCourseId }) {
    const suggestionItems = createSuggestionItems([
        {
            title: "Heading 1",
            searchTerms: ["title", "heading", "h1"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
            },
        },
        {
            title: "Heading 2",
            searchTerms: ["subtitle", "heading", "h2"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
            },
        },
        {
            title: "Heading 3",
            searchTerms: ["heading", "h3"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
            },
        },
        {
            title: "Bullet List",
            searchTerms: ["unordered", "list", "bullet"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Numbered List",
            searchTerms: ["ordered", "list", "number"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Quote",
            searchTerms: ["blockquote", "quote"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: "Code Block",
            searchTerms: ["code", "codeblock"],
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
    ]);
    const { user } = useAuth();
    const [notes, setNotes] = React.useState([]);
    const [activeNote, setActiveNote] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [expanded, setExpanded] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        async function fetchNotes() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getNotes();
                const courseNotes = data.filter(n => n.courseId === activeCourseId);
                if (mounted) {
                    setNotes(courseNotes);
                    if (courseNotes.length > 0) setActiveNote(courseNotes[0]);
                }
            } catch (err) {
                console.error("Failed bringing in notes:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchNotes();
        return () => { mounted = false; };
    }, [activeCourseId]);

    const handleCreateNote = async () => {
        const newNote = {
            title: "",
            content: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }),
            courseId: activeCourseId,
            studentId: user?.userId,
            authorId: user?.userId
        };
        try {
            const created = await createNote(newNote);
            setNotes(prev => [...prev, created]);
            setActiveNote(created);
        } catch (err) {
            console.error("Failed to create note:", err);
        }
    };

    const handleUpdateNote = async (updatedContent) => {
        if (!activeNote) return;
        try {
            const updated = { ...activeNote, content: JSON.stringify(updatedContent) };
            await updateNote(activeNote.id, updated);
            setNotes(prev => prev.map(n => n.id === activeNote.id ? updated : n));
        } catch (err) {
            console.error("Failed to update note:", err);
        }
    };

    return (
        <div className="flex-1 flex h-full overflow-hidden">
            {/* Notes sidebar — animates width to 0 when expanded */}
            <div
                className="flex flex-col h-full border-r border-gray-200 shrink-0 overflow-hidden"
                style={{
                    width: expanded ? 0 : 320,
                    padding: expanded ? '2rem 0' : '2rem',
                    borderRightWidth: expanded ? 0 : 1,
                    opacity: expanded ? 0 : 1,
                    transition: 'width 0.35s ease, padding 0.35s ease, border-right-width 0.35s ease, opacity 0.2s ease',
                }}
            >
                <div className="flex justify-between items-center mb-8 min-w-[256px]">
                    <h2 className="text-2xl font-bold">Notes</h2>
                    <button onClick={handleCreateNote} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                        <Plus size={20} className="text-gray-700" />
                    </button>
                </div>
                {loading ? (
                    <div className="text-sm text-gray-500">Loading notes...</div>
                ) : (
                    <div className="space-y-2 overflow-y-auto min-w-[256px]">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className={`group w-full text-left p-4 rounded-2xl transition-colors flex items-start justify-between gap-2 cursor-pointer ${activeNote?.id === note.id ? 'bg-[#3C0078] text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}`}
                                onClick={() => setActiveNote(note)}
                            >
                                <div className="min-w-0">
                                    <div className={`font-bold text-sm truncate ${!note.title ? 'opacity-40' : ''}`}>{note.title || "New Note"}</div>
                                    <div className={`text-xs mt-1 ${activeNote?.id === note.id ? 'text-white/70' : 'text-gray-400'}`}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await deleteNote(note.id);
                                            setNotes(prev => prev.filter(n => n.id !== note.id));
                                            if (activeNote?.id === note.id) setActiveNote(null);
                                        } catch (err) {
                                            console.error("Failed to delete note:", err);
                                        }
                                    }}
                                    className={`shrink-0 p-1 rounded-lg transition-all ${activeNote?.id === note.id ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-transparent group-hover:text-gray-400 hover:!text-red-500 hover:!bg-red-50'}`}
                                    title="Delete note"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {notes.length === 0 && (
                            <div className="text-sm text-gray-500 text-center py-4">No notes yet. Click + to create one.</div>
                        )}
                    </div>
                )}
            </div>

            <div
                className="flex-1 overflow-y-auto pb-24"
                style={{
                    padding: expanded ? '3rem' : '2rem',
                    transition: 'padding 0.35s ease',
                }}
            >
                {activeNote ? (
                    <div
                        className={`relative flex flex-col border ${
                            expanded
                                ? 'bg-transparent min-h-full border-transparent shadow-none rounded-none'
                                : 'bg-white py-12 pr-12 pl-[72px] rounded-[40px] border-gray-200 shadow-sm min-h-[600px]'
                        }`}
                        style={{ transition: 'padding 0.3s ease, border-radius 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease' }}
                    >
                        {/* Expand / Collapse button */}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className={`absolute z-10 p-2 rounded-full transition-colors ${
                                expanded
                                    ? 'top-0 right-0 bg-gray-200/60 hover:bg-gray-300/80'
                                    : 'top-6 right-6 bg-gray-100 hover:bg-gray-200'
                            }`}
                            title={expanded ? 'Collapse' : 'Expand'}
                        >
                            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <input
                            type="text"
                            value={activeNote.title}
                            onChange={(e) => {
                                const updatedTitle = e.target.value;
                                setActiveNote(prev => ({ ...prev, title: updatedTitle }));
                                setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: updatedTitle } : n));
                            }}
                            onBlur={async () => {
                                try {
                                    await updateNote(activeNote.id, activeNote);
                                } catch (err) {
                                    console.error("Failed to update note title", err);
                                }
                            }}
                            className="text-4xl font-bold mb-8 outline-none border-b border-transparent focus:border-gray-200 w-full pb-2 transition-colors text-gray-900 placeholder:text-gray-300 placeholder:font-bold"
                            placeholder="New Note"
                        />
                        <div className="flex-1 relative novel-editor-wrapper" key={activeNote.id}>
                            <EditorRoot>
                                <EditorContent
                                    initialContent={(() => {
                                        try {
                                            const parsed = activeNote.content ? JSON.parse(activeNote.content) : null;
                                            if (parsed && parsed.content && parsed.content.length > 0) return parsed;
                                        } catch {}
                                        return { type: "doc", content: [{ type: "paragraph" }] };
                                    })()}
                                    extensions={[
                                        StarterKit,
                                        Placeholder.configure({ placeholder: "Type something..." }),
                                        TiptapUnderline,
                                        TextStyle,
                                        Color,
                                    ]}
                                    onUpdate={({ editor }) => {
                                        if (editor) handleUpdateNote(editor.getJSON());
                                    }}
                                    className="w-full max-w-none focus:outline-none"
                                >
                                    {/* Bubble menu — appears when you select text */}
                                    <EditorBubble className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white px-1.5 py-1 shadow-xl">
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleBold().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Bold">
                                                <Bold size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Italic">
                                                <Italic size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Underline">
                                                <Underline size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Strikethrough">
                                                <Strikethrough size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleCode().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Inline Code">
                                                <Code size={16} />
                                            </button>
                                        </EditorBubbleItem>

                                        <div className="w-px h-5 bg-gray-200 mx-1" />

                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Heading 1">
                                                <Heading1 size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Heading 2">
                                                <Heading2 size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Heading 3">
                                                <Heading3 size={16} />
                                            </button>
                                        </EditorBubbleItem>

                                        <div className="w-px h-5 bg-gray-200 mx-1" />

                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleBulletList().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Bullet List">
                                                <List size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleOrderedList().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Numbered List">
                                                <ListOrdered size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                        <EditorBubbleItem
                                            onSelect={(editor) => editor.chain().focus().toggleBlockquote().run()}
                                        >
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Quote">
                                                <Quote size={16} />
                                            </button>
                                        </EditorBubbleItem>
                                    </EditorBubble>

                                    {/* Block handles (+ and grip menu) */}
                                    <NovelBlockMenu />

                                    {/* Slash command menu */}
                                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border border-gray-200 bg-white px-1 py-2 shadow-xl transition-all">
                                        <EditorCommandEmpty className="px-2 text-gray-500">No results</EditorCommandEmpty>
                                        <EditorCommandList>
                                            {suggestionItems.map((item) => (
                                                <EditorCommandItem
                                                    value={item.title}
                                                    onCommand={(val) => item.command(val)}
                                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-100 cursor-pointer"
                                                    key={item.title}
                                                >
                                                    <span>{item.title}</span>
                                                </EditorCommandItem>
                                            ))}
                                        </EditorCommandList>
                                    </EditorCommand>
                                </EditorContent>
                            </EditorRoot>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Select a note or create a new one to start writing.
                    </div>
                )}
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
    const isNotesPage = path.endsWith("/notes");
    
    // Home logic: Strictly defined as the base course page
    const isHomePage = pathParts.length === 2 && path.includes(`/courses/${activeCourseId}`);

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
            {isHomePage ? (
                <CourseHomeView subject={subject} course={course} loading={loading} />
            ) : isGradesPage ? (
                <CourseGradesView />
            ) : isAnnouncementsPage ? (
                <CourseAnnouncementsView />
            ) : isAssignmentsPage ? (
                <CourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
            ) : isAttendancePage ? (
                <CourseAttendanceView />
            ) : isModulesPage ? (
                <CourseModulesView />
            ) : isNotesPage ? (
                <CourseNotesView activeCourseId={activeCourseId} />
            ) : null}
        </div>
    );
}
