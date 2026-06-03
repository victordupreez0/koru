import React from "react";
import { Plus, X, Eye, EyeOff, Edit2, Trash2, ChevronDown, ChevronRight, FileText, HelpCircle, MessageSquare, Users, ExternalLink, ClipboardList, Check, Loader } from "lucide-react";
import { Folder } from "@solar-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { getCourseAssignments, createAssignment, updateAssignment, deleteAssignment, closeAssignment } from "../../../services/assignmentService";
import { getAssignmentGrades, createGrade, updateGrade, releaseAssignmentGrades } from "../../../services/gradeService";
import { getCourseSubmissions, getAssignmentSubmissions, updateSubmission } from "../../../services/submissionService";
import { getCourseStudentCount } from "../../../services/enrollmentService";
import { useAuth } from "../../../contexts/AuthContext";
import { staggerContainer, slideUp, ASSIGNMENT_TYPES, GRADE_DISPLAY_OPTIONS } from "./constants";

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
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Assignment" : "Create Assignment"}</h2>
                        <p className="text-sm text-gray-400 mt-1">Fill in the details below</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
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
                                            form.type === t.id ? "border-[#3C0078] bg-[#3C0078]/5" : "border-gray-100 hover:border-gray-200 bg-gray-50"
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

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Dates</label>
                        <div className="bg-gray-50 rounded-[28px] p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Opens</label>
                                <input type="datetime-local" value={form.openDate} onChange={e => handleChange("openDate", e.target.value)} className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Due Date</label>
                                <input type="datetime-local" value={form.dueDate} onChange={e => handleChange("dueDate", e.target.value)} className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Closes</label>
                                <input type="datetime-local" value={form.closeDate} onChange={e => handleChange("closeDate", e.target.value)} className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all" />
                            </div>
                        </div>
                    </div>

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
                                                    <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, "correctAnswer", oi)} className="accent-[#3C0078]" />
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

                <div className="px-10 py-6 border-t border-gray-100 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
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

function TeacherSubmissionReview({ assignment, onBack }) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = React.useState([]);
    const [grades, setGrades] = React.useState({});
    const [loading, setLoading] = React.useState(true);
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
                const gradeMap = {};
                gradeList.forEach(g => { gradeMap[g.submissionId] = g; });
                setGrades(gradeMap);
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
            await updateSubmission(sub.id, { assignmentId: sub.assignmentId, studentId: sub.studentId, fileUrl: sub.fileUrl, status: "Graded" }).catch(() => {});
            setGrades(prev => ({ ...prev, [sub.id]: saved }));
            setField(sub.id, "editing", false);
            setField(sub.id, "saving", false);
            setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "Graded" } : s));
        } catch (err) {
            setField(sub.id, "error", err.message || "Failed to save grade.");
            setField(sub.id, "saving", false);
        }
    }

    const maxPts = assignment.points ?? null;

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={slideUp} className="flex items-center gap-3 mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-[#3C0078] transition-colors font-semibold text-sm group">
                    <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Assignments
                </button>
                <span className="text-gray-200">/</span>
                <span className="text-sm text-gray-700 font-semibold truncate max-w-[320px]">{assignment.title}</span>
            </motion.div>

            <motion.div variants={slideUp} className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{assignment.title}</h1>
                    {!loading && (
                        <p className="text-gray-400 text-sm mt-1">
                            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
                            {maxPts != null && <><span className="ml-3 text-gray-300">|</span><span className="ml-3">Max: <strong>{maxPts} pts</strong></span></>}
                        </p>
                    )}
                </div>
                {!loading && submissions.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3 bg-green-50 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Graded</p>
                            <p className="text-xl font-black italic text-green-700">{Object.keys(grades).length}/{submissions.length}</p>
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
                                    {releasing ? "Releasing..." : "Release Grades"}
                                </button>
                            )
                        )}
                    </div>
                )}
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-400 font-medium">Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <motion.div variants={slideUp} className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 text-gray-400 font-medium">
                    No submissions yet for this assignment.
                </motion.div>
            ) : (
                <motion.div variants={staggerContainer} className="space-y-4">
                    {submissions.map(sub => {
                        const studentName = sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : sub.studentId;
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
                            <motion.div key={sub.id} variants={slideUp} className="bg-white border border-gray-100 rounded-[28px] p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0 w-11 h-11 rounded-2xl bg-[#3C0078]/10 flex items-center justify-center">
                                        <span className="text-[#3C0078] font-bold text-sm">
                                            {(sub.student?.firstName?.[0] || "?").toUpperCase()}{(sub.student?.lastName?.[0] || "").toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{studentName}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{studentEmail}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs font-semibold text-gray-500">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</p>
                                        <p className="text-[10px] text-gray-400">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                                    </div>
                                    {sub.fileUrl && !isQuizAnswer && (
                                        <a href={`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api").replace("/api", "")}${sub.fileUrl}`} target="_blank" rel="noreferrer" className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3C0078]/5 text-[#3C0078] text-xs font-bold hover:bg-[#3C0078]/10 transition-colors">
                                            <FileText size={14} /> View File
                                        </a>
                                    )}
                                    {isQuizAnswer && <span className="shrink-0 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold">Quiz Response</span>}
                                    <span className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        sub.status === "Graded" ? "bg-green-100 text-green-700"
                                        : sub.status === "Submitted" || sub.status === "Resubmitted" ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>{sub.status || "Submitted"}</span>
                                </div>

                                <div className="border-t border-gray-50 pt-4">
                                    {existingGrade && !gs.editing ? (
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
                                                        <span className="text-xl font-black italic">{Math.round((existingGrade.pointsEarned / maxPts) * 100)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => setField(sub.id, "editing", true)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-500 hover:border-[#3C0078] hover:text-[#3C0078] transition-all">
                                                <Edit2 size={13} /> Update Grade
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Points Awarded{maxPts != null && ` (out of ${maxPts})`}</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number" min="0" max={maxPts ?? undefined} step="0.5"
                                                        value={gs.points}
                                                        onChange={e => setField(sub.id, "points", e.target.value)}
                                                        placeholder={maxPts != null ? `0 - ${maxPts}` : "Points"}
                                                        disabled={gs.saving}
                                                        className="w-36 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#3C0078] transition-colors disabled:opacity-50"
                                                    />
                                                    {pct !== null && (
                                                        <div className={`px-4 py-3 rounded-2xl font-black italic text-lg min-w-[70px] text-center ${pct >= 75 ? "bg-green-50 text-green-700" : pct >= 50 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"}`}>
                                                            {pct}%
                                                        </div>
                                                    )}
                                                </div>
                                                {gs.error && <p className="text-xs text-red-500 font-medium">{gs.error}</p>}
                                            </div>
                                            <div className="flex items-end gap-2 pb-0.5">
                                                {existingGrade && (
                                                    <button onClick={() => { setField(sub.id, "editing", false); setField(sub.id, "points", String(existingGrade.pointsEarned)); }} disabled={gs.saving} className="px-5 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-400 hover:bg-gray-50 transition-all">
                                                        Cancel
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGrade(sub)}
                                                    disabled={gs.saving || gs.points === ""}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all ${gs.saving || gs.points === "" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#3C0078] hover:bg-[#2A0054] shadow-lg shadow-[#3C0078]/20"}`}
                                                >
                                                    {gs.saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : <><Check size={14} /> {existingGrade ? "Update" : "Submit Grade"}</>}
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
                            const submissionPct = item.totalStudents > 0 ? Math.round((item.submissions / item.totalStudents) * 100) : 0;

                            return (
                                <motion.div key={item.id} layout className="bg-white border border-gray-100 rounded-[28px] px-7 py-5 flex items-center gap-5 hover:shadow-lg hover:border-[#3C0078]/10 transition-all group">
                                    <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-2xl ${typeInfo?.bg || "bg-gray-100"}`}>
                                        <Icon size={18} style={{ color: typeInfo?.color || "#64748B" }} />
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors truncate">{item.title}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{typeInfo?.label}</span>
                                        </div>
                                        <div className="flex items-center gap-5 mt-1.5 text-xs text-gray-400 flex-wrap">
                                            <span>{item.points} pts</span>
                                            {item.openDate && <span className="text-green-600">Opens: {new Date(item.openDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                                            {item.dueDate && <span className="text-orange-500">Due: {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                                            {item.closeDate && <span className="text-red-500">Closes: {new Date(item.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end gap-1 min-w-[90px]">
                                        <span className="text-xs font-bold text-gray-700">{item.submissions}/{item.totalStudents} submitted</span>
                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3C0078] rounded-full transition-all" style={{ width: `${submissionPct}%` }} />
                                        </div>
                                    </div>

                                    <button onClick={() => onView(item)} className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3C0078]/5 text-[#3C0078] font-bold text-[10px] uppercase tracking-widest hover:bg-[#3C0078]/10 transition-all" title="Review submissions">
                                        <Users size={14} /> Review
                                    </button>

                                    <button
                                        onClick={() => onClose(group.id, item.id)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                                            item.isClosed ? "bg-red-50 text-red-600 hover:bg-green-50 hover:text-green-700" : "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
                                        }`}
                                        title={item.isClosed ? "Click to reopen" : "Click to close"}
                                    >
                                        {item.isClosed ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {item.isClosed ? "Closed" : "Open"}
                                    </button>

                                    <button onClick={() => onEdit(group.id, item.id)} className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-[#3C0078] hover:bg-[#3C0078]/10 transition-all opacity-0 group-hover:opacity-100" title="Edit assignment">
                                        <Edit2 size={16} />
                                    </button>

                                    <button onClick={() => onDelete(group.id, item.id)} className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
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

export function CourseAssignmentsView({ subject, activeCourseId }) {
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
            (subs || []).forEach(s => { counts[s.assignmentId] = (counts[s.assignmentId] || 0) + 1; });
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
            setAssignments(prev => prev.map(a => a.id !== assignmentId ? a : { ...a, isClosed: result.isClosed }));
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
        : groups.map(g => ({ ...g, assignments: g.assignments.filter(a => a.type === activeTypeFilter) })).filter(g => g.assignments.length > 0);

    if (reviewingAssignment) {
        return <TeacherSubmissionReview assignment={reviewingAssignment} onBack={() => setReviewingAssignment(null)} />;
    }

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
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

            <motion.div variants={slideUp} className="grid grid-cols-3 gap-4 mb-10">
                {[
                    { label: "Total Assignments", value: loading ? "..." : totalAssignments, accent: false },
                    { label: "Open", value: loading ? "..." : openCount, accent: true },
                    { label: "Closed", value: loading ? "..." : totalAssignments - openCount, accent: false },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-[28px] px-7 py-6 flex flex-col gap-1 ${stat.accent ? "bg-[#3C0078] text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${stat.accent ? "text-white/60" : "text-gray-400"}`}>{stat.label}</span>
                        <span className={`text-4xl font-black italic ${stat.accent ? "text-white" : "text-gray-900"}`}>{stat.value}</span>
                    </div>
                ))}
            </motion.div>

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
                                className={`flex flex-col items-start gap-3 p-5 rounded-[24px] border-2 text-left transition-all ${isActive ? "border-[#3C0078] bg-[#3C0078]/5 shadow-md" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}
                            >
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${t.bg}`}>
                                    <Icon size={20} style={{ color: t.color }} />
                                </span>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isActive ? "text-[#3C0078]" : "text-gray-500"}`}>{t.label}</p>
                                    <p className="text-2xl font-black italic text-gray-900 mt-1">{count}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {activeTypeFilter !== "all" && (
                <motion.div variants={slideUp} className="mb-6 flex items-center gap-3">
                    <span className="text-sm text-gray-500">Filtering by:</span>
                    <button onClick={() => setActiveTypeFilter("all")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3C0078]/10 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078]/20 transition-all">
                        {ASSIGNMENT_TYPES.find(t => t.id === activeTypeFilter)?.label}
                        <X size={14} />
                    </button>
                </motion.div>
            )}

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
                            onTogglePublish={() => {}}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onClose={handleClose}
                            onView={(item) => setReviewingAssignment(item)}
                        />
                    ))
                )}
            </motion.div>

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
