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
import { getCourseAssignments, createAssignment, updateAssignment, deleteAssignment, closeAssignment } from "../../services/assignmentService";
import { getCourseGrades } from "../../services/gradeService";
import { getCourseSubmissions, getAssignmentSubmissions } from "../../services/submissionService";
import { getCourseStudentCount } from "../../services/enrollmentService";
import StudentCourseAssignmentsView from "./studentCoursesComponents/CourseAssignmentsView";
import { getCourseAnnouncements, createAnnouncement, deleteAnnouncement } from "../../services/announcementService";
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
import { Plus, Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, Trash2, Maximize2, Minimize2, FileText, HelpCircle, MessageSquare, Users, ExternalLink, ClipboardList, Eye, EyeOff, Edit2, ChevronDown, ChevronRight, CheckSquare, GripVertical, ToggleLeft, ToggleRight, PenLine, BookOpen, X } from "lucide-react";
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

// TODO: backend endpoint missing — no AttendanceController exists. Static for now.
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

function CourseAnnouncementsView({ activeCourseId }) {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        preview: "",
        label: "Notice",
        color: "#3C0078",
    });

    useEffect(() => {
        let mounted = true;
        async function fetchAnnouncements() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getCourseAnnouncements(activeCourseId);
                if (mounted) setAnnouncements(data || []);
            } catch (err) {
                console.error("Failed to load announcements:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchAnnouncements();
        return () => { mounted = false; };
    }, [activeCourseId]);

    const selectedAnnouncement = announcements.find(a => a.id === selectedId);

    const handlePost = async () => {
        if (!newAnnouncement.title || !newAnnouncement.preview || !activeCourseId || !user?.userId) return;

        try {
            const payload = {
                courseId: activeCourseId,
                lecturerId: user.userId,
                title: newAnnouncement.title,
                preview: newAnnouncement.preview,
                label: newAnnouncement.label,
                color: newAnnouncement.color,
            };
            const created = await createAnnouncement(payload);
            setAnnouncements([created, ...announcements]);
            setIsAdding(false);
            setNewAnnouncement({
                title: "",
                preview: "",
                label: "Notice",
                color: "#3C0078",
            });
        } catch (err) {
            console.error("Failed to create announcement:", err);
        }
    };

    const handleDelete = async (announcementId) => {
        try {
            await deleteAnnouncement(announcementId);
            setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            setSelectedId(null);
        } catch (err) {
            console.error("Failed to delete announcement:", err);
        }
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
                            onClick={() => setSelectedId(post.id)}
                            variants={slideUp}
                            className="bg-white p-8 rounded-[38px] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
                            whileHover={{ y: -5 }}
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5"
                                style={{ backgroundColor: post.color }}
                            />
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: post.color }}>{post.label}</span>
                                    <span className="text-sm text-gray-400">{post.datePosted ? new Date(post.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (post.date || "")}</span>
                                </div>
                                <div className="text-gray-200">
                                    <Bell size={24} />
                                </div>
                            </div>
                            <h2
                                className="text-2xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight"
                            >
                                {post.title}
                            </h2>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#3C0078] mt-2 opacity-60">Posted by {post.lecturer?.name || post.lecturer || "Lecturer"}</p>
                            </div>
                            <p className="text-gray-500 mt-4 leading-relaxed line-clamp-2">
                                {post.preview}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedId && selectedAnnouncement && (
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
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden pointer-events-auto"
                            >
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-3"
                                    style={{ backgroundColor: selectedAnnouncement.color }}
                                />

                                <div className="p-12">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="flex items-center gap-4">
                                            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white" style={{ backgroundColor: selectedAnnouncement.color }}>
                                                {selectedAnnouncement.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">{selectedAnnouncement.datePosted ? new Date(selectedAnnouncement.datePosted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (selectedAnnouncement.date || "")}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="text-gray-100 hidden md:block">
                                                <Bell size={32} />
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                                                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                            >
                                                <CloseSquare size={24} />
                                            </button>
                                        </div>
                                    </div>

                                    <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4">
                                        {selectedAnnouncement.title}
                                    </h2>

                                    <div className="flex items-center gap-3 mb-10 pb-10 border-b border-gray-100">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#3C0078]">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Published By</p>
                                            <p className="font-bold text-[#3C0078]">{selectedAnnouncement.lecturer?.name || selectedAnnouncement.lecturer || "Lecturer"}</p>
                                        </div>
                                    </div>

                                    <div className="prose prose-purple max-w-none">
                                        <p className="text-xl leading-relaxed text-gray-600 mb-6 font-medium">
                                            {selectedAnnouncement.preview}
                                        </p>
                                        <p className="text-gray-500 leading-relaxed text-lg">
                                            Please make sure to check the attached documents in the resources section if any are mentioned. If you have any follow-up questions regarding this announcement, feel free to reach out to the lecturer during office hours or post in the discussion forum.
                                        </p>
                                    </div>

                                    <div className="mt-12 flex items-center justify-between">
                                        <button
                                            onClick={() => setSelectedId(null)}
                                            className="px-8 py-3 rounded-2xl bg-[#3C0078]/5 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078] hover:text-white transition-all"
                                        >
                                            Back to list
                                        </button>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleDelete(selectedId)} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Static data for teacher assignments view ───────────────────────────────

const ASSIGNMENT_TYPES = [
    {
        id: "online",
        label: "Online Submission",
        icon: FileText,
        color: "#3C0078",
        bg: "bg-[#3C0078]/10",
        description: "File uploads, text entry, URLs, or media recordings submitted directly through the platform.",
    },
    {
        id: "quiz",
        label: "Quiz",
        icon: HelpCircle,
        color: "#FF8731",
        bg: "bg-[#FF8731]/10",
        description: "Multiple choice, essay, and matching questions with automatic or manual grading.",
    },
    {
        id: "discussion",
        label: "Graded Discussion",
        icon: MessageSquare,
        color: "#14B8A6",
        bg: "bg-[#14B8A6]/10",
        description: "Interactive forum where students earn grades through participation and responses.",
    },
    {
        id: "peer",
        label: "Peer Review",
        icon: Users,
        color: "#F59E0B",
        bg: "bg-[#F59E0B]/10",
        description: "Students assess each other's work; can be anonymous or reveal reviewer names.",
    },
    {
        id: "external",
        label: "External Tool (LTI)",
        icon: ExternalLink,
        color: "#6366F1",
        bg: "bg-[#6366F1]/10",
        description: "Integrates Turnitin, Google Assignments, Microsoft 365, and other outside platforms.",
    },
    {
        id: "ungraded",
        label: "Non-Submission / Ungraded",
        icon: ClipboardList,
        color: "#64748B",
        bg: "bg-[#64748B]/10",
        description: "In-class tasks, attendance, or reading assignments that don't require an online turn-in.",
    },
];

const ASSIGNMENT_GROUPS_DATA = [
    {
        id: "g1",
        name: "Projects",
        weight: 40,
        assignments: [
            { id: "a1", title: "Project 1: Research & Discovery", type: "online", points: 100, gradeDisplay: "Percentage", dueDate: "2026-03-12", availableFrom: "2026-02-28", availableUntil: "2026-03-15", assignedTo: "Everyone", published: true, submissions: 22, totalStudents: 26 },
            { id: "a2", title: "Project 2: Wireframes & Prototyping", type: "online", points: 150, gradeDisplay: "Points", dueDate: "2026-04-05", availableFrom: "2026-03-20", availableUntil: "2026-04-08", assignedTo: "Everyone", published: true, submissions: 19, totalStudents: 26 },
        ],
    },
    {
        id: "g2",
        name: "Quizzes",
        weight: 20,
        assignments: [
            { id: "a3", title: "Mid-Term Knowledge Check", type: "quiz", points: 50, gradeDisplay: "Percentage", dueDate: "2026-04-15", availableFrom: "2026-04-15", availableUntil: "2026-04-15", assignedTo: "Everyone", published: true, submissions: 25, totalStudents: 26 },
            { id: "a4", title: "UX Principles Quick Quiz", type: "quiz", points: 30, gradeDisplay: "Points", dueDate: "2026-05-02", availableFrom: "2026-05-02", availableUntil: "2026-05-02", assignedTo: "Everyone", published: false, submissions: 0, totalStudents: 26 },
        ],
    },
    {
        id: "g3",
        name: "Discussions",
        weight: 15,
        assignments: [
            { id: "a5", title: "Week 3: Accessible Design Forum", type: "discussion", points: 20, gradeDisplay: "Complete/Incomplete", dueDate: "2026-03-22", availableFrom: "2026-03-18", availableUntil: "2026-03-24", assignedTo: "Everyone", published: true, submissions: 24, totalStudents: 26 },
        ],
    },
    {
        id: "g4",
        name: "Peer Reviews",
        weight: 10,
        assignments: [
            { id: "a6", title: "Peer Review: Prototype Critique", type: "peer", points: 25, gradeDisplay: "Points", dueDate: "2026-04-20", availableFrom: "2026-04-18", availableUntil: "2026-04-22", assignedTo: "Everyone", published: false, submissions: 0, totalStudents: 26 },
        ],
    },
    {
        id: "g5",
        name: "Exams",
        weight: 15,
        assignments: [
            { id: "a7", title: "Final Case Study Delivery", type: "online", points: 200, gradeDisplay: "Percentage", dueDate: "2026-06-10", availableFrom: "2026-06-01", availableUntil: "2026-06-12", assignedTo: "Everyone", published: false, submissions: 0, totalStudents: 26 },
        ],
    },
];

const GRADE_DISPLAY_OPTIONS = ["Percentage", "Points", "Letter Grade", "Complete/Incomplete", "GPA Scale", "Not Graded"];
const SUBMISSION_TYPE_OPTIONS = ["Online", "On Paper", "External Tool", "No Submission"];
const ASSIGN_TO_OPTIONS = ["Everyone", "Specific Section", "Individual Students"];

function AssignmentTypeIcon({ type, size = 18 }) {
    const found = ASSIGNMENT_TYPES.find(t => t.id === type);
    if (!found) return null;
    const Icon = found.icon;
    return (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${found.bg}`} title={found.label}>
            <Icon size={size} style={{ color: found.color }} />
        </span>
    );
}

function CreateAssignmentDrawer({ onClose, onSave, initialData }) {
    const isEditing = !!initialData;
    const [form, setForm] = React.useState({
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        type: initialData?.type ?? "online",
        points: initialData?.maxPoints ?? initialData?.points ?? 100,
        gradeDisplay: initialData?.gradeDisplay ?? "Percentage",
        openDate: initialData?.openDate ? new Date(initialData.openDate).toISOString().slice(0,16) : "",
        closeDate: initialData?.closeDate ? new Date(initialData.closeDate).toISOString().slice(0,16) : "",
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0,16) : "",
        allowMultipleAttempts: initialData?.allowMultipleAttempts ?? true,
        id: initialData?.id ?? null,
        submissions: initialData?.submissions ?? 0,
        totalStudents: initialData?.totalStudents ?? 0,
    });

    const parseInitialQuestions = () => {
        if (!initialData?.quizQuestionsJson) return [];
        try { return JSON.parse(initialData.quizQuestionsJson); } catch { return []; }
    };
    const [quizQuestions, setQuizQuestions] = React.useState(parseInitialQuestions);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const addQuestion = () => setQuizQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
    const removeQuestion = (qi) => setQuizQuestions(prev => prev.filter((_, i) => i !== qi));
    const updateQuestion = (qi, field, value) => setQuizQuestions(prev => prev.map((q, i) => i !== qi ? q : { ...q, [field]: value }));
    const updateOption = (qi, oi, value) => setQuizQuestions(prev => prev.map((q, i) => i !== qi ? q : { ...q, options: q.options.map((o, j) => j !== oi ? o : value) }));

    const handleSubmit = () => {
        if (!form.title.trim()) return;
        const payload = {
            ...form,
            maxPoints: form.points,
            quizQuestionsJson: form.type === "quiz" && quizQuestions.length > 0 ? JSON.stringify(quizQuestions) : null,
        };
        onSave(payload);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
                style={{ borderRadius: "40px 0 0 40px" }}
            >
                {/* Drawer Header */}
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Assignment" : "Create Assignment"}</h2>
                        <p className="text-sm text-gray-400 mt-1">Fill in the details below</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <X size={22} />
                    </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">

                    {/* Assignment Type */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Assignment Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {ASSIGNMENT_TYPES.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleChange("type", t.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all ${
                                            form.type === t.id
                                                ? "border-[#3C0078] bg-[#3C0078]/5"
                                                : "border-gray-100 hover:border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${t.bg}`}>
                                            <Icon size={18} style={{ color: t.color }} />
                                        </span>
                                        <span className={`text-[10px] font-bold leading-tight ${form.type === t.id ? "text-[#3C0078]" : "text-gray-500"}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Title</label>
                        <input
                            type="text"
                            placeholder="Assignment title..."
                            value={form.title}
                            onChange={e => handleChange("title", e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Instructions / Description</label>
                        <textarea
                            rows={4}
                            placeholder="Write the assignment instructions here..."
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {/* Points & Grade Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Points</label>
                            <input
                                type="number"
                                min={0}
                                value={form.points}
                                onChange={e => handleChange("points", parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Grade Display</label>
                            <select
                                value={form.gradeDisplay}
                                onChange={e => handleChange("gradeDisplay", e.target.value)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all appearance-none"
                            >
                                {GRADE_DISPLAY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Allow Multiple Attempts */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Allow Multiple Attempts</p>
                            <p className="text-xs text-gray-500 mt-0.5">Students can resubmit until closed</p>
                        </div>
                        <button
                            onClick={() => handleChange("allowMultipleAttempts", !form.allowMultipleAttempts)}
                            className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.allowMultipleAttempts ? "bg-[#3C0078]" : "bg-gray-300"}`}
                        >
                            <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.allowMultipleAttempts ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Dates */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Dates</label>
                        <div className="bg-gray-50 rounded-[28px] p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Opens</label>
                                <input
                                    type="datetime-local"
                                    value={form.openDate}
                                    onChange={e => handleChange("openDate", e.target.value)}
                                    className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={form.dueDate}
                                    onChange={e => handleChange("dueDate", e.target.value)}
                                    className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Closes</label>
                                <input
                                    type="datetime-local"
                                    value={form.closeDate}
                                    onChange={e => handleChange("closeDate", e.target.value)}
                                    className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quiz Questions (only for quiz type) */}
                    {form.type === "quiz" && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quiz Questions</label>
                                <button onClick={addQuestion} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF8731]/10 text-[#FF8731] font-bold text-[10px] uppercase tracking-widest hover:bg-[#FF8731]/20 transition-all">
                                    <Plus size={14} /> Add Question
                                </button>
                            </div>
                            {quizQuestions.length === 0 && (
                                <p className="text-xs text-gray-400 bg-gray-50 rounded-2xl px-5 py-4">No questions yet. Click "Add Question" to begin.</p>
                            )}
                            <div className="space-y-4">
                                {quizQuestions.map((q, qi) => (
                                    <div key={qi} className="bg-gray-50 rounded-[24px] p-5 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-[#FF8731]/20 text-[#FF8731] text-[10px] font-black flex items-center justify-center shrink-0 mt-1">{qi + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="Question text..."
                                                value={q.question}
                                                onChange={e => updateQuestion(qi, "question", e.target.value)}
                                                className="flex-1 bg-white rounded-xl px-4 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF8731]/20 border border-gray-100"
                                            />
                                            <button onClick={() => removeQuestion(qi)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-2 pl-9">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qi}`}
                                                        checked={q.correctAnswer === oi}
                                                        onChange={() => updateQuestion(qi, "correctAnswer", oi)}
                                                        className="accent-[#3C0078]"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${oi + 1}...`}
                                                        value={opt}
                                                        onChange={e => updateOption(qi, oi, e.target.value)}
                                                        className="flex-1 bg-white rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C0078]/10 border border-gray-100"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 pl-9">Select the radio button next to the correct answer</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="px-10 py-6 border-t border-gray-100 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-4 rounded-2xl bg-[#3C0078] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2A0054] transition-all shadow-lg shadow-[#3C0078]/20 flex items-center justify-center gap-2"
                    >
                        <Eye size={16} /> {isEditing ? "Save Changes" : "Publish"}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─────────────────────────────────────────────
// Teacher: review submissions for a single assignment
// ─────────────────────────────────────────────
function TeacherSubmissionReview({ assignment, onBack }) {
    const [submissions, setSubmissions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const data = await getAssignmentSubmissions(assignment.id);
                if (mounted) setSubmissions(data);
            } catch (err) {
                console.error("Failed to load submissions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [assignment.id]);

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Back */}
            <motion.div variants={slideUp} className="flex items-center gap-3 mb-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-[#3C0078] transition-colors font-semibold text-sm group"
                >
                    <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Assignments
                </button>
                <span className="text-gray-200">/</span>
                <span className="text-sm text-gray-700 font-semibold truncate max-w-[320px]">{assignment.title}</span>
            </motion.div>

            {/* Header */}
            <motion.div variants={slideUp} className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{assignment.title}</h1>
                {!loading && (
                    <p className="text-gray-400 text-sm mt-1">
                        {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                    </p>
                )}
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400 font-medium">Loading submissions…</div>
            ) : submissions.length === 0 ? (
                <motion.div variants={slideUp} className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 text-gray-400 font-medium">
                    No submissions yet for this assignment.
                </motion.div>
            ) : (
                <motion.div variants={staggerContainer} className="space-y-3">
                    {submissions.map(sub => {
                        const studentName = sub.student
                            ? `${sub.student.firstName} ${sub.student.lastName}`
                            : sub.studentId;
                        const studentEmail = sub.student?.email || "";
                        const isQuizAnswer = (() => {
                            try {
                                if (!sub.fileUrl) return false;
                                const parsed = JSON.parse(sub.fileUrl);
                                return typeof parsed === "object" && !Array.isArray(parsed);
                            } catch { return false; }
                        })();

                        return (
                            <motion.div
                                key={sub.id}
                                variants={slideUp}
                                className="bg-white border border-gray-100 rounded-[28px] px-7 py-5 flex items-center gap-5"
                            >
                                {/* Avatar initials */}
                                <div className="shrink-0 w-11 h-11 rounded-2xl bg-[#3C0078]/10 flex items-center justify-center">
                                    <span className="text-[#3C0078] font-bold text-sm">
                                        {(sub.student?.firstName?.[0] || "?").toUpperCase()}
                                        {(sub.student?.lastName?.[0] || "").toUpperCase()}
                                    </span>
                                </div>

                                {/* Student info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900">{studentName}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{studentEmail}</p>
                                </div>

                                {/* Submitted at */}
                                <div className="shrink-0 text-right">
                                    <p className="text-xs font-semibold text-gray-500">
                                        {sub.submittedAt
                                            ? new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                            : "—"}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {sub.submittedAt
                                            ? new Date(sub.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                            : ""}
                                    </p>
                                </div>

                                {/* File link or quiz badge */}
                                {sub.fileUrl && !isQuizAnswer && (
                                    <a
                                        href={`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api").replace("/api", "")}${sub.fileUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3C0078]/5 text-[#3C0078] text-xs font-bold hover:bg-[#3C0078]/10 transition-colors"
                                    >
                                        <FileText size={14} />
                                        View File
                                    </a>
                                )}
                                {isQuizAnswer && (
                                    <span className="shrink-0 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold">
                                        Quiz Response
                                    </span>
                                )}

                                {/* Status badge */}
                                <span className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    sub.status === "Graded"
                                        ? "bg-green-100 text-green-700"
                                        : sub.status === "Submitted" || sub.status === "Resubmitted"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-500"
                                }`}>
                                    {sub.status || "Submitted"}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}

function AssignmentGroupRow({ group, onTogglePublish, onDelete, onEdit, onClose, onView }) {
    const [expanded, setExpanded] = React.useState(true);

    return (
        <motion.div variants={slideUp} className="mb-6">
            {/* Group Header */}
            <div
                className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-[24px] cursor-pointer hover:bg-gray-100 transition-colors mb-3"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>
                        <ChevronDown size={18} />
                    </span>
                    <span className="font-bold text-gray-900 text-base">{group.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {group.weight}% of grade
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {group.assignments.length} assignment{group.assignments.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Assignment Rows */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {group.assignments.map(item => {
                            const typeInfo = ASSIGNMENT_TYPES.find(t => t.id === item.type);
                            const Icon = typeInfo?.icon || FileText;
                            const submissionPct = item.totalStudents > 0
                                ? Math.round((item.submissions / item.totalStudents) * 100)
                                : 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="bg-white border border-gray-100 rounded-[28px] px-7 py-5 flex items-center gap-5 hover:shadow-lg hover:border-[#3C0078]/10 transition-all group"
                                >
                                    {/* Type icon */}
                                    <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-2xl ${typeInfo?.bg || "bg-gray-100"}`}>
                                        <Icon size={18} style={{ color: typeInfo?.color || "#64748B" }} />
                                    </span>

                                    {/* Title + meta */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors truncate">
                                                {item.title}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                                {typeInfo?.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-5 mt-1.5 text-xs text-gray-400 flex-wrap">
                                            <span>{item.points} pts</span>
                                            {item.openDate && (
                                                <span className="text-green-600">Opens: {new Date(item.openDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            )}
                                            {item.dueDate && (
                                                <span className="text-orange-500">Due: {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            )}
                                            {item.closeDate && (
                                                <span className="text-red-500">Closes: {new Date(item.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission progress */}
                                    <div className="shrink-0 flex flex-col items-end gap-1 min-w-[90px]">
                                        <span className="text-xs font-bold text-gray-700">{item.submissions}/{item.totalStudents} submitted</span>
                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3C0078] rounded-full transition-all"
                                                style={{ width: `${submissionPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Review Submissions */}
                                    <button
                                        onClick={() => onView(item)}
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3C0078]/5 text-[#3C0078] font-bold text-[10px] uppercase tracking-widest hover:bg-[#3C0078]/10 transition-all"
                                        title="Review submissions"
                                    >
                                        <Users size={14} />
                                        Review
                                    </button>

                                    {/* Close/Reopen toggle */}
                                    <button
                                        onClick={() => onClose(group.id, item.id)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                                            item.isClosed
                                                ? "bg-red-50 text-red-600 hover:bg-green-50 hover:text-green-700"
                                                : "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
                                        }`}
                                        title={item.isClosed ? "Click to reopen" : "Click to close"}
                                    >
                                        {item.isClosed ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {item.isClosed ? "Closed" : "Open"}
                                    </button>

                                    {/* Edit */}
                                    <button
                                        onClick={() => onEdit(group.id, item.id)}
                                        className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-[#3C0078] hover:bg-[#3C0078]/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Edit assignment"
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => onDelete(group.id, item.id)}
                                        className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CourseAssignmentsView({ subject, activeCourseId }) {
    const [assignments, setAssignments] = React.useState([]);
    const [submissionCounts, setSubmissionCounts] = React.useState({});
    const [enrollmentCount, setEnrollmentCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [showDrawer, setShowDrawer] = React.useState(false);
    const [editingAssignment, setEditingAssignment] = React.useState(null);
    const [activeTypeFilter, setActiveTypeFilter] = React.useState("all");
    const [saving, setSaving] = React.useState(false);
    const [reviewingAssignment, setReviewingAssignment] = React.useState(null);
    const [showStudentPreview, setShowStudentPreview] = React.useState(false);

    const loadData = React.useCallback(async () => {
        if (!activeCourseId) return;
        try {
            setLoading(true);
            const [data, subs, count] = await Promise.all([
                getCourseAssignments(activeCourseId),
                getCourseSubmissions(activeCourseId).catch(() => []),
                getCourseStudentCount(activeCourseId).catch(() => 0),
            ]);
            const counts = {};
            (subs || []).forEach(s => {
                counts[s.assignmentId] = (counts[s.assignmentId] || 0) + 1;
            });
            setAssignments(data || []);
            setSubmissionCounts(counts);
            setEnrollmentCount(count || 0);
        } catch (err) {
            console.error("Failed to load assignments:", err);
        } finally {
            setLoading(false);
        }
    }, [activeCourseId]);

    React.useEffect(() => { loadData(); }, [loadData]);

    // Build one group from real data
    const groups = React.useMemo(() => [{
        id: "all",
        name: "All Assignments",
        weight: 100,
        assignments: assignments.map(a => ({
            ...a,
            points: a.maxPoints,
            submissions: submissionCounts[a.id] || 0,
            totalStudents: enrollmentCount,
            published: !a.isClosed,
        }))
    }], [assignments, submissionCounts, enrollmentCount]);

    const handleTogglePublish = () => {}; // handled by handleClose

    const handleDelete = async (groupId, assignmentId) => {
        try {
            await deleteAssignment(assignmentId);
            setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleEdit = (groupId, assignmentId) => {
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment) {
            setEditingAssignment(assignment);
            setShowDrawer(true);
        }
    };

    const handleClose = async (groupId, assignmentId) => {
        try {
            const result = await closeAssignment(assignmentId);
            setAssignments(prev => prev.map(a =>
                a.id !== assignmentId ? a : { ...a, isClosed: result.isClosed }
            ));
        } catch (err) {
            console.error("Close failed:", err);
        }
    };

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                openDate: formData.openDate ? new Date(formData.openDate).toISOString() : null,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                closeDate: formData.closeDate ? new Date(formData.closeDate).toISOString() : null,
                maxPoints: formData.maxPoints || formData.points,
                courseId: activeCourseId,
                type: formData.type,
                isClosed: false,
                allowMultipleAttempts: formData.allowMultipleAttempts ?? true,
                quizQuestionsJson: formData.quizQuestionsJson ?? null,
            };
            if (editingAssignment) {
                await updateAssignment(editingAssignment.id, { ...payload, id: editingAssignment.id });
            } else {
                await createAssignment(payload);
            }
            await loadData();
            setEditingAssignment(null);
            setShowDrawer(false);
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const totalAssignments = assignments.length;
    const openCount = assignments.filter(a => !a.isClosed).length;

    const filteredGroups = activeTypeFilter === "all"
        ? groups
        : groups.map(g => ({
            ...g,
            assignments: g.assignments.filter(a => a.type === activeTypeFilter)
        })).filter(g => g.assignments.length > 0);

    if (reviewingAssignment) {
        return (
            <TeacherSubmissionReview
                assignment={reviewingAssignment}
                onBack={() => setReviewingAssignment(null)}
            />
        );
    }

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>

            {/* Header */}
            <motion.header variants={slideUp} className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-gray-500 mt-2">{subject?.code || "Module"} | Manage Assessments & Briefs</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Archive
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowDrawer(true)}
                        className="bg-[#3C0078] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#3C0078]/20"
                    >
                        <Plus size={18} /> Create Assignment
                    </motion.button>
                </div>
            </motion.header>

            {/* Summary Stats */}
            <motion.div variants={slideUp} className="grid grid-cols-3 gap-4 mb-10">
                {[
                    { label: "Total Assignments", value: loading ? "…" : totalAssignments, accent: false },
                    { label: "Open", value: loading ? "…" : openCount, accent: true },
                    { label: "Closed", value: loading ? "…" : totalAssignments - openCount, accent: false },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-[28px] px-7 py-6 flex flex-col gap-1 ${stat.accent ? "bg-[#3C0078] text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${stat.accent ? "text-white/60" : "text-gray-400"}`}>{stat.label}</span>
                        <span className={`text-4xl font-black italic ${stat.accent ? "text-white" : "text-gray-900"}`}>{stat.value}</span>
                    </div>
                ))}
            </motion.div>

            {/* Assignment Type Overview Cards */}
            <motion.div variants={slideUp} className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Assignment Types</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {ASSIGNMENT_TYPES.map(t => {
                        const Icon = t.icon;
                        const count = groups.reduce((sum, g) => sum + g.assignments.filter(a => a.type === t.id).length, 0);
                        const isActive = activeTypeFilter === t.id;
                        return (
                            <motion.button
                                key={t.id}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveTypeFilter(isActive ? "all" : t.id)}
                                className={`flex flex-col items-start gap-3 p-5 rounded-[24px] border-2 text-left transition-all ${
                                    isActive
                                        ? "border-[#3C0078] bg-[#3C0078]/5 shadow-md"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${t.bg}`}>
                                    <Icon size={20} style={{ color: t.color }} />
                                </span>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isActive ? "text-[#3C0078]" : "text-gray-500"}`}>
                                        {t.label}
                                    </p>
                                    <p className="text-2xl font-black italic text-gray-900 mt-1">{count}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* All filter pill */}
            {activeTypeFilter !== "all" && (
                <motion.div variants={slideUp} className="mb-6 flex items-center gap-3">
                    <span className="text-sm text-gray-500">Filtering by:</span>
                    <button
                        onClick={() => setActiveTypeFilter("all")}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3C0078]/10 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078]/20 transition-all"
                    >
                        {ASSIGNMENT_TYPES.find(t => t.id === activeTypeFilter)?.label}
                        <X size={14} />
                    </button>
                </motion.div>
            )}

            {/* Assignment Groups */}
            <motion.div variants={slideUp}>
                <div className="mb-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Assignment Groups</h2>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 text-gray-400 font-medium">
                        No assignments match this filter.
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <AssignmentGroupRow
                            key={group.id}
                            group={group}
                            onTogglePublish={handleTogglePublish}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onClose={handleClose}
                            onView={(item) => setReviewingAssignment(item)}
                        />
                    ))
                )}
            </motion.div>

            {/* Student View Hint */}
            <motion.div variants={slideUp} className="mt-10 flex items-center gap-4 p-6 bg-[#3C0078]/5 rounded-[28px] border border-[#3C0078]/10">
                <BookOpen size={22} className="text-[#3C0078] shrink-0" />
                <div>
                    <p className="text-sm font-bold text-[#3C0078]">Student View</p>
                    <p className="text-xs text-gray-500 mt-0.5">Use Student View to see exactly how published assignments appear to students before releasing a new brief.</p>
                </div>
                <button
                    onClick={() => setShowStudentPreview(true)}
                    className="ml-auto shrink-0 px-6 py-2.5 rounded-2xl bg-[#3C0078] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2A0054] transition-all whitespace-nowrap"
                >
                    Preview as Student
                </button>
            </motion.div>

            {/* Student preview modal */}
            <AnimatePresence>
                {showStudentPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowStudentPreview(false); }}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="w-full max-w-3xl bg-white shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#3C0078]">Student Preview</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">How students see this course’s assignments</p>
                                </div>
                                <button
                                    onClick={() => setShowStudentPreview(false)}
                                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {/* Student view component */}
                            <div className="flex-1 overflow-y-auto">
                                <StudentCourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create / Edit Assignment Drawer */}
            {showDrawer && (
                <CreateAssignmentDrawer
                    onClose={() => { setShowDrawer(false); setEditingAssignment(null); }}
                    onSave={handleSave}
                    initialData={editingAssignment}
                />
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

// TODO: backend endpoint missing — used only by CourseAttendanceView since no AttendanceController exists yet.
const STUDENT_GRADES_DATA = [
    { id: 1, name: "Alice Johnson", email: "alice.j@student.ac.za", attendance: "95%", avgGrade: "88%", status: "Good", avatar: "AJ" },
    { id: 2, name: "Bob Smith", email: "bob.s@student.ac.za", attendance: "82%", avgGrade: "74%", status: "At Risk", avatar: "BS" },
    { id: 3, name: "Charlie Davis", email: "charlie.d@student.ac.za", attendance: "91%", avgGrade: "92%", status: "Excellent", avatar: "CD" },
    { id: 4, name: "Diana Prince", email: "diana.p@student.ac.za", attendance: "98%", avgGrade: "85%", status: "Good", avatar: "DP" },
    { id: 5, name: "Ethan Hunt", email: "ethan.h@student.ac.za", attendance: "65%", avgGrade: "58%", status: "Critical", avatar: "EH" },
    { id: 6, name: "Fiona Apple", email: "fiona.a@student.ac.za", attendance: "89%", avgGrade: "79%", status: "Good", avatar: "FA" },
];

function CourseGradesView({ activeCourseId }) {
    const [grades, setGrades] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchData() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const [g, s] = await Promise.all([
                    getCourseGrades(activeCourseId).catch(() => []),
                    getCourseSubmissions(activeCourseId).catch(() => []),
                ]);
                if (mounted) {
                    setGrades(g || []);
                    setSubmissions(s || []);
                }
            } catch (err) {
                console.error("Failed to load course grades/submissions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId]);

    // Aggregate by student
    const studentRows = React.useMemo(() => {
        const map = {};
        submissions.forEach(s => {
            const student = s.student;
            if (!student) return;
            const sid = student.id;
            if (!map[sid]) {
                const name = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
                map[sid] = {
                    id: sid,
                    name,
                    email: student.email,
                    avatar: name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || "S",
                    totalEarned: 0,
                    totalMax: 0,
                };
            }
            const grade = grades.find(g => g.submissionId === s.id);
            if (grade && s.assignment) {
                map[sid].totalEarned += (grade.pointsEarned || 0);
                map[sid].totalMax += (s.assignment.maxPoints || 0);
            }
        });
        return Object.values(map).map(r => {
            const pct = r.totalMax > 0 ? Math.round((r.totalEarned / r.totalMax) * 100) : 0;
            return {
                ...r,
                avgGrade: `${pct}%`,
                avgGradePct: pct,
                attendance: "—", // TODO: backend endpoint missing
                status: pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "At Risk" : "Critical"
            };
        });
    }, [submissions, grades]);

    // Class average for header
    const classAvg = React.useMemo(() => {
        if (studentRows.length === 0) return 0;
        return Math.round(studentRows.reduce((s, r) => s + r.avgGradePct, 0) / studentRows.length);
    }, [studentRows]);

    const aboveTarget = studentRows.filter(r => r.avgGradePct >= 75).length;
    const topStudent = studentRows.length > 0 ? studentRows.reduce((a, b) => a.avgGradePct > b.avgGradePct ? a : b) : null;

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
                            <AttendanceChart attended={classAvg} total={100} missed={100 - classAvg} label="Grade Distribution" />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div variants={scaleIn} className="flex flex-col gap-6">
                    <div className="bg-[#3C0078] rounded-[40px] p-8 text-white flex-1 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 block mb-2">Class Average</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black italic">{classAvg}%</span>
                            <span className="text-sm opacity-60">Avg</span>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>{aboveTarget} students above target</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex-1 group hover:border-[#3C0078]/20 transition-all">
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block mb-6">Highest Performance</span>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black italic text-xl shadow-inner">
                                {topStudent && topStudent.avgGradePct >= 90 ? "A+" : topStudent && topStudent.avgGradePct >= 80 ? "A" : "B"}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic text-gray-900 leading-none">{topStudent ? `${topStudent.avgGradePct}%` : "—"}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{topStudent ? topStudent.name : "No students"}</p>
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
                        {studentRows.map((student) => (
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
  // Lecturer state
  const [lecturerName, setLecturerName] = React.useState(subject?.lecturerName || "Dr. Sarah Miller");
  const [lecturerTitle, setLecturerTitle] = React.useState("Senior Design Lead & Principle Researcher");
  const [lecturerEmail, setLecturerEmail] = React.useState(subject?.lecturerEmail || "natalie@openwindow.co.za");
  const [lecturerImage, setLecturerImage] = React.useState(subject?.lecturerImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop");
  const [bookingLink, setBookingLink] = React.useState("#");
  const [isEditing, setIsEditing] = React.useState(false);

  // States for expandable text bars
  const [activeInput, setActiveInput] = React.useState(null); // 'email' or 'booking'
  const [tempEmail, setTempEmail] = React.useState(lecturerEmail);
  const [tempBooking, setTempBooking] = React.useState(bookingLink);
  
  // Quick Links state
  const [editingQuickLinkIndex, setEditingQuickLinkIndex] = React.useState(null);
  const [tempQuickLinkLabel, setTempQuickLinkLabel] = React.useState("");
  const [tempQuickLinkHref, setTempQuickLinkHref] = React.useState("");

  const [quickLinks, setQuickLinks] = React.useState([
    { label: "Figma Assets", href: "#" },
    { label: "Miro Board", href: "#" },
    { label: "Course Syllabus", href: "#" },
    { label: "Attendance", href: "#" },
    { label: "VLE Portal", href: "#" },
    { label: "Library Search", href: "#" }
  ]);

  const fileInputRef = React.useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLecturerImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditingQuickLink = (index, link) => {
    setEditingQuickLinkIndex(index);
    setTempQuickLinkLabel(link.label);
    setTempQuickLinkHref(link.href);
  };

  const saveQuickLink = () => {
    if (editingQuickLinkIndex === "new") {
      setQuickLinks([...quickLinks, { label: tempQuickLinkLabel, href: tempQuickLinkHref }]);
    } else {
      const updated = [...quickLinks];
      updated[editingQuickLinkIndex] = { label: tempQuickLinkLabel, href: tempQuickLinkHref };
      setQuickLinks(updated);
    }
    setEditingQuickLinkIndex(null);
  };

  const addQuickLink = () => {
    setEditingQuickLinkIndex("new");
    setTempQuickLinkLabel("");
    setTempQuickLinkHref("");
  };

  // Use subject imageUrl or a placeholder if not present
  var sampleImg = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
  const courseImage = subject?.imageUrl || sampleImg;

  return (
    <div className="flex-1 flex flex-col p-12 overflow-y-auto scrollbar-hide">
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

          <section className="w-full pt-20 pb-20 border-t border-gray-100/50">
            <div className="flex flex-col lg:flex-row items-center relative">
              
              {/* Universal Edit Button - Top Right of the Image/Text block */}
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="absolute top-0 right-[35%] z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border border-gray-100 bg-gray-50 text-[#3C0078] hover:bg-[#3C0078] hover:text-white"
                title={isEditing ? "Save Changes" : "Edit Lecturer Section"}
              >
                {isEditing ? <CheckSquare size={16} /> : <Edit2 size={16} />}
              </button>

              {/* Column 1: Image */}
              <div className="w-full lg:w-1/4 flex justify-center">
                <div className={`relative group ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl relative">
                    <img 
                      src={lecturerImage} 
                      alt="Lecturer" 
                      className={`w-full h-full object-cover transition-transform duration-700 ${!isEditing ? 'group-hover:scale-110' : ''}`}
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PenLine className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              {/* Column 2: Lecturer Details & Buttons - Tightened gap with Image */}
              <div className="w-full lg:w-2/5 flex flex-col items-start text-left lg:border-l border-gray-100 lg:pl-12 ml-[-1%]">
                <div className="mb-10 w-full">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#3C0078] mb-3 block">Module Head</span>
                  {isEditing ? (
                    <input
                      className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4 bg-white border border-[#3C0078]/20 rounded-xl px-3 py-1 outline-none w-full shadow-sm"
                      value={lecturerName}
                      onChange={(e) => setLecturerName(e.target.value)}
                      placeholder="Lecturer Name"
                    />
                  ) : (
                    <h3 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4">{lecturerName}</h3>
                  )}
                  
                  {isEditing ? (
                    <input
                      className="text-xl text-gray-700 font-bold bg-white border border-[#3C0078]/20 rounded-xl px-3 py-1 outline-none w-full shadow-sm"
                      value={lecturerTitle}
                      onChange={(e) => setLecturerTitle(e.target.value)}
                      placeholder="Job Title"
                    />
                  ) : (
                    <p className="text-xl text-gray-700 font-bold">{lecturerTitle}</p>
                  )}
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="relative w-full">
                    <button 
                      type="button"
                      className={`h-12 w-full flex items-center justify-center rounded-full bg-[#3C0078] text-white !text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-md shadow-[#3C0078]/20 cursor-default`}
                    >
                      {lecturerEmail}
                    </button>
                  </div>
                  
                  <div className="relative w-full">
                    <button 
                      type="button"
                      className={`h-12 w-full flex items-center justify-center rounded-full bg-white border border-[#3C0078] text-[#3C0078] text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm cursor-default`}
                    >
                      Book a Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Quick Links - Increased Spacing */}
              <div className="w-full lg:flex-1 lg:border-l border-gray-100 lg:pl-16 relative">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-black">Quick Links</h4>
                  <button 
                    onClick={addQuickLink}
                    className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[#3C0078] hover:bg-[#3C0078] hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 relative">
                  {quickLinks.map((link, index) => (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => isEditing ? startEditingQuickLink(index, link) : window.open(link.href)}
                        className="px-6 py-3 bg-white border border-[#3C0078] rounded-full text-[10px] font-bold uppercase tracking-widest text-[#3C0078] hover:bg-[#87CEFA] hover:border-[#87CEFA] hover:text-[#3C0078] transition-all shadow-sm"
                      >
                        {link.label}
                      </button>
                    </div>
                  ))}

                  {/* Inline Quick Link Editor Popup */}
                  <AnimatePresence>
                    {isEditing && editingQuickLinkIndex !== null && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute inset-x-0 top-0 z-40 bg-white border border-[#3C0078]/20 rounded-[30px] p-6 shadow-2xl backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-[#3C0078]">
                            {editingQuickLinkIndex === "new" ? "Add Link" : "Edit Link"}
                          </h5>
                          <button onClick={() => setEditingQuickLinkIndex(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 mb-1 block">Display Name</label>
                            <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#3C0078]/30"
                              value={tempQuickLinkLabel}
                              onChange={(e) => setTempQuickLinkLabel(e.target.value)}
                              placeholder="e.g. Portfolio"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 mb-1 block">URL / Link</label>
                            <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-[#3C0078]/30"
                              value={tempQuickLinkHref}
                              onChange={(e) => setTempQuickLinkHref(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={saveQuickLink}
                              className="flex-1 bg-black text-white py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                              <Check size={14} /> Save Link
                            </button>
                            {editingQuickLinkIndex !== "new" && (
                              <button 
                                onClick={() => {
                                  setQuickLinks(quickLinks.filter((_, i) => i !== editingQuickLinkIndex));
                                  setEditingQuickLinkIndex(null);
                                }}
                                className="w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                title="Delete Link"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
/**
 * TeacherCourses Component
 * 
 * Main shell for the teacher's course view.
 */
export default function TeacherCourses() {
    const location = useLocation();
    const navigate = useNavigate();
    const { visibleCourses, loading } = useCourses();

    // The route matches /courses/:courseId/:subpage 
    // E.g. pathParts = ["courses", "dfg897-...", "grades"]
    const pathParts = location.pathname.split('/').filter(Boolean);
    const activeCourseId = pathParts.length > 1 ? pathParts[1] : null;

    // React Router Guard: If the user navigates merely to /courses without specifying an ID, 
    // or if they are on a course but no specific sub-page is active, ensure we default to home.
    useEffect(() => {
        if (!loading && visibleCourses.length > 0) {
            const courseExistsInList = visibleCourses.find(c => c.id === activeCourseId);
            
            if (!activeCourseId || !courseExistsInList) {
                // Redirect to the first course's home if no valid course ID is present
                navigate(`/courses/${visibleCourses[0].id}`, { replace: true });
            } else if (pathParts.length === 2) {
                // If we have /courses/:id but nothing else, the UI is already showing CourseHomeView
                // but we might want to ensure it's explicitly handled if needed.
                // Currently, isHomePage handles the rendering logic.
            }
        }
    }, [loading, visibleCourses, activeCourseId, navigate, pathParts.length]);

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
    // We force Home if exactly on the course ID path or if no other specific sub-page is matched below
    const isHomePage = !isGradesPage && !isAnnouncementsPage && !isAssignmentsPage && !isAttendancePage && !isModulesPage && !isNotesPage;

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
      <div className="flex flex-col h-full py-1 justify-center">
        <CourseSecondaryNav activeCourseId={activeCourseId || (visibleCourses[0]?.id)} />
      </div>

            {/* Main Content Area */}
            {isGradesPage ? (
                <CourseGradesView activeCourseId={activeCourseId} />
            ) : isAnnouncementsPage ? (
                <CourseAnnouncementsView activeCourseId={activeCourseId} />
            ) : isAssignmentsPage ? (
                <CourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
            ) : isAttendancePage ? (
                <CourseAttendanceView />
            ) : isModulesPage ? (
                <CourseModulesView />
            ) : isNotesPage ? (
                <CourseNotesView activeCourseId={activeCourseId} />
            ) : (
                <CourseHomeView subject={subject} course={course} loading={loading} />
            )}
        </div>
    );
}
