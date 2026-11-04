import React from "react";
import { Plus, X, Eye, EyeOff, Edit2, Trash2, ChevronDown, ChevronRight, FileText, HelpCircle, MessageSquare, Users, ExternalLink, ClipboardList, Check, Loader, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCourseAssignments, createAssignment, updateAssignment, deleteAssignment, closeAssignment } from "../../../services/assignmentService";
import { getAssignmentGrades, createGrade, updateGrade, releaseAssignmentGrades } from "../../../services/gradeService";
import { getCourseSubmissions, getAssignmentSubmissions, updateSubmission } from "../../../services/submissionService";
import { getCourseStudentCount } from "../../../services/enrollmentService";
import { getCourseCohorts, getCourseStudents } from "../../../services/classGroupService";
import { useAuth } from "../../../contexts/AuthContext";
import CohortFilterBar from "../../../components/CohortFilterBar";
import { Badge, Button, Card, EmptyState, Skeleton } from "../../../components/UI";
import { staggerContainer, slideUp, ASSIGNMENT_TYPES, GRADE_DISPLAY_OPTIONS, EXTERNAL_TOOLS } from "./constants";

function AssignmentTypeIcon({ type, size = 18 }) {
    const found = ASSIGNMENT_TYPES.find(t => t.id === type);
    if (!found) return null;
    const Icon = found.icon;
    return (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-koru-md ${found.bg}`} title={found.label}>
            <Icon size={size} style={{ color: found.color }} />
        </span>
    );
}

function CreateAssignmentDrawer({ onClose, onSave, initialData, cohorts = [], defaultGroupId = null }) {
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
        externalToolName: initialData?.externalToolName ?? "",
        externalToolUrl: initialData?.externalToolUrl ?? "",
        id: initialData?.id ?? null,
        submissions: initialData?.submissions ?? 0,
        totalStudents: initialData?.totalStudents ?? 0,
        classGroupId: initialData?.classGroupId ?? defaultGroupId ?? null,
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
            classGroupId: form.classGroupId || null,
            quizQuestionsJson: form.type === "quiz" && quizQuestions.length > 0 ? JSON.stringify(quizQuestions) : null,
            externalToolName: form.type === "external" ? (form.externalToolName || null) : null,
            externalToolUrl: form.type === "external" ? (form.externalToolUrl || null) : null,
        };
        onSave(payload);
    };

    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-full max-w-xl bg-koru-surface-container-lowest border border-koru-outline-faint rounded-koru-3xl shadow-koru-xs flex flex-col overflow-hidden h-full shrink-0"
        >
            <div className="flex justify-between items-center px-8 py-6 border-b border-koru-outline-faint shrink-0">
                <div>
                    <h2 className="font-display text-koru-title text-koru-on-surface">{isEditing ? "Edit Assignment" : "Create Assignment"}</h2>
                    <p className="text-sm text-koru-on-surface-variant mt-1">Fill in the details below</p>
                </div>
                <Button variant="text" size="icon" onClick={onClose} aria-label="Close" className="!text-koru-on-surface-variant">
                    <X size={22} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                    {cohorts.length > 0 && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Assign To</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleChange("classGroupId", null)}
                                    type="button"
                                    aria-pressed={form.classGroupId === null}
                                    className={`rounded-koru-sm border px-4 py-2 text-xs font-medium transition-colors duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                        form.classGroupId === null
                                            ? "bg-koru-primary text-koru-on-primary border-koru-primary"
                                            : "border-koru-outline-variant bg-koru-surface-container-lowest text-koru-on-surface-variant hover:bg-koru-surface-container-low"
                                    }`}
                                >
                                    All Groups
                                </button>
                                {cohorts.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleChange("classGroupId", c.id)}
                                        type="button"
                                        aria-pressed={form.classGroupId === c.id}
                                        className={`rounded-koru-sm border px-4 py-2 text-xs font-medium transition-colors duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                            form.classGroupId === c.id
                                                ? "bg-koru-primary text-koru-on-primary border-koru-primary"
                                                : "border-koru-outline-variant bg-koru-surface-container-lowest text-koru-on-surface-variant hover:bg-koru-surface-container-low"
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Assignment Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {ASSIGNMENT_TYPES.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        aria-pressed={form.type === t.id}
                                        onClick={() => handleChange("type", t.id)}
                                        className={`flex flex-col items-center gap-2 rounded-koru-md p-3 text-center transition duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                            form.type === t.id ? "bg-koru-primary/5 ring-2 ring-inset ring-koru-primary" : "bg-koru-surface-container-low ring-1 ring-inset ring-koru-outline-faint hover:ring-koru-outline-variant"
                                        }`}
                                    >
                                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-koru-md ${t.bg}`}>
                                            <Icon size={18} style={{ color: t.color }} />
                                        </span>
                                        <span className={`text-[10px] font-bold leading-tight ${form.type === t.id ? "text-koru-primary" : "text-koru-on-surface-variant"}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Title</label>
                        <input
                            type="text"
                            placeholder="Assignment title..."
                            value={form.title}
                            onChange={e => handleChange("title", e.target.value)}
                            className="w-full bg-koru-surface-container-low rounded-koru-xs px-5 py-4 text-koru-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Instructions / Description</label>
                        <textarea
                            rows={4}
                            placeholder="Write the assignment instructions here..."
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            className="w-full bg-koru-surface-container-low rounded-koru-xs px-5 py-4 text-koru-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-transparent transition-all resize-none leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Points</label>
                            <input
                                type="number"
                                min={0}
                                value={form.points}
                                onChange={e => handleChange("points", parseInt(e.target.value) || 0)}
                                className="w-full bg-koru-surface-container-low rounded-koru-xs px-5 py-4 text-koru-on-surface font-bold text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Grade Display</label>
                            <select
                                value={form.gradeDisplay}
                                onChange={e => handleChange("gradeDisplay", e.target.value)}
                                className="w-full bg-koru-surface-container-low rounded-koru-xs px-5 py-4 text-koru-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-transparent transition-all appearance-none"
                            >
                                {GRADE_DISPLAY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-koru-surface-container-low rounded-koru-lg px-5 py-4">
                        <div>
                            <p className="text-koru-caption font-medium text-koru-on-surface-variant">Allow Multiple Attempts</p>
                            <p className="text-xs text-koru-on-surface-variant mt-0.5">Students can resubmit until closed</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={form.allowMultipleAttempts}
                            aria-label="Allow multiple attempts"
                            onClick={() => handleChange("allowMultipleAttempts", !form.allowMultipleAttempts)}
                            className={`flex h-6 w-12 items-center rounded-full px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 ${form.allowMultipleAttempts ? "bg-koru-primary" : "bg-koru-outline-variant"}`}
                        >
                            <span className={`w-5 h-5 bg-koru-surface-container-lowest rounded-full shadow-koru-xs transition-transform ${form.allowMultipleAttempts ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>

                    <div>
                        <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Dates</label>
                        <div className="bg-koru-surface-container-low rounded-koru-3xl p-6 space-y-4">
                            <div>
                                <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Opens</label>
                                <input type="datetime-local" value={form.openDate} onChange={e => handleChange("openDate", e.target.value)} className="w-full bg-koru-surface-container-lowest rounded-koru-xs px-5 py-3 text-koru-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-koru-outline-faint transition-all" />
                            </div>
                            <div>
                                <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Due Date</label>
                                <input type="datetime-local" value={form.dueDate} onChange={e => handleChange("dueDate", e.target.value)} className="w-full bg-koru-surface-container-lowest rounded-koru-xs px-5 py-3 text-koru-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-koru-outline-faint transition-all" />
                            </div>
                            <div>
                                <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Closes</label>
                                <input type="datetime-local" value={form.closeDate} onChange={e => handleChange("closeDate", e.target.value)} className="w-full bg-koru-surface-container-lowest rounded-koru-xs px-5 py-3 text-koru-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-koru-primary/20 border border-koru-outline-faint transition-all" />
                            </div>
                        </div>
                    </div>

                    {form.type === "external" && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">External Tool</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {EXTERNAL_TOOLS.map(tool => (
                                    <button
                                        key={tool.id}
                                        type="button"
                                        onClick={() => {
                                            handleChange("externalToolName", tool.name);
                                            if (!form.externalToolUrl) handleChange("externalToolUrl", tool.baseUrl);
                                        }}
                                        aria-pressed={form.externalToolName === tool.name}
                                        className={`flex items-center gap-3 rounded-koru-md p-4 text-left transition duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                            form.externalToolName === tool.name
                                                ? "bg-koru-info/5 ring-2 ring-inset ring-koru-info"
                                                : "bg-koru-surface-container-low ring-1 ring-inset ring-koru-outline-faint hover:ring-koru-outline-variant"
                                        }`}
                                    >
                                        <span
                                            className={`w-10 h-10 rounded-koru-md ${tool.bg} flex items-center justify-center text-base font-semibold shrink-0`}
                                            style={{ color: tool.color }}
                                        >
                                            {tool.icon}
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`text-xs font-bold leading-tight truncate ${
                                                form.externalToolName === tool.name ? "text-koru-info" : "text-koru-on-surface-variant"
                                            }`}>{tool.name}</p>
                                            <p className="text-[10px] text-koru-on-surface-variant leading-tight mt-0.5">{tool.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-2 block">Tool URL / Launch Link</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={form.externalToolUrl}
                                onChange={e => handleChange("externalToolUrl", e.target.value)}
                                className="w-full bg-koru-surface-container-low rounded-koru-xs px-5 py-4 text-koru-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-koru-info/20 border border-transparent transition-all"
                            />
                        </div>
                    )}

                    {form.type === "quiz" && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-koru-caption font-medium text-koru-on-surface-variant">Quiz Questions</label>
                                <Button variant="tonal" size="sm" onClick={addQuestion} startIcon={<Plus size={14} />}>
                                    Add Question
                                </Button>
                            </div>
                            {quizQuestions.length === 0 && (
                                <p className="text-xs text-koru-on-surface-variant bg-koru-surface-container-low rounded-koru-lg px-5 py-4">No questions yet. Click "Add Question" to begin.</p>
                            )}
                            <div className="space-y-4">
                                {quizQuestions.map((q, qi) => (
                                    <div key={qi} className="bg-koru-surface-container-low rounded-koru-2xl p-5 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-koru-accent-soft text-[10px] font-semibold text-koru-accent-ink">{qi + 1}</span>
                                            <input
                                                type="text"
                                                placeholder="Question text..."
                                                value={q.question}
                                                onChange={e => updateQuestion(qi, "question", e.target.value)}
                                                className="flex-1 bg-koru-surface-container-lowest rounded-koru-xs px-4 py-2 text-sm text-koru-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-koru-accent/20 border border-koru-outline-faint"
                                            />
                                            <Button variant="text" size="icon" onClick={() => removeQuestion(qi)} aria-label={`Remove question ${qi + 1}`} className="!h-8 !w-8 !text-koru-outline hover:!bg-koru-error-container hover:!text-koru-error">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                        <div className="space-y-2 pl-9">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, "correctAnswer", oi)} className="accent-koru-primary" />
                                                    <input
                                                        type="text"
                                                        placeholder={`Option ${oi + 1}...`}
                                                        value={opt}
                                                        onChange={e => updateOption(qi, oi, e.target.value)}
                                                        className="flex-1 bg-koru-surface-container-lowest rounded-koru-xs px-4 py-2 text-sm text-koru-on-surface-variant focus:outline-none focus:ring-2 focus:ring-koru-primary/10 border border-koru-outline-faint"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-koru-on-surface-variant pl-9">Select the radio button next to the correct answer</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-koru-outline-faint flex gap-3 shrink-0">
                    <Button variant="outlined" size="lg" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button size="lg" onClick={handleSubmit} startIcon={<Eye size={16} />} className="flex-1">
                        {isEditing ? "Save Changes" : "Publish"}
                    </Button>
                </div>
        </motion.div>
    );
}

function SubmissionFileViewer({ submission }) {
    const [blobUrl, setBlobUrl] = React.useState(null);
    const [fileError, setFileError] = React.useState(false);
    const [fileLoading, setFileLoading] = React.useState(true);
    const fileUrl = submission?.fileUrl || "";

    const fileExt = React.useMemo(() => {
        try {
            const path = fileUrl.startsWith("http") ? new URL(fileUrl).pathname : fileUrl;
            return path.split(".").pop()?.toLowerCase() || "";
        } catch { return ""; }
    }, [fileUrl]);

    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(fileExt);
    const isPdf = fileExt === "pdf";
    const isVideo = ["mp4", "mov", "webm"].includes(fileExt);
    const isAudio = ["mp3", "wav", "ogg"].includes(fileExt);

    React.useEffect(() => {
        if (!fileUrl) { setFileLoading(false); return; }
        let revoke = null;

        if (fileUrl.startsWith("http")) {
            if (isImage) {
                setBlobUrl(fileUrl);
                setFileLoading(false);
                return;
            }
        }

        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";
        setFileLoading(true);
        setFileError(false);
        fetch(`${API_BASE}/Submission/${submission.id}/file`)
            .then(res => {
                if (!res.ok) throw new Error(`${res.status}`);
                return res.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                revoke = url;
                setBlobUrl(url);
            })
            .catch(() => {
                if (fileUrl.startsWith("http")) {
                    setBlobUrl(fileUrl);
                } else {
                    setFileError(true);
                }
            })
            .finally(() => setFileLoading(false));

        return () => { if (revoke) URL.revokeObjectURL(revoke); };
    }, [submission.id, fileUrl, isImage, isPdf]);

    if (!fileUrl) return (
        <EmptyState size="sm" icon={<FileText size={24} />} title="No file submitted" className="h-64" />
    );

    if (fileLoading) return (
        <Skeleton className="h-64 rounded-koru-lg" />
    );

    if (fileError) return (
        <div className="flex flex-col items-center justify-center h-64 bg-koru-surface-container-low rounded-koru-2xl border border-koru-outline-faint gap-3">
            <FileText size={28} className="text-koru-outline" />
            <p className="text-sm text-koru-on-surface-variant font-medium">Unable to load file preview</p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium !text-koru-primary hover:underline">Try opening directly</a>
        </div>
    );

    if (isPdf) return (
        <iframe src={blobUrl} className="w-full h-[600px] rounded-koru-2xl border border-koru-outline-faint" title="Submission PDF" />
    );
    if (isImage) return (
        <div className="flex items-center justify-center bg-koru-surface-container-low rounded-koru-2xl border border-koru-outline-faint p-4 min-h-[300px]">
            <img src={blobUrl} alt="Submission" className="max-w-full max-h-[550px] rounded-koru-lg object-contain" />
        </div>
    );
    if (isVideo) return (
        <video src={blobUrl} controls className="w-full rounded-koru-2xl border border-koru-outline-faint max-h-[500px]" />
    );
    if (isAudio) return (
        <div className="flex items-center justify-center bg-koru-surface-container-low rounded-koru-2xl border border-koru-outline-faint p-8">
            <audio src={blobUrl} controls className="w-full" />
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center h-64 bg-koru-surface-container-low rounded-koru-2xl border border-koru-outline-faint gap-3">
            <FileText size={28} className="text-koru-outline" />
            <p className="text-sm text-koru-on-surface-variant font-medium">{fileExt.toUpperCase()} file</p>
            <a href={blobUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-koru-pill bg-koru-secondary-container px-3 text-xs font-medium !text-koru-on-secondary-container transition-colors hover:bg-koru-secondary-container/80">
                Download File
            </a>
        </div>
    );
}

function TeacherSubmissionReview({
    assignment,
    onBack,
    cohorts = [],
    studentCohortMap = {},
    selectedCohortId: initialCohortId = null,
    onCohortChange
}) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = React.useState([]);
    const [grades, setGrades] = React.useState({});
    const [selectedCohortId, setSelectedCohortId] = React.useState(initialCohortId);

    const handleCohortChange = (id) => {
        setSelectedCohortId(id);
        onCohortChange?.(id);
    };
    const [loading, setLoading] = React.useState(true);
    const [gradingState, setGradingState] = React.useState({});
    const [releasing, setReleasing] = React.useState(false);
    const [selectedSub, setSelectedSub] = React.useState(null);

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

    // Filter submissions by selected cohort
    const visibleSubmissions = React.useMemo(() => {
        if (!selectedCohortId) return submissions;
        return submissions.filter(s => s.student && studentCohortMap[s.student.id] === selectedCohortId);
    }, [submissions, selectedCohortId, studentCohortMap]);

    const isQuizAnswer = (sub) => {
        try {
            if (!sub.fileUrl) return false;
            const parsed = JSON.parse(sub.fileUrl);
            return typeof parsed === "object" && !Array.isArray(parsed);
        } catch { return false; }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="shrink-0 px-8 pt-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <button type="button" onClick={onBack} className="group flex items-center gap-2 rounded-koru-pill text-sm font-medium text-koru-on-surface-variant transition-colors hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus">
                        <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Assignments
                    </button>
                    <span className="text-koru-outline-variant">/</span>
                    <span className="text-sm text-koru-on-surface-variant font-semibold truncate max-w-[320px]">{assignment.title}</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="font-display text-koru-title text-koru-on-surface">{assignment.title}</h1>
                        {!loading && (
                            <p className="text-koru-on-surface-variant text-sm mt-1">
                                {visibleSubmissions.length} submission{visibleSubmissions.length !== 1 ? "s" : ""}
                                {maxPts != null && <><span className="ml-3 text-koru-outline">|</span><span className="ml-3">Max: <strong>{maxPts} pts</strong></span></>}
                            </p>
                        )}
                        <div className="mt-3">
                            <CohortFilterBar cohorts={cohorts} selected={selectedCohortId} onChange={handleCohortChange} />
                        </div>
                    </div>
                    {!loading && visibleSubmissions.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-koru-success-soft rounded-koru-lg text-center">
                                <p className="text-koru-caption font-medium text-koru-success">Graded</p>
                                <p className="text-lg font-display font-medium tabular-nums text-koru-success">
                                    {visibleSubmissions.filter(s => grades[s.id]).length}/{visibleSubmissions.length}
                                </p>
                            </div>
                            {Object.keys(grades).length > 0 && (
                                Object.values(grades).every(g => g.isReleased) ? (
                                    <Badge variant="primary" size="md">
                                        <Check size={14} /> Released
                                    </Badge>
                                ) : (
                                    <Button onClick={handleRelease} loading={releasing}>
                                        {releasing ? "Releasing..." : "Release Grades"}
                                    </Button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div role="status" className="flex flex-1 items-center justify-center text-koru-body text-koru-on-surface-variant">Loading submissions...</div>
            ) : visibleSubmissions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-8 pb-8">
                    <EmptyState icon={<Users size={24} />} title="No submissions found for this group." className="w-full" />
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden border-t border-koru-outline-faint mt-2">
                    {/* Left — Student list */}
                    <div className="w-[340px] shrink-0 overflow-y-auto border-r border-koru-outline-faint bg-koru-surface-container-low/30">
                        <div className="p-4 space-y-1">
                            {visibleSubmissions.map(sub => {
                                const studentName = sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : sub.studentId;
                                const isSelected = selectedSub?.id === sub.id;
                                const existingGrade = grades[sub.id];
                                const isQuiz = isQuizAnswer(sub);

                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setSelectedSub(sub)}
                                        className={`flex w-full items-center gap-3 rounded-koru-md px-4 py-3 text-left transition duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                                            isSelected
                                                ? "bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
                                                : "hover:bg-koru-surface-container-lowest/60"
                                        }`}
                                    >
                                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                            isSelected ? "bg-koru-primary text-koru-on-primary" : "bg-koru-primary/5 border-2 border-koru-primary/10 text-koru-primary"
                                        }`}>
                                            {(sub.student?.firstName?.[0] || "?").toUpperCase()}{(sub.student?.lastName?.[0] || "").toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${isSelected ? "text-koru-primary" : "text-koru-on-surface"}`}>{studentName}</p>
                                            <p className="text-[10px] text-koru-on-surface-variant mt-0.5">
                                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                            <Badge variant={sub.status === "Graded" ? "success" : sub.status === "Late" ? "warning" : "info"}>{sub.status || "Submitted"}</Badge>
                                            {existingGrade && maxPts != null && (
                                                <span className="text-[10px] font-bold text-koru-on-surface-variant">{existingGrade.pointsEarned}/{maxPts}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right — File viewer + grading */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {selectedSub ? (
                                <motion.div
                                    key={selectedSub.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }}
                                    exit={{ opacity: 0, x: 20, transition: { duration: 0.15, ease: "easeIn" } }}
                                    className="p-6 space-y-6"
                                >
                                    {/* Student header */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-full bg-koru-primary flex items-center justify-center">
                                            <span className="text-koru-on-primary font-bold text-sm">
                                                {(selectedSub.student?.firstName?.[0] || "?").toUpperCase()}{(selectedSub.student?.lastName?.[0] || "").toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-koru-on-surface">{selectedSub.student ? `${selectedSub.student.firstName} ${selectedSub.student.lastName}` : selectedSub.studentId}</p>
                                            <p className="text-xs text-koru-on-surface-variant">{selectedSub.student?.email || ""}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-koru-on-surface-variant">{selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                                            <p className="text-[10px] text-koru-on-surface-variant">{selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                                        </div>
                                        <Badge
                                            size="md"
                                            variant={
                                                selectedSub.status === "Graded" ? "success"
                                                : selectedSub.status === "Late" ? "warning"
                                                : selectedSub.status === "Submitted" || selectedSub.status === "Resubmitted" ? "info"
                                                : "neutral"
                                            }
                                        >{selectedSub.status || "Submitted"}</Badge>
                                    </div>

                                    {/* File viewer */}
                                    {isQuizAnswer(selectedSub) ? (
                                        <div className="bg-koru-warning-soft rounded-koru-2xl border border-koru-warning/30 p-6">
                                            <p className="text-sm font-bold text-koru-warning mb-3">Quiz Response</p>
                                            <pre className="text-xs text-koru-on-surface-variant whitespace-pre-wrap overflow-auto max-h-96">{(() => {
                                                try { return JSON.stringify(JSON.parse(selectedSub.fileUrl), null, 2); } catch { return selectedSub.fileUrl; }
                                            })()}</pre>
                                        </div>
                                    ) : (
                                        <SubmissionFileViewer submission={selectedSub} />
                                    )}

                                    {/* Grading section */}
                                    {(() => {
                                        const existingGrade = grades[selectedSub.id];
                                        const gs = gradingState[selectedSub.id] || { points: "", saving: false, error: null, editing: false };
                                        const ptsVal = parseFloat(gs.points);
                                        const pct = maxPts && !isNaN(ptsVal) ? Math.round((ptsVal / maxPts) * 100) : null;

                                        return (
                                            <Card variant="outlined" tone="low" padding="lg">
                                                <h3 className="mb-4 text-koru-caption font-medium text-koru-on-surface-variant">Grade</h3>
                                                {existingGrade && !gs.editing ? (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-3xl font-display font-medium tabular-nums text-koru-on-surface">
                                                                {existingGrade.pointsEarned}{maxPts != null && <span className="text-base font-normal text-koru-on-surface-variant">/{maxPts} pts</span>}
                                                            </span>
                                                            {maxPts != null && (
                                                                <div className="px-4 py-2 rounded-koru-lg bg-koru-primary text-koru-on-primary">
                                                                    <span className="text-lg font-display font-medium tabular-nums">{Math.round((existingGrade.pointsEarned / maxPts) * 100)}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button variant="outlined" onClick={() => setField(selectedSub.id, "editing", true)} startIcon={<Edit2 size={13} />}>
                                                            Update
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-end gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <label htmlFor={`grade-points-${selectedSub.id}`} className="text-koru-label text-koru-on-surface-variant">Points{maxPts != null && ` (out of ${maxPts})`}</label>
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    id={`grade-points-${selectedSub.id}`}
                                                                    type="number" min="0" max={maxPts ?? undefined} step="0.5"
                                                                    value={gs.points}
                                                                    onChange={e => setField(selectedSub.id, "points", e.target.value)}
                                                                    placeholder={maxPts != null ? `0 – ${maxPts}` : "Points"}
                                                                    disabled={gs.saving}
                                                                    className="h-12 w-32 rounded-koru-xs bg-koru-surface-container-lowest px-4 text-sm font-medium text-koru-on-surface shadow-koru-xs outline-none ring-1 ring-inset ring-koru-outline-variant transition focus:ring-koru-primary disabled:opacity-50"
                                                                />
                                                                {pct !== null && (
                                                                    <div className={`px-4 py-3 rounded-koru-lg font-display font-medium tabular-nums text-lg min-w-[65px] text-center ${pct >= 75 ? "bg-koru-success-soft text-koru-success" : pct >= 50 ? "bg-koru-warning-soft text-koru-warning" : "bg-koru-error-container text-koru-error"}`}>
                                                                        {pct}%
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {gs.error && <p role="alert" className="text-xs font-medium text-koru-error">{gs.error}</p>}
                                                        </div>
                                                        <div className="flex gap-2 pb-0.5">
                                                            {existingGrade && (
                                                                <Button variant="text" size="lg" onClick={() => { setField(selectedSub.id, "editing", false); setField(selectedSub.id, "points", String(existingGrade.pointsEarned)); }} disabled={gs.saving}>
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="lg"
                                                                onClick={() => handleGrade(selectedSub)}
                                                                disabled={gs.saving || gs.points === ""}
                                                            >
                                                                {gs.saving ? <><Loader size={13} className="animate-spin" /> Saving...</> : <><Check size={14} /> {existingGrade ? "Update" : "Submit Grade"}</>}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })()}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex h-full items-center justify-center p-6"
                                >
                                    <EmptyState size="sm" tone="secondary" icon={<Users size={24} />} title="Select a student to review their submission" className="w-full" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssignmentPreviewDrawer({ assignment, onClose }) {
    const typeInfo = ASSIGNMENT_TYPES.find(t => t.id === assignment.type);
    const Icon = typeInfo?.icon || FileText;

    const quizQuestions = React.useMemo(() => {
        if (assignment.type !== "quiz" || !assignment.quizQuestionsJson) return [];
        try { return JSON.parse(assignment.quizQuestionsJson); } catch { return []; }
    }, [assignment]);

    const externalTool = assignment.externalToolName
        ? EXTERNAL_TOOLS.find(t => t.name === assignment.externalToolName)
        : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-koru-scrim backdrop-blur-sm z-[100]"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                role="dialog"
                aria-modal="true"
                aria-label="Assignment preview"
                className="fixed bottom-0 right-0 top-0 z-[101] flex w-full max-w-xl flex-col overflow-hidden rounded-l-koru-3xl bg-koru-surface-container-lowest shadow-koru-lg"
            >
                <div className="flex justify-between items-center px-10 py-8 border-b border-koru-outline-faint shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="font-display text-koru-title text-koru-on-surface">Assignment Preview</h2>
                            <Badge variant="primary">Student View</Badge>
                        </div>
                        <p className="text-sm text-koru-on-surface-variant">This is what students see</p>
                    </div>
                    <Button variant="text" size="icon" onClick={onClose} aria-label="Close preview" className="!text-koru-on-surface-variant">
                        <X size={22} />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-7">
                    <Card tone="brand" radius="lg" padding="lg">
                        <div className="flex items-start gap-4">
                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-koru-lg ${typeInfo?.bg || "bg-koru-surface-container-high"} shrink-0`}>
                                <Icon size={22} style={{ color: typeInfo?.color || "var(--color-koru-on-surface-variant)" }} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-display text-xl font-medium leading-tight text-koru-on-surface">{assignment.title}</h1>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-koru-caption font-medium text-koru-on-surface-variant">{typeInfo?.label}</span>
                                    {assignment.points != null && (
                                        <span className="text-koru-caption font-medium text-koru-primary">{assignment.points} pts</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {(assignment.openDate || assignment.dueDate || assignment.closeDate) && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Timeline</label>
                            <div className="bg-koru-surface-container-low rounded-koru-2xl p-5 space-y-3">
                                {assignment.openDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-koru-on-surface-variant">Opens</span>
                                        <span className="text-xs text-koru-success font-semibold">{new Date(assignment.openDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                )}
                                {assignment.dueDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-koru-on-surface-variant">Due Date</span>
                                        <span className="text-xs text-koru-warning font-semibold">{new Date(assignment.dueDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                )}
                                {assignment.closeDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-koru-on-surface-variant">Closes</span>
                                        <span className="text-xs text-koru-error font-semibold">{new Date(assignment.closeDate).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {assignment.description && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Instructions</label>
                            <div className="bg-koru-surface-container-low rounded-koru-2xl p-5 text-sm text-koru-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                {assignment.description}
                            </div>
                        </div>
                    )}

                    {assignment.type === "external" && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">External Tool</label>
                            {assignment.externalToolName || assignment.externalToolUrl ? (
                                <div className="bg-koru-surface-container-low rounded-koru-2xl p-5 flex items-center gap-4">
                                    {externalTool ? (
                                        <span
                                            className={`w-12 h-12 rounded-koru-lg ${externalTool.bg} flex items-center justify-center text-lg font-semibold shrink-0`}
                                            style={{ color: externalTool.color }}
                                        >
                                            {externalTool.icon}
                                        </span>
                                    ) : (
                                        <span className="w-12 h-12 rounded-koru-lg bg-koru-info/10 flex items-center justify-center shrink-0">
                                            <ExternalLink size={20} className="text-koru-info" />
                                        </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-koru-on-surface">{assignment.externalToolName || "External Tool"}</p>
                                        {assignment.externalToolUrl && (
                                            <p className="text-xs text-koru-on-surface-variant truncate mt-0.5">{assignment.externalToolUrl}</p>
                                        )}
                                    </div>
                                    {assignment.externalToolUrl && (
                                        <a
                                            href={assignment.externalToolUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-koru-pill bg-koru-info-soft px-3 text-xs font-medium !text-koru-info transition-colors hover:bg-koru-info-soft/70"
                                        >
                                            <ExternalLink size={13} /> Launch
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-koru-on-surface-variant bg-koru-surface-container-low rounded-koru-lg px-5 py-4">No external tool configured.</p>
                            )}
                        </div>
                    )}

                    {assignment.type === "quiz" && quizQuestions.length > 0 && (
                        <div>
                            <label className="text-koru-caption font-medium text-koru-on-surface-variant mb-3 block">Quiz Questions ({quizQuestions.length})</label>
                            <div className="space-y-4">
                                {quizQuestions.map((q, qi) => (
                                    <div key={qi} className="bg-koru-surface-container-low rounded-koru-2xl p-5 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-koru-accent-soft text-[10px] font-semibold text-koru-accent-ink">{qi + 1}</span>
                                            <p className="text-sm text-koru-on-surface font-semibold flex-1">{q.question || <span className="text-koru-on-surface-variant italic">No question text</span>}</p>
                                        </div>
                                        <div className="space-y-2 pl-9">
                                            {q.options?.map((opt, oi) => (
                                                <div key={oi} className={`flex items-center gap-2 px-4 py-2 rounded-koru-md text-sm ${
                                                    q.correctAnswer === oi ? "bg-koru-success-soft text-koru-success font-semibold" : "bg-koru-surface-container-lowest text-koru-on-surface-variant"
                                                }`}>
                                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                        q.correctAnswer === oi ? "border-koru-success bg-koru-success" : "border-koru-outline-variant"
                                                    }`}>
                                                        {q.correctAnswer === oi && <span className="w-2 h-2 rounded-full bg-koru-surface-container-lowest" />}
                                                    </span>
                                                    {opt || <span className="text-koru-on-surface-variant italic">Empty option</span>}
                                                    {q.correctAnswer === oi && <span className="ml-auto text-koru-caption font-medium text-koru-success">Correct</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 border-t border-koru-outline-faint shrink-0">
                    <Button variant="outlined" size="lg" fullWidth onClick={onClose}>
                        Close Preview
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function AssignmentGroupRow({ group, onTogglePublish, onDelete, onEdit, onClose, onView, onPreview }) {
    const [expanded, setExpanded] = React.useState(true);

    return (
        <motion.div variants={slideUp} className="mb-6">
            <div
                className="flex items-center justify-between px-6 py-4 bg-koru-surface-container-low rounded-koru-2xl cursor-pointer hover:bg-koru-surface-container-high transition-colors mb-3"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-4">
                    <span className="text-koru-on-surface-variant transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>
                        <ChevronDown size={18} />
                    </span>
                    <span className="font-display text-koru-heading text-koru-on-surface">{group.name}</span>
                    <Badge>{group.weight}% of grade</Badge>
                    <span className="text-[10px] text-koru-on-surface-variant font-medium">
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
                        className="overflow-hidden"
                    >
                        <Card variant="outlined" tone="low" padding="none" className="mt-3 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-koru-outline-faint bg-koru-surface-container-low/30">
                                        <th className="px-6 py-4 text-xs font-medium text-koru-on-surface-variant">Assignment</th>
                                        <th className="px-6 py-4 text-xs font-medium text-koru-on-surface-variant">Due</th>
                                        <th className="px-6 py-4 text-xs font-medium text-koru-on-surface-variant text-center">Submissions</th>
                                        <th className="px-6 py-4 text-xs font-medium text-koru-on-surface-variant">Status</th>
                                        <th className="px-6 py-4 text-xs font-medium text-koru-on-surface-variant text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.assignments.map(item => {
                                        const typeInfo = ASSIGNMENT_TYPES.find(t => t.id === item.type);
                                        const Icon = typeInfo?.icon || FileText;
                                        const submissionPct = item.totalStudents > 0 ? Math.round((item.submissions / item.totalStudents) * 100) : 0;

                                        return (
                                            <motion.tr key={item.id} layout className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low/50 transition-all group">
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-koru-md ${typeInfo?.bg || "bg-koru-surface-container-high"}`}>
                                                            <Icon size={16} style={{ color: typeInfo?.color || "var(--color-koru-on-surface-variant)" }} />
                                                        </span>
                                                        <div>
                                                            <div className="text-sm font-medium text-koru-on-surface transition-colors group-hover:text-koru-primary">{item.title}</div>
                                                            <div className="text-xs text-koru-on-surface-variant mt-0.5">{typeInfo?.label} · {item.points} pts</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="text-xs text-koru-on-surface-variant font-semibold">
                                                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                                    </div>
                                                    {item.closeDate && <div className="text-[10px] text-koru-error mt-0.5">Closes {new Date(item.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-sm font-display font-medium tabular-nums text-koru-on-surface">{item.submissions}/{item.totalStudents}</span>
                                                        <div className="w-16 h-1.5 bg-koru-surface-container-high rounded-full overflow-hidden">
                                                            <div className="h-full bg-koru-primary rounded-full transition-all" style={{ width: `${submissionPct}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <Badge variant={item.isClosed ? "error" : "success"} dot>
                                                        {item.isClosed ? "Closed" : "Open"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="text" size="sm" onClick={() => onPreview(item)}>
                                                            Preview
                                                        </Button>
                                                        <Button variant="tonal" size="sm" onClick={() => onView(item)}>
                                                            Review
                                                        </Button>
                                                        <Button
                                                            variant="text"
                                                            size="sm"
                                                            onClick={() => onClose(group.id, item.id)}
                                                            className={item.isClosed ? "!text-koru-error hover:!bg-koru-error-container" : "!text-koru-on-surface-variant hover:!bg-koru-error-container hover:!text-koru-error"}
                                                            title={item.isClosed ? "Click to reopen" : "Click to close"}
                                                        >
                                                            {item.isClosed ? "Reopen" : "Close"}
                                                        </Button>
                                                        <Button variant="text" size="icon" onClick={() => onEdit(group.id, item.id)} aria-label={`Edit ${item.title}`} className="!h-8 !w-8 !text-koru-outline opacity-0 hover:!text-koru-primary focus-visible:opacity-100 group-hover:opacity-100">
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button variant="text" size="icon" onClick={() => onDelete(group.id, item.id)} aria-label={`Delete ${item.title}`} className="!h-8 !w-8 !text-koru-outline opacity-0 hover:!bg-koru-error-container hover:!text-koru-error focus-visible:opacity-100 group-hover:opacity-100">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
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
    const [previewingAssignment, setPreviewingAssignment] = React.useState(null);

    // Cohort filter state
    const [cohorts, setCohorts] = React.useState([]);
    const [studentCohortMap, setStudentCohortMap] = React.useState({});
    const [selectedCohortId, setSelectedCohortId] = React.useState(null);

    const loadData = React.useCallback(async () => {
        if (!activeCourseId) return;
        try {
            setLoading(true);
            setSelectedCohortId(null);
            const [data, subs, count, cohortData, studentData] = await Promise.all([
                getCourseAssignments(activeCourseId),
                getCourseSubmissions(activeCourseId).catch(() => []),
                getCourseStudentCount(activeCourseId).catch(() => 0),
                getCourseCohorts(activeCourseId).catch(() => []),
                getCourseStudents(activeCourseId).catch(() => []),
            ]);
            const counts = {};
            (subs || []).forEach(s => { counts[s.assignmentId] = (counts[s.assignmentId] || 0) + 1; });
            const sorted = (data || []).sort((a, b) => new Date(b.createdAt ?? b.dueDate) - new Date(a.createdAt ?? a.dueDate));
            setAssignments(sorted);
            setSubmissionCounts(counts);
            setEnrollmentCount(count || 0);
            setCohorts(cohortData || []);
            const map = {};
            (studentData || []).forEach(st => { map[st.studentId] = st.classGroupId; });
            setStudentCohortMap(map);
        } catch (err) {
            console.error("Failed to load assignments:", err);
        } finally {
            setLoading(false);
        }
    }, [activeCourseId]);

    React.useEffect(() => { loadData(); }, [loadData]);

    const visibleAssignments = React.useMemo(() => {
        if (!selectedCohortId) return assignments;
        return assignments.filter(a => !a.classGroupId || a.classGroupId === selectedCohortId);
    }, [assignments, selectedCohortId]);

    const groups = React.useMemo(() => [{
        id: "all",
        name: "All Assignments",
        weight: 100,
        assignments: visibleAssignments.map(a => ({
            ...a,
            points: a.maxPoints,
            submissions: submissionCounts[a.id] || 0,
            totalStudents: enrollmentCount,
            published: !a.isClosed,
        }))
    }], [visibleAssignments, submissionCounts, enrollmentCount]);

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
                externalToolName: formData.externalToolName ?? null,
                externalToolUrl: formData.externalToolUrl ?? null,
                classGroupId: formData.classGroupId ?? null,
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
        return (
            <TeacherSubmissionReview
                assignment={reviewingAssignment}
                onBack={() => setReviewingAssignment(null)}
                cohorts={cohorts}
                studentCohortMap={studentCohortMap}
                selectedCohortId={selectedCohortId}
                onCohortChange={setSelectedCohortId}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-row gap-6 p-8 overflow-hidden h-full">
            <motion.div className="flex-1 flex flex-col overflow-y-auto pr-2 min-w-0" initial="hidden" animate="visible" variants={staggerContainer}>
                <motion.header variants={slideUp} className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="font-display text-koru-title text-koru-on-surface">Assignments</h1>
                        <div className="mt-3">
                            <CohortFilterBar cohorts={cohorts} selected={selectedCohortId} onChange={setSelectedCohortId} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setShowDrawer(true)} startIcon={<Plus size={18} />}>
                            Create Assignment
                        </Button>
                    </div>
                </motion.header>

                <motion.div variants={slideUp} className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { label: "Total Assignments", value: loading ? "..." : totalAssignments, accent: false },
                        { label: "Open", value: loading ? "..." : openCount, accent: true },
                        { label: "Closed", value: loading ? "..." : totalAssignments - openCount, accent: false },
                    ].map((stat) => (
                        <div key={stat.label} className={`flex flex-col gap-1 rounded-koru-lg px-7 py-6 ${stat.accent ? "bg-koru-primary text-koru-on-primary shadow-koru-sm" : "bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"}`}>
                            <span className={`text-koru-caption font-medium ${stat.accent ? "text-koru-on-primary/60" : "text-koru-on-surface-variant"}`}>{stat.label}</span>
                            <span className={`text-4xl font-display font-medium tabular-nums ${stat.accent ? "text-koru-on-primary" : "text-koru-on-surface"}`}>{stat.value}</span>
                        </div>
                    ))}
                </motion.div>

                <motion.div variants={slideUp} className="mb-10">
                    <h2 className="text-sm font-medium text-koru-on-surface-variant mb-4">Assignment Types</h2>
                    <div className="flex flex-wrap gap-3">
                        {ASSIGNMENT_TYPES.map(t => {
                            const Icon = t.icon;
                            const count = groups.reduce((sum, g) => sum + g.assignments.filter(a => a.type === t.id).length, 0);
                            const isActive = activeTypeFilter === t.id;
                            return (
                                <motion.button
                                    key={t.id}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.97 }}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => setActiveTypeFilter(isActive ? "all" : t.id)}
                                    className={`flex min-w-[130px] flex-1 flex-col items-start gap-3 rounded-koru-lg p-5 text-left transition duration-200 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${isActive ? "bg-koru-primary/5 shadow-koru-card ring-2 ring-inset ring-koru-primary" : "bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint hover:shadow-koru-card-hover"}`}
                                >
                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-koru-lg ${t.bg}`}>
                                        <Icon size={20} style={{ color: t.color }} />
                                    </span>
                                    <div>
                                        <p className={`text-koru-caption font-medium leading-tight ${isActive ? "text-koru-primary" : "text-koru-on-surface-variant"}`}>{t.label}</p>
                                        <p className="text-2xl font-display font-medium tabular-nums text-koru-on-surface mt-1">{count}</p>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {activeTypeFilter !== "all" && (
                    <motion.div variants={slideUp} className="mb-6 flex items-center gap-3">
                        <span className="text-sm text-koru-on-surface-variant">Filtering by:</span>
                        <Button variant="tonal" size="sm" onClick={() => setActiveTypeFilter("all")} endIcon={<X size={14} />} aria-label={`Clear ${ASSIGNMENT_TYPES.find(t => t.id === activeTypeFilter)?.label} filter`}>
                            {ASSIGNMENT_TYPES.find(t => t.id === activeTypeFilter)?.label}
                        </Button>
                    </motion.div>
                )}

                <motion.div variants={slideUp}>
                    <div className="mb-5">
                        <h2 className="text-sm font-medium text-koru-on-surface-variant">Assignment Groups</h2>
                    </div>
                    {filteredGroups.length === 0 ? (
                        <EmptyState icon={<ClipboardList size={24} />} title="No assignments match this filter." />
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
                                onPreview={(item) => setPreviewingAssignment(item)}
                            />
                        ))
                    )}
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showDrawer && (
                    <CreateAssignmentDrawer
                        onClose={() => { setShowDrawer(false); setEditingAssignment(null); }}
                        onSave={handleSave}
                        initialData={editingAssignment}
                        cohorts={cohorts}
                        defaultGroupId={selectedCohortId}
                    />
                )}
            </AnimatePresence>

            {previewingAssignment && (
                <AssignmentPreviewDrawer
                    assignment={previewingAssignment}
                    onClose={() => setPreviewingAssignment(null)}
                />
            )}
        </div>
    );
}
