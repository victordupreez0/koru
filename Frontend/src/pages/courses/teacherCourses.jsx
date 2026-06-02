import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCourses } from "../../contexts/CoursesContext";
import CourseSecondaryNav from "../../components/courseSecondaryNav";
import ModuleAccordion from "../../components/moduleAccordion";
import { Bell, Calendar, Folder, Upload, InfoCircle, CheckCircle, CloseCircle, CloseSquare, User, Filter } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import AttendanceChart from "../../components/UI/attendanceChart";
import AttendanceVisualizer from "../../components/UI/attendanceVisualizer";
import { getCourseAssignments, createAssignment, updateAssignment, deleteAssignment, closeAssignment } from "../../services/assignmentService";
import { getCourseGrades, getAssignmentGrades, createGrade, updateGrade, releaseAssignmentGrades } from "../../services/gradeService";
import { getCourseSubmissions, getAssignmentSubmissions, updateSubmission } from "../../services/submissionService";
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
import { getCourseModules, createModule, updateModule, deleteModule, createModuleItem, updateModuleItem, deleteModuleItem } from "../../services/moduleService";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Bold, Italic, Underline, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, Trash2, Maximize2, Minimize2, FileText, HelpCircle, MessageSquare, Users, ExternalLink, ClipboardList, Eye, EyeOff, Edit2, ChevronDown, ChevronRight, CheckSquare, GripVertical, ToggleLeft, ToggleRight, PenLine, BookOpen, X, Loader, Check, Download, Paperclip, Link as LinkIcon } from "lucide-react";
import NovelBlockMenu from "../../components/NovelBlockMenu";
import CourseItemView from "./CourseItemView";

/**
 * CourseContent Components
 */

const GRADES_DATA = [
    { id: 1, name: "Project 1: Research & Discovery", weight: "20%", grade: "85%", status: "Graded", date: "Mar 12, 2026" },
    { id: 2, name: "Project 2: Wireframes & Prototyping", weight: "30%", grade: "78%", status: "Graded", date: "Apr 05, 2026" },
    { id: 3, name: "Mid-Term UI Audit", weight: "10%", grade: "92%", status: "Graded", date: "Apr 15, 2026" },
    { id: 4, name: "Final Case Study Delivery", weight: "40%", grade: "-", status: "Pending", date: "Expected June" },
];

// TODO: backend endpoint missing â€” no AttendanceController exists. Static for now.
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
                                <p className="text-xs font-bold uppercase tracking-widest text-[#3C0078] mt-2 opacity-60">Posted by {post.lecturerName || post.lecturer?.name || post.lecturer || "Lecturer"}</p>
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
                                            <p className="font-bold text-[#3C0078]">{selectedAnnouncement.lecturerName || selectedAnnouncement.lecturer?.name || selectedAnnouncement.lecturer || "Lecturer"}</p>
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

// â”€â”€â”€ Static data for teacher assignments view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Teacher: review submissions for a single assignment
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TeacherSubmissionReview({ assignment, onBack }) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = React.useState([]);
    const [grades, setGrades] = React.useState({}); // keyed by submissionId
    const [loading, setLoading] = React.useState(true);
    // Per-submission grading state: { [submissionId]: { points: string, saving: bool, error: string|null, editing: bool } }
    const [gradingState, setGradingState] = React.useState({});
    const [releasing, setReleasing] = React.useState(false);

    async function handleRelease() {
        setReleasing(true);
        try {
            await releaseAssignmentGrades(assignment.id);
            setGrades(prev => {
                const updated = {};
                Object.keys(prev).forEach(k => { updated[k] = { ...prev[k], isReleased: true }; });
                return updated;
            });
        } catch (err) {
            console.error("Failed to release grades:", err);
        } finally {
            setReleasing(false);
        }
    }

    React.useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const [subs, gradeList] = await Promise.all([
                    getAssignmentSubmissions(assignment.id),
                    getAssignmentGrades(assignment.id).catch(() => []),
                ]);
                if (!mounted) return;
                setSubmissions(subs);
                // Build a map: submissionId -> grade object
                const gradeMap = {};
                gradeList.forEach(g => { gradeMap[g.submissionId] = g; });
                setGrades(gradeMap);
                // Pre-fill grading inputs for already-graded submissions
                const initial = {};
                subs.forEach(s => {
                    const existing = gradeMap[s.id];
                    initial[s.id] = { points: existing ? String(existing.pointsEarned) : "", saving: false, error: null, editing: false };
                });
                setGradingState(initial);
            } catch (err) {
                console.error("Failed to load submissions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [assignment.id]);

    function setField(subId, field, value) {
        setGradingState(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
    }

    async function handleGrade(sub) {
        const gs = gradingState[sub.id];
        const pts = parseFloat(gs?.points);
        if (isNaN(pts) || pts < 0 || pts > (assignment.points || Infinity)) {
            setField(sub.id, "error", `Enter a value between 0 and ${assignment.points ?? "max"}.`);
            return;
        }
        setField(sub.id, "saving", true);
        setField(sub.id, "error", null);
        try {
            const existing = grades[sub.id];
            let saved;
            if (existing) {
                await updateGrade(existing.id, { submissionId: sub.id, pointsEarned: pts, gradedBy: user.userId });
                saved = { ...existing, pointsEarned: pts };
            } else {
                saved = await createGrade({ submissionId: sub.id, pointsEarned: pts, gradedBy: user.userId });
            }
            // Mark submission as Graded on the backend
            await updateSubmission(sub.id, { assignmentId: sub.assignmentId, studentId: sub.studentId, fileUrl: sub.fileUrl, status: "Graded" }).catch(() => {});
            setGrades(prev => ({ ...prev, [sub.id]: saved }));
            setField(sub.id, "editing", false);
            setField(sub.id, "saving", false);
            // Reflect "Graded" status in the local submissions list
            setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "Graded" } : s));
        } catch (err) {
            setField(sub.id, "error", err.message || "Failed to save grade.");
            setField(sub.id, "saving", false);
        }
    }

    const maxPts = assignment.points ?? null;

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
            <motion.div variants={slideUp} className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{assignment.title}</h1>
                    {!loading && (
                        <p className="text-gray-400 text-sm mt-1">
                            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                            {maxPts != null && <span className="ml-3 text-gray-300">|</span>}
                            {maxPts != null && <span className="ml-3">Max: <strong>{maxPts} pts</strong></span>}
                        </p>
                    )}
                </div>
                {/* Quick stats */}
                {!loading && submissions.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3 bg-green-50 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Graded</p>
                            <p className="text-xl font-black italic text-green-700">
                                {Object.keys(grades).length}/{submissions.length}
                            </p>
                        </div>
                        {Object.keys(grades).length > 0 && (
                            Object.values(grades).every(g => g.isReleased) ? (
                                <div className="px-4 py-2 bg-purple-50 rounded-2xl flex items-center gap-2">
                                    <Check size={14} className="text-purple-600" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Grades Released</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRelease}
                                    disabled={releasing}
                                    className="px-5 py-3 bg-[#3C0078] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2d0059] transition-colors disabled:opacity-60"
                                >
                                    {releasing ? "Releasingâ€¦" : "Release Grades"}
                                </button>
                            )
                        )}
                    </div>
                )}
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400 font-medium">Loading submissionsâ€¦</div>
            ) : submissions.length === 0 ? (
                <motion.div variants={slideUp} className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 text-gray-400 font-medium">
                    No submissions yet for this assignment.
                </motion.div>
            ) : (
                <motion.div variants={staggerContainer} className="space-y-4">
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
                        const existingGrade = grades[sub.id];
                        const gs = gradingState[sub.id] || { points: "", saving: false, error: null, editing: false };
                        const ptsVal = parseFloat(gs.points);
                        const pct = maxPts && !isNaN(ptsVal) ? Math.round((ptsVal / maxPts) * 100) : null;
                        const isEditing = gs.editing || !existingGrade;

                        return (
                            <motion.div
                                key={sub.id}
                                variants={slideUp}
                                className="bg-white border border-gray-100 rounded-[28px] p-6 space-y-4"
                            >
                                {/* Top row: student + file + status */}
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
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
                                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "â€”"}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                                        </p>
                                    </div>
                                    {/* File or quiz */}
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
                                        <span className="shrink-0 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold">Quiz Response</span>
                                    )}
                                    {/* Status badge */}
                                    <span className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        sub.status === "Graded" ? "bg-green-100 text-green-700"
                                        : sub.status === "Submitted" || sub.status === "Resubmitted" ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {sub.status || "Submitted"}
                                    </span>
                                </div>

                                {/* Grading section */}
                                <div className="border-t border-gray-50 pt-4">
                                    {existingGrade && !gs.editing ? (
                                        // Already graded â€” show result
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grade</span>
                                                    <span className="text-2xl font-black italic text-gray-900">
                                                        {existingGrade.pointsEarned}{maxPts != null && <span className="text-sm font-normal text-gray-400">/{maxPts} pts</span>}
                                                    </span>
                                                </div>
                                                {maxPts != null && (
                                                    <div className="px-5 py-2 rounded-2xl bg-[#3C0078] text-white">
                                                        <span className="text-xl font-black italic">
                                                            {Math.round((existingGrade.pointsEarned / maxPts) * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setField(sub.id, "editing", true)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-500 hover:border-[#3C0078] hover:text-[#3C0078] transition-all"
                                            >
                                                <Edit2 size={13} /> Update Grade
                                            </button>
                                        </div>
                                    ) : (
                                        // Grade entry form
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Points Awarded{maxPts != null && ` (out of ${maxPts})`}
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxPts ?? undefined}
                                                        step="0.5"
                                                        value={gs.points}
                                                        onChange={e => setField(sub.id, "points", e.target.value)}
                                                        placeholder={maxPts != null ? `0 â€“ ${maxPts}` : "Points"}
                                                        disabled={gs.saving}
                                                        className="w-36 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3C0078] transition-colors disabled:opacity-50"
                                                    />
                                                    {/* Live percentage */}
                                                    {pct !== null && (
                                                        <div className={`px-4 py-3 rounded-2xl font-black italic text-lg min-w-[70px] text-center ${
                                                            pct >= 75 ? "bg-green-50 text-green-700"
                                                            : pct >= 50 ? "bg-orange-50 text-orange-600"
                                                            : "bg-red-50 text-red-600"
                                                        }`}>
                                                            {pct}%
                                                        </div>
                                                    )}
                                                </div>
                                                {gs.error && <p className="text-xs text-red-500 font-medium">{gs.error}</p>}
                                            </div>
                                            <div className="flex items-end gap-2 pb-0.5">
                                                {existingGrade && (
                                                    <button
                                                        onClick={() => { setField(sub.id, "editing", false); setField(sub.id, "points", String(existingGrade.pointsEarned)); }}
                                                        disabled={gs.saving}
                                                        className="px-5 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGrade(sub)}
                                                    disabled={gs.saving || gs.points === ""}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all ${
                                                        gs.saving || gs.points === ""
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            : "bg-[#3C0078] hover:bg-[#2A0054] shadow-lg shadow-[#3C0078]/20"
                                                    }`}
                                                >
                                                    {gs.saving ? <><Loader size={13} className="animate-spin" /> Savingâ€¦</> : <><Check size={14} /> {existingGrade ? "Update" : "Submit Grade"}</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                    { label: "Total Assignments", value: loading ? "â€¦" : totalAssignments, accent: false },
                    { label: "Open", value: loading ? "â€¦" : openCount, accent: true },
                    { label: "Closed", value: loading ? "â€¦" : totalAssignments - openCount, accent: false },
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

// TODO: backend endpoint missing â€” used only by CourseAttendanceView since no AttendanceController exists yet.
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
                attendance: "â€”", // TODO: backend endpoint missing
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
                                <h4 className="text-2xl font-black italic text-gray-900 leading-none">{topStudent ? `${topStudent.avgGradePct}%` : "â€”"}</h4>
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

      {/* Left column â€“ course overview with todo, next class & announcements */}
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
                    Full Term Overview <span>â†’</span>
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
                    Full Term Overview <span>â†’</span>
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

function CourseModulesView({ activeCourseId }) {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Fetch modules from backend on mount and when the active course changes
  useEffect(() => {
    if (!activeCourseId) return;
    let mounted = true;
    setModulesLoading(true);
    getCourseModules(activeCourseId)
      .then(data => { if (mounted) setModules(data); })
      .catch(console.error)
      .finally(() => { if (mounted) setModulesLoading(false); });
    return () => { mounted = false; };
  }, [activeCourseId]);

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [createModuleError, setCreateModuleError] = useState("");
  
  // Section Rename states
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  // Sub-item creation states
  const [addingItemTo, setAddingItemTo] = useState(null); // module ID
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState("document"); // attachment, link, document
  const [isNewItemExternal, setIsNewItemExternal] = useState(true);

  // Sub-item Rename states
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemModuleId, setEditingItemModuleId] = useState(null);
  const [editingItemLabel, setEditingItemLabel] = useState("");

  const toggleModule = (id) => {
    setModules(modules.map(mod => mod.id === id ? { ...mod, isOpen: !mod.isOpen } : mod));
  };

  const areAllCollapsed = modules.every(mod => !mod.isOpen);

  const toggleAll = () => {
    const targetState = areAllCollapsed;
    setModules(modules.map(mod => ({ ...mod, isOpen: targetState })));
  };

  const exportCourseContent = () => {
    alert("Exporting course content... Your download will begin shortly.");
  };

  // Section CRUD Handlers
  const handleAddModule = async () => {
    if (!newModuleTitle.trim() || !activeCourseId) return;
    setIsCreatingModule(true);
    setCreateModuleError("");
    try {
      const created = await createModule({
        courseId: activeCourseId,
        title: newModuleTitle,
        isPublished: true,
        isOpen: true,
      });
      setModules(prev => [...prev, { ...created, items: created.items ?? [] }]);
      setNewModuleTitle("");
      setIsAddingModule(false);
      navigate(`/courses/${activeCourseId}/items/${created.id}`);
    } catch (err) {
      console.error("Failed to create module:", err);
      setCreateModuleError(err.message || "Failed to create module. Please try again.");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const handleRenameModule = async (modId) => {
    if (!editingModuleTitle.trim()) return;
    const mod = modules.find(m => m.id === modId);
    if (!mod) return;
    // Optimistic update
    setModules(prev => prev.map(m => m.id === modId ? { ...m, title: editingModuleTitle } : m));
    setEditingModuleId(null);
    setEditingModuleTitle("");
    try {
      await updateModule(modId, { ...mod, title: editingModuleTitle });
    } catch (err) {
      console.error("Failed to rename module:", err);
      // Revert on failure
      setModules(prev => prev.map(m => m.id === modId ? { ...m, title: mod.title } : m));
    }
  };

  const handleDeleteModule = async (modId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this module section?")) return;
    setModules(prev => prev.filter(m => m.id !== modId));
    try {
      await deleteModule(modId);
    } catch (err) {
      console.error("Failed to delete module:", err);
      // Reload on failure
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleToggleModulePublish = async (modId, e) => {
    e.stopPropagation();
    const mod = modules.find(m => m.id === modId);
    if (!mod) return;
    const next = !mod.isPublished;
    setModules(prev => prev.map(m => m.id === modId ? { ...m, isPublished: next } : m));
    try {
      await updateModule(modId, { ...mod, isPublished: next });
    } catch (err) {
      console.error("Failed to update module publish state:", err);
      setModules(prev => prev.map(m => m.id === modId ? { ...m, isPublished: mod.isPublished } : m));
    }
  };

  // Sub-item CRUD Handlers
  const handleAddItem = async (modId) => {
    if (!newItemLabel.trim()) return;
    try {
      const created = await createModuleItem({
        moduleId: modId,
        label: newItemLabel,
        type: newItemType,
        isPublished: true,
        isExternal: newItemType === "link" ? isNewItemExternal : false,
      });
      setModules(prev => prev.map(mod => {
        if (mod.id === modId) {
          return { ...mod, items: [...(mod.items ?? []), created] };
        }
        return mod;
      }));
      setNewItemLabel("");
      setAddingItemTo(null);
    } catch (err) {
      console.error("Failed to create module item:", err);
    }
  };

  const handleRenameItem = async (modId, itemId) => {
    if (!editingItemLabel.trim()) return;
    const mod = modules.find(m => m.id === modId);
    const item = mod?.items?.find(i => i.id === itemId);
    if (!item) return;
    // Optimistic update
    setModules(prev => prev.map(m => {
      if (m.id === modId) {
        return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, label: editingItemLabel } : i) };
      }
      return m;
    }));
    setEditingItemId(null);
    setEditingItemModuleId(null);
    setEditingItemLabel("");
    try {
      await updateModuleItem(itemId, { ...item, label: editingItemLabel });
    } catch (err) {
      console.error("Failed to rename item:", err);
      setModules(prev => prev.map(m => {
        if (m.id === modId) {
          return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, label: item.label } : i) };
        }
        return m;
      }));
    }
  };

  const handleDeleteItem = async (modId, itemId) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    setModules(prev => prev.map(m => {
      if (m.id === modId) return { ...m, items: m.items.filter(i => i.id !== itemId) };
      return m;
    }));
    try {
      await deleteModuleItem(itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleToggleItemPublish = async (modId, itemId) => {
    const mod = modules.find(m => m.id === modId);
    const item = mod?.items?.find(i => i.id === itemId);
    if (!item) return;
    const next = !item.isPublished;
    setModules(prev => prev.map(m => {
      if (m.id === modId) {
        return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, isPublished: next } : i) };
      }
      return m;
    }));
    try {
      await updateModuleItem(itemId, { ...item, isPublished: next });
    } catch (err) {
      console.error("Failed to toggle item publish:", err);
      setModules(prev => prev.map(m => {
        if (m.id === modId) {
          return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, isPublished: item.isPublished } : i) };
        }
        return m;
      }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 py-6 select-none">
      {/* Loading skeleton */}
      {modulesLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium px-1">
          <Loader size={13} className="animate-spin" />
          <span>Loading modules...</span>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3 shrink-0 px-1">
        <h2 className="text-lg font-black tracking-tight text-gray-900">Course Modules Manager</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingModule(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#3C0078] hover:bg-[#2A0054] text-white rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Plus size={14} />
            <span>Add Module</span>
          </button>
          <button
            onClick={toggleAll}
            className="flex items-center justify-center px-4 py-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            {areAllCollapsed ? "Expand all" : "Collapse all"}
          </button>
          <button
            onClick={exportCourseContent}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Download size={13} />
            <span>Export Content</span>
          </button>
        </div>
      </div>

      {/* Add Module Modal/Form dialog */}
      {isAddingModule && (
        <div className="border border-purple-200/50 bg-[#3C0078]/3 p-5 rounded-2xl flex flex-col gap-3">
          <h4 className="text-xs font-extrabold text-[#3C0078] uppercase tracking-wider">
            Create New Module Section
          </h4>
          <div className="flex gap-3">
            <input
              autoFocus
              type="text"
              placeholder="e.g. Week 2: Design Systems..."
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-[#3C0078]/40 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModule();
                if (e.key === "Escape") { setIsAddingModule(false); setCreateModuleError(""); }
              }}
            />
            <button
              onClick={handleAddModule}
              disabled={isCreatingModule}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#3C0078] hover:bg-[#2A0054] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {isCreatingModule && <Loader size={12} className="animate-spin" />}
              {isCreatingModule ? "Creating..." : "Add Module"}
            </button>
            <button
              onClick={() => { setIsAddingModule(false); setCreateModuleError(""); }}
              disabled={isCreatingModule}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
          {createModuleError && (
            <p className="text-xs text-red-500 font-medium mt-1">{createModuleError}</p>
          )}
        </div>
      )}

      {/* Modules list */}
      <div className="flex flex-col gap-5">
        {modules.map((mod) => (
          <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            {/* Header row */}
            <div 
              onClick={() => navigate(`/courses/${activeCourseId}/items/${mod.id}`)}
              className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-200 cursor-pointer select-none group"
            >
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModule(mod.id);
                  }}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 p-1 hover:bg-gray-200 rounded-md"
                >
                  {mod.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                
                {/* Inline Module Rename Panel */}
                {editingModuleId === mod.id ? (
                  <div className="flex-1 flex items-center gap-2 max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editingModuleTitle}
                      onChange={(e) => setEditingModuleTitle(e.target.value)}
                      className="flex-1 px-3 py-1 text-xs border border-purple-300 rounded-lg outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameModule(mod.id);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <button
                      onClick={() => handleRenameModule(mod.id)}
                      className="px-2.5 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingModuleId(null)}
                      className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    {mod.prefix && (
                      <span className="text-sm font-extrabold text-gray-700 shrink-0">
                        {mod.prefix}
                      </span>
                    )}
                    <h3 className="text-xs font-black tracking-wider text-gray-700 uppercase truncate">
                      {mod.title}
                    </h3>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(mod.id);
                        setEditingModuleTitle(mod.title);
                      }}
                      className="text-[9px] text-[#3C0078] hover:underline font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0"
                    >
                      Rename
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Published Indicator */}
                <div 
                  onClick={(e) => handleToggleModulePublish(mod.id, e)}
                  title={mod.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"}
                  className="flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {mod.isPublished ? (
                    <CheckCircle size={15} className="text-green-500 hover:scale-110 transition-transform" />
                  ) : (
                    <EyeOff size={15} className="text-gray-400 hover:scale-110 transition-transform" />
                  )}
                </div>

                <button
                  onClick={() => setAddingItemTo(mod.id)}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#3C0078] border border-purple-100 hover:bg-[#3C0078]/5 transition-all cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Add Item</span>
                </button>
                
                <button
                  onClick={(e) => handleDeleteModule(mod.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Delete Module"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Add Item form */}
            {addingItemTo === mod.id && (
              <div className="p-4 bg-purple-50/30 border-b border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-[#3C0078] uppercase tracking-wider">
                    Add Module Item
                  </h4>
                  <button 
                    onClick={() => setAddingItemTo(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Item title..."
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="md:col-span-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40 transition-colors"
                  />
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer focus:border-[#3C0078]/40"
                  >
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="attachment">Attachment</option>
                  </select>
                </div>
                {newItemType === "link" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="isExternal"
                      checked={isNewItemExternal}
                      onChange={(e) => setIsNewItemExternal(e.target.checked)}
                      className="rounded border-gray-300 text-[#3C0078] focus:ring-[#3C0078]"
                    />
                    <label htmlFor="isExternal" className="text-[10px] font-bold text-gray-500 cursor-pointer">
                      Open in New Window (External Link)
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => handleAddItem(mod.id)}
                    className="px-4 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#2A0054] transition-all cursor-pointer"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => setAddingItemTo(null)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested items & guidelines editor */}
            {mod.isOpen && (
              <div className="flex flex-col">
                {mod.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50/10">
                    No items in this module section
                  </div>
                ) : (
                  mod.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between py-3.5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors group/item"
                    >
                      <div className="flex-1 flex items-center gap-3.5 min-w-0">
                        {/* Icon based on type */}
                        <span className="text-gray-400 shrink-0">
                          {item.type === "attachment" && <Paperclip size={14} />}
                          {item.type === "document" && <FileText size={14} />}
                          {item.type === "link" && <LinkIcon size={14} />}
                        </span>

                        {/* Inline Item Rename Panel */}
                        {editingItemId === item.id && editingItemModuleId === mod.id ? (
                          <div className="flex items-center gap-2 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={editingItemLabel}
                              onChange={(e) => setEditingItemLabel(e.target.value)}
                              className="flex-1 px-3 py-1 text-xs border border-purple-300 rounded-lg outline-none font-medium"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameItem(mod.id, item.id);
                                if (e.key === "Escape") {
                                  setEditingItemId(null);
                                  setEditingItemModuleId(null);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleRenameItem(mod.id, item.id)}
                              className="px-2.5 py-1 bg-green-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingItemModuleId(null);
                              }}
                              className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Title link or standard text */}
                            {item.type === "link" ? (
                              <a 
                                href="#"
                                onClick={(e) => { e.preventDefault(); alert(`Opening link: ${item.label}`); }}
                                className="text-xs font-bold !text-blue-600 hover:underline flex items-center gap-1.5 min-w-0"
                              >
                                <span className="truncate">{item.label}</span>
                                {item.isExternal && <ExternalLink size={11} className="shrink-0" />}
                              </a>
                            ) : item.type === "document" ? (
                              <span 
                                className="text-xs font-bold text-gray-700 hover:text-[#3C0078] hover:underline truncate cursor-pointer"
                                onClick={() => navigate(`/courses/${activeCourseId}/items/${item.id}`)}
                              >
                                {item.label}
                              </span>
                            ) : (
                              <span 
                                className="text-xs font-bold text-gray-700 truncate cursor-pointer hover:text-gray-900"
                                onClick={() => alert(`Downloading attachment: ${item.label}`)}
                              >
                                {item.label}
                              </span>
                            )}
                            
                            <span 
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditingItemModuleId(mod.id);
                                setEditingItemLabel(item.label);
                              }}
                              className="text-[9px] text-[#3C0078] hover:underline font-bold opacity-0 group-hover/item:opacity-100 transition-opacity ml-1.5 cursor-pointer shrink-0"
                            >
                              Edit
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Publish state */}
                        <div 
                          onClick={() => handleToggleItemPublish(mod.id, item.id)}
                          title={item.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"}
                          className="flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {item.isPublished ? (
                            <CheckCircle size={15} className="text-green-500 hover:scale-110 transition-transform shadow-2xs" />
                          ) : (
                            <EyeOff size={15} className="text-gray-400 hover:scale-110 transition-transform" />
                          )}
                        </div>

                        {/* Remove item button */}
                        <button
                          onClick={() => handleDeleteItem(mod.id, item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-all opacity-0 group-hover/item:opacity-100 cursor-pointer shrink-0"
                          title="Remove Item"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
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
                const data = await getNotes(user?.userId);
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
            {/* Notes sidebar â€” animates width to 0 when expanded */}
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
                                    {/* Bubble menu â€” appears when you select text */}
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
    
    // Module Item detail: /courses/:courseId/items/:itemId
    const isItemDetailPage = pathParts[2] === "items" && pathParts.length === 4;
    const activeItemId = isItemDetailPage ? pathParts[3] : null;
    
    // Home logic: Strictly defined as the base course page
    // We force Home if exactly on the course ID path or if no other specific sub-page is matched below
    const isHomePage = !isGradesPage && !isAnnouncementsPage && !isAssignmentsPage && !isAttendancePage && !isModulesPage && !isNotesPage && !isItemDetailPage;

    // Determine active subpage label for the top breadcrumb bar
    const activeSubpageLabel = React.useMemo(() => {
        if (isGradesPage) return "Grades";
        if (isAnnouncementsPage) return "Announcements";
        if (isAssignmentsPage) return "Assignments";
        if (isAttendancePage) return "Attendance";
        if (isModulesPage) return "Modules";
        if (isNotesPage) return "Notes";
        if (isItemDetailPage) return "Module Page";
        return "Home";
    }, [isGradesPage, isAnnouncementsPage, isAssignmentsPage, isAttendancePage, isModulesPage, isNotesPage, isItemDetailPage]);

    return (
        <div className="flex overflow-hidden gap-4 transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 bg-transparent">
            {/* Left Section: Floating Course Secondary Navigation */}
            <CourseSecondaryNav activeCourseId={activeCourseId || (visibleCourses[0]?.id)} />

            {/* Main Content Area: Floating Island Card */}
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 md:bg-white/75 md:backdrop-blur-xl md:border md:border-white/20 md:rounded-[28px] md:shadow-lg max-md:bg-white">
                {/* Course Header Top Bar */}
                {course && (
                    <div className="h-14 border-b border-gray-100 bg-white/60 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0 select-none">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: course.color }}>
                                {course.code} {course.number}
                            </span>
                            <h2 className="text-sm font-extrabold text-gray-900">{course.subjectName}</h2>
                            <span className="text-gray-300 text-xs">/</span>
                            <span className="text-xs font-bold text-gray-500 capitalize">{activeSubpageLabel}</span>
                        </div>

                        {/* Student View Action Button */}
                        <button
                            onClick={() => navigate(`/courses/${activeCourseId}/items/${activeItemId || "102"}?viewAs=student`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all cursor-pointer shadow-xs hover:border-gray-300"
                        >
                            <Eye size={13} />
                            <span>Student View</span>
                        </button>
                    </div>
                )}

                {/* Scrollable View Content */}
                <div className="flex-1 overflow-y-auto pt-6 px-8 pb-12">
                    {isItemDetailPage ? (
                        <CourseItemView activeCourseId={activeCourseId} activeItemId={activeItemId} isStudentView={false} />
                    ) : isGradesPage ? (
                        <CourseGradesView activeCourseId={activeCourseId} />
                    ) : isAnnouncementsPage ? (
                        <CourseAnnouncementsView activeCourseId={activeCourseId} />
                    ) : isAssignmentsPage ? (
                        <CourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
                    ) : isAttendancePage ? (
                        <CourseAttendanceView />
                    ) : isModulesPage ? (
                        <CourseModulesView activeCourseId={activeCourseId} />
                    ) : isNotesPage ? (
                        <CourseNotesView activeCourseId={activeCourseId} />
                    ) : (
                        <CourseHomeView subject={subject} course={course} loading={loading} />
                    )}
                </div>
            </div>
        </div>
    );
}
