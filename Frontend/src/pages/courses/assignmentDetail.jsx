import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ArrowLeft,
  CheckCircle,
  CloseCircle,
  Calendar,
  InfoCircle,
} from "@solar-icons/react";
import { FileText, X, Loader } from "lucide-react";
import { getAssignmentById } from "../../services/assignmentService.jsx";
import {
  getSubmissionForAssignment,
  createSubmission,
  updateSubmission,
} from "../../services/submissionService.jsx";
import { uploadFileToCloudinary } from "../../services/cloudinaryService.js";
import { getStudentGrades, createGrade, updateGrade } from "../../services/gradeService.js";
import { useAuth } from "../../contexts/AuthContext";
import { Alert, Badge, Button, Card, Modal, Skeleton } from "../../components/UI";

// ─────────────────────────────────────────────
// Animation variants – matches the rest of the course pages
// ─────────────────────────────────────────────
const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDueDate(dateStr) {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const due = new Date(dateStr);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Past due", color: "text-koru-error", bg: "bg-koru-error-container" };
  if (diff === 0) return { label: "Due today", color: "text-koru-warning", bg: "bg-koru-warning-soft" };
  if (diff === 1) return { label: "Due tomorrow", color: "text-koru-warning", bg: "bg-koru-warning-soft" };
  if (diff <= 5) return { label: `${diff} days left`, color: "text-koru-warning", bg: "bg-koru-warning-soft" };
  return { label: `${diff} days left`, color: "text-koru-info", bg: "bg-koru-info-soft" };
}

// ─────────────────────────────────────────────
// File preview modal
// ─────────────────────────────────────────────
function FilePreviewModal({ file, onClose }) {
  const [objectUrl, setObjectUrl] = React.useState(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !objectUrl) return null;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={file.name}
      description={`${(file.size / 1024).toFixed(1)} KB`}
    >
          {/* Preview content */}
          <div className="flex min-h-[40vh] items-center justify-center overflow-auto rounded-koru-md bg-koru-surface-container-low p-4">
            {isImage && (
              <img src={objectUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-koru-md" />
            )}
            {isPdf && (
              <iframe src={objectUrl} title={file.name} className="w-full h-full min-h-[60vh] rounded-koru-md border-0" />
            )}
            {isVideo && (
              <video src={objectUrl} controls className="max-w-full max-h-full rounded-koru-md" />
            )}
            {isAudio && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-koru-lg bg-koru-primary/10 flex items-center justify-center">
                  <FileText size={36} className="text-koru-primary" />
                </div>
                <audio src={objectUrl} controls className="w-full max-w-sm" />
              </div>
            )}
            {!isImage && !isPdf && !isVideo && !isAudio && (
              <div className="flex flex-col items-center gap-3 text-center py-12">
                <div className="w-20 h-20 rounded-koru-lg bg-koru-surface-container-high flex items-center justify-center">
                  <FileText size={36} className="text-koru-on-surface-variant" />
                </div>
                <p className="font-semibold text-koru-on-surface-variant">{file.name}</p>
                <p className="text-sm text-koru-on-surface-variant">Preview not available for this file type</p>
              </div>
            )}
          </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Upload drop zone component
// ─────────────────────────────────────────────
function UploadZone({ file, onFileSelect, onFileClear, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !file && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled && !file) { e.preventDefault(); inputRef.current?.click(); } }}
        role={!file ? "button" : undefined}
        tabIndex={!disabled && !file ? 0 : undefined}
        aria-label={!file ? "Upload a file" : undefined}
        className={`relative border-2 border-dashed rounded-koru-lg p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus flex flex-col items-center justify-center gap-4 transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : file ? "cursor-default" : "cursor-pointer"}
          ${dragging ? "border-koru-primary bg-koru-primary/5 scale-[1.01]" : file ? "border-koru-success/30 bg-koru-success-soft/50" : "border-koru-outline-variant bg-koru-surface-container-low/50 hover:border-koru-primary/40 hover:bg-koru-primary/[0.03]"}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={disabled}
          onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }}
          accept=".pdf,.doc,.docx,.docm,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.mov,.mp3,.wav,.fig,.sketch"
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4 w-full"
            >
              <div className="w-14 h-14 rounded-koru-lg bg-koru-success-soft flex items-center justify-center shrink-0">
                <FileText size={26} className="text-koru-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-koru-on-surface">{file.name}</p>
                <p className="text-sm text-koru-on-surface-variant mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setPreviewing(true); }}
                >
                  Preview
                </Button>
                {!disabled && (
                  <Button
                    variant="text"
                    size="icon"
                    aria-label="Remove file"
                    onClick={(e) => { e.stopPropagation(); onFileClear(); }}
                    className="!text-koru-on-surface-variant hover:!bg-koru-error-container hover:!text-koru-error"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="w-16 h-16 rounded-koru-lg bg-koru-surface-container-high flex items-center justify-center">
                <Upload size={28} className="text-koru-on-surface-variant" />
              </div>
              <div>
                <p className="font-medium text-koru-on-surface-variant">
                  Drag & drop your file here, or{" "}
                  <span className="font-medium text-koru-primary">browse</span>
                </p>
                <p className="text-xs text-koru-on-surface-variant mt-1">
                  PDF, Word, PowerPoint, Excel, ZIP, images, video & more
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {previewing && (
        <FilePreviewModal file={file} onClose={() => setPreviewing(false)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Main Assignment Detail Page
// ─────────────────────────────────────────────
export default function AssignmentDetail({ assignmentId, activeCourseId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [loadingSubmission, setLoadingSubmission] = useState(true);

  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [existingGrade, setExistingGrade] = useState(null);

  // Fetch assignment details
  useEffect(() => {
    let mounted = true;
    async function fetchAssignment() {
      if (!assignmentId) return;
      try {
        setLoadingAssignment(true);
        const data = await getAssignmentById(assignmentId);
        if (mounted) setAssignment(data);
      } catch (err) {
        console.error("Failed to load assignment:", err);
      } finally {
        if (mounted) setLoadingAssignment(false);
      }
    }
    fetchAssignment();
    return () => { mounted = false; };
  }, [assignmentId]);

  // Check for an existing submission (and grade)
  useEffect(() => {
    let mounted = true;
    async function fetchSubmission() {
      if (!assignmentId || !user?.userId) return;
      try {
        setLoadingSubmission(true);
        const [sub, grades] = await Promise.all([
          getSubmissionForAssignment(user.userId, assignmentId).catch(() => null),
          getStudentGrades(user.userId).catch(() => []),
        ]);
        if (!mounted) return;
        if (sub) {
          setExistingSubmission(sub);
          // Pre-fill quiz answers from the stored submission
          if (sub.fileUrl) {
            try {
              const parsed = JSON.parse(sub.fileUrl);
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                const answers = {};
                Object.entries(parsed).forEach(([k, v]) => { answers[parseInt(k)] = v; });
                setQuizAnswers(answers);
              }
            } catch { /* not a quiz submission */ }
          }
          // Find any existing grade for this submission
          const grade = grades.find(g => g.submissionId === sub.id);
          if (grade) setExistingGrade(grade);
        }
      } catch (err) {
        console.warn("No existing submission found:", err);
      } finally {
        if (mounted) setLoadingSubmission(false);
      }
    }
    fetchSubmission();
    return () => { mounted = false; };
  }, [assignmentId, user?.userId]);

  // Submit handler
  async function handleSubmit() {
    const isQuiz = assignment?.type === "quiz";
    if (!isQuiz && !file) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let fileUrl;
      if (isQuiz) {
        fileUrl = JSON.stringify(quizAnswers);
      } else {
        fileUrl = await uploadFileToCloudinary(file);
      }

      let submissionId;
      if (existingSubmission) {
        await updateSubmission(existingSubmission.id, {
          fileUrl,
          status: isQuiz ? "Graded" : "Resubmitted",
          assignmentId,
          studentId: user.userId,
        });
        submissionId = existingSubmission.id;
        setExistingSubmission((prev) => ({ ...prev, fileUrl, status: isQuiz ? "Graded" : "Resubmitted", submittedAt: new Date().toISOString() }));
      } else {
        const created = await createSubmission({
          assignmentId,
          studentId: user.userId,
          fileUrl,
          status: isQuiz ? "Graded" : "Submitted",
        });
        submissionId = created.id;
        setExistingSubmission(created);
      }

      // Auto-grade quiz submissions
      if (isQuiz && quizQuestions.length > 0) {
        const maxPts = assignment.points ?? quizQuestions.length;
        let correct = 0;
        quizQuestions.forEach((q, qi) => {
          if (quizAnswers[qi] === q.correctAnswer) correct++;
        });
        const pointsEarned = Math.round((correct / quizQuestions.length) * maxPts * 10) / 10;
        try {
          if (existingGrade) {
            await updateGrade(existingGrade.id, { submissionId, pointsEarned, gradedBy: user.userId });
            setExistingGrade(prev => ({ ...prev, pointsEarned, isReleased: true }));
          } else {
            // isReleased: true so quiz grades are immediately visible to the student
            const saved = await createGrade({ submissionId, pointsEarned, gradedBy: user.userId, isReleased: true });
            setExistingGrade(saved);
          }
        } catch (gradeErr) {
          console.error("Auto-grade failed:", gradeErr);
        }
      }

      setJustSubmitted(true);
      setFile(null);
      setQuizStarted(false);
    } catch (err) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const daysLeft = assignment ? getDaysLeft(assignment.dueDate) : null;
  const isSubmitted = !!existingSubmission;
  const isPastDue = assignment ? new Date(assignment.dueDate) < new Date() : false;
  const isClosed = assignment?.isClosed === true;
  const canResubmit = assignment?.allowMultipleAttempts !== false;
  const isQuiz = assignment?.type === "quiz";
  const quizQuestions = React.useMemo(() => {
    if (!isQuiz || !assignment?.quizQuestionsJson) return [];
    try { return JSON.parse(assignment.quizQuestionsJson); } catch { return []; }
  }, [isQuiz, assignment?.quizQuestionsJson]);

  // Compute quiz results from stored answers vs correct answers
  const quizResults = React.useMemo(() => {
    if (!isQuiz || quizQuestions.length === 0 || Object.keys(quizAnswers).length === 0) return null;
    const maxPts = assignment?.points ?? quizQuestions.length;
    let correct = 0;
    const perQuestion = quizQuestions.map((q, qi) => {
      const chosen = quizAnswers[qi];
      const isCorrect = chosen === q.correctAnswer;
      if (isCorrect) correct++;
      return { qi, isCorrect, chosen, correctAnswer: q.correctAnswer, question: q.question, options: q.options };
    });
    const pointsEarned = Math.round((correct / quizQuestions.length) * maxPts * 10) / 10;
    return { correct, total: quizQuestions.length, pointsEarned, maxPts, pct: Math.round((correct / quizQuestions.length) * 100), perQuestion };
  }, [isQuiz, quizQuestions, quizAnswers, assignment?.points]);

  return (
    <motion.div
      className="flex-1 overflow-y-auto pb-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
        {/* ── Breadcrumb ── */}
        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(`/courses/${activeCourseId}/assignments`)}
            className="group flex items-center gap-2 rounded-koru-pill text-sm font-medium text-koru-on-surface-variant transition-colors hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Assignments
          </button>
          <span className="text-koru-outline-variant">/</span>
          <span className="text-sm text-koru-on-surface-variant font-medium truncate max-w-[260px]">
            {loadingAssignment ? <Skeleton variant="text" className="inline-block h-4 w-40 align-middle" /> : assignment?.title}
          </span>
        </motion.div>

        {loadingAssignment ? (
          <div className="space-y-6" aria-busy="true">
            {/* Title + meta chips */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-36" />)}
              </div>
            </div>
            {/* Description block */}
            <Card variant="outlined" tone="low" padding="lg" className="space-y-3">
              <Skeleton variant="text" className="mb-4 h-4 w-32" />
              {[90, 75, 85, 60, 80].map((w, i) => (
                <Skeleton key={i} variant="text" className="h-4" width={`${w}%`} />
              ))}
            </Card>
            {/* Submission area */}
            <Skeleton className="h-44 rounded-koru-lg" />
          </div>
        ) : !assignment ? (
          <Alert variant="error">Assignment not found.</Alert>
        ) : (
          <div className="space-y-6">

            {/* ── Title & Meta bar ── */}
            <motion.div variants={slideUp}>
              <h1 className="mb-4 font-display text-koru-display text-koru-on-surface">
                {assignment.title}
              </h1>

              {/* Info strip – Due | Points | Status */}
              <div className="flex flex-wrap gap-3">
                {/* Due date */}
                <div className="flex items-center gap-2.5 rounded-koru-md bg-koru-surface-container-lowest px-5 py-3 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint">
                  <Calendar size={18} className="text-koru-primary" />
                  <div className="flex flex-col">
                    <span className="text-koru-caption font-medium text-koru-on-surface-variant">Due</span>
                    <span className="text-sm font-medium leading-tight text-koru-on-surface">
                      {formatDueDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Days left badge */}
                {daysLeft && (
                  <div className={`flex items-center rounded-koru-md px-5 py-3 ${daysLeft.bg}`}>
                    <span className={`text-sm font-medium ${daysLeft.color}`}>{daysLeft.label}</span>
                  </div>
                )}

                {/* Points */}
                <div className="flex items-center gap-2.5 rounded-koru-md bg-koru-surface-container-lowest px-5 py-3 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint">
                  <InfoCircle size={18} className="text-koru-accent-ink" />
                  <div className="flex flex-col">
                    <span className="text-koru-caption font-medium text-koru-on-surface-variant">Points</span>
                    <span className="text-sm font-medium leading-tight text-koru-on-surface">
                      {assignment.maxPoints ?? "—"}
                    </span>
                  </div>
                </div>

                {/* Submission status */}
                {!loadingSubmission && (
                  <div className="flex items-center gap-2 rounded-koru-md bg-koru-surface-container-lowest px-5 py-3 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint">
                    {isSubmitted
                      ? <CheckCircle size={18} className="text-koru-on-surface-variant" />
                      : <CloseCircle size={18} className="text-koru-on-surface-variant" />}
                    <span className="text-sm font-medium text-koru-on-surface-variant">
                      {isSubmitted ? existingSubmission.status || "Submitted" : "Not submitted"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Description Card ── */}
            <motion.div
              variants={slideUp}
              className="rounded-koru-lg bg-koru-surface-container-lowest p-6 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
            >
              <h2 className="mb-5 text-koru-caption font-medium text-koru-primary">
                Assignment Brief
              </h2>
              <p className="text-koru-on-surface-variant leading-relaxed text-base whitespace-pre-wrap">
                {assignment.description || "No description provided for this assignment."}
              </p>
            </motion.div>

            {/* ── Existing Submission Card (if submitted) ── */}
            <AnimatePresence>
              {(isSubmitted || justSubmitted) && (
                <motion.div
                  key="submission-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="rounded-koru-lg bg-koru-surface-container-lowest p-6 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
                >
                  <h2 className="mb-5 text-koru-caption font-medium text-koru-on-surface-variant">
                    Your Submission
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-koru-lg bg-koru-surface-container-high flex items-center justify-center">
                      <FileText size={22} className="text-koru-on-surface-variant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-koru-on-surface">
                        {existingSubmission?.fileUrl || "File submitted"}
                      </p>
                      {existingSubmission?.submittedAt && (
                        <p className="text-xs text-koru-on-surface-variant mt-0.5">
                          Submitted on{" "}
                          {new Date(existingSubmission.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {existingGrade && (
                        <Badge variant="info" size="md">
                          Grade: {existingGrade.pointsEarned ?? "—"} / {assignment?.maxPoints ?? "—"}
                        </Badge>
                      )}
                      <Badge variant="success" size="md" dot>
                        {existingSubmission?.status || "Submitted"}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submission Upload Area ── */}
            {isClosed ? (
              <motion.div
                variants={slideUp}
                className="rounded-koru-lg bg-koru-surface-container-lowest p-6 text-center shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
              >
                <p className="mb-1 font-display text-koru-heading text-koru-on-surface">Assignment Closed</p>
                <p className="text-koru-on-surface-variant text-sm">This assignment has been closed by your lecturer. No more submissions are accepted.</p>
              </motion.div>
            ) : isSubmitted && !canResubmit ? (
              <motion.div
                variants={slideUp}
                className="rounded-koru-lg bg-koru-surface-container-lowest p-6 text-center shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
              >
                <p className="text-koru-on-surface-variant font-medium">Only one submission is allowed for this assignment.</p>
              </motion.div>
            ) : isQuiz ? (
              /* Quiz submission area */
              <motion.div variants={slideUp} className="rounded-koru-lg bg-koru-surface-container-lowest p-6 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint">
                {/* Results view – shown when already submitted and not retaking */}
                {isSubmitted && !quizStarted && quizResults ? (
                  <div>
                    <h2 className="mb-6 text-koru-caption font-medium text-koru-accent-ink">Quiz Results</h2>
                    {/* Score summary */}
                    <div className="flex items-center gap-6 mb-6 p-4 bg-koru-surface-container-low rounded-koru-lg">
                      <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-koru-lg font-display font-medium tabular-nums ${
                        quizResults.pct >= 75 ? "bg-koru-success-soft text-koru-success"
                        : quizResults.pct >= 50 ? "bg-koru-warning-soft text-koru-warning"
                        : "bg-koru-error-container text-koru-error"
                      }`}>
                        <span className="text-3xl leading-none">{quizResults.pct}%</span>
                      </div>
                      <div>
                        <p className="font-display text-2xl font-medium tabular-nums text-koru-on-surface">
                          {quizResults.correct} / {quizResults.total} correct
                        </p>
                        <p className="text-sm text-koru-on-surface-variant mt-1">
                          {quizResults.pointsEarned} / {quizResults.maxPts} pts
                        </p>
                      </div>
                    </div>
                    {/* Per-question breakdown */}
                    <div className="space-y-4 mb-8">
                      {quizResults.perQuestion.map(({ qi, isCorrect, chosen, correctAnswer, question, options }) => (
                        <div key={qi} className={`rounded-koru-md p-4 ${
                          isCorrect ? "bg-koru-success-soft" : "bg-koru-error-container"
                        }`}>
                          <div className="flex items-start gap-3 mb-3">
                            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              isCorrect ? "bg-koru-success text-koru-on-primary" : "bg-koru-error text-koru-on-primary"
                            }`}>
                              {isCorrect ? "✓" : "✗"}
                            </span>
                            <p className="font-semibold text-koru-on-surface">{qi + 1}. {question}</p>
                          </div>
                          <div className="space-y-1.5 ml-9">
                            {options.map((opt, oi) => (
                              <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-koru-md text-sm ${
                                oi === correctAnswer
                                  ? "bg-koru-surface-container-lowest/70 text-koru-success font-medium"
                                  : oi === chosen && !isCorrect
                                  ? "bg-koru-surface-container-lowest/70 text-koru-error line-through"
                                  : "text-koru-on-surface-variant"
                              }`}>
                                {oi === correctAnswer && <span className="text-koru-success font-semibold text-xs">✓</span>}
                                {oi === chosen && !isCorrect && <span className="text-koru-error font-semibold text-xs">✗</span>}
                                {oi !== correctAnswer && oi !== chosen && <span className="w-3" />}
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Retake button */}
                    <div className="flex justify-end">
                      <Button
                        variant="accent"
                        size="lg"
                        onClick={() => { setQuizStarted(true); setQuizAnswers({}); }}
                      >
                        Retake Quiz
                      </Button>
                    </div>
                  </div>
                ) : !quizStarted && !isSubmitted ? (
                  /* Pre-start screen */
                  <div>
                    <h2 className="mb-6 text-koru-caption font-medium text-koru-accent-ink">Quiz</h2>
                    <div className="flex flex-col items-center gap-6 py-6">
                      <p className="text-koru-on-surface-variant text-sm">{quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""} — select the correct answer for each</p>
                      <Button
                        variant="accent"
                        size="lg"
                        onClick={() => setQuizStarted(true)}
                      >
                        Start Quiz
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Active quiz */
                  <div>
                    <h2 className="mb-6 text-koru-caption font-medium text-koru-accent-ink">Quiz</h2>
                    <div className="space-y-6">
                      {quizQuestions.map((q, qi) => (
                        <fieldset key={qi} className="rounded-koru-md bg-koru-surface-container-low p-4">
                          <legend className="sr-only">Question {qi + 1}</legend>
                          <p className="mb-4 font-medium text-koru-on-surface">{qi + 1}. {q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => (
                              <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-koru-md px-4 py-3 transition duration-150 ease-koru-out focus-within:ring-2 focus-within:ring-koru-focus ${
                                quizAnswers[qi] === oi
                                  ? "bg-koru-primary/8 ring-2 ring-inset ring-koru-primary"
                                  : "bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint hover:ring-koru-outline-variant"
                              }`}>
                                <input
                                  type="radio"
                                  name={`q-${qi}`}
                                  checked={quizAnswers[qi] === oi}
                                  onChange={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                  className="accent-koru-primary"
                                  disabled={submitting}
                                />
                                <span className="text-sm font-medium text-koru-on-surface-variant">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                      <AnimatePresence>
                        {submitError && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Alert variant="error">{submitError}</Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex justify-end">
                        <Button
                          size="lg"
                          onClick={handleSubmit}
                          disabled={submitting || Object.keys(quizAnswers).length < quizQuestions.length}
                        >
                          {submitting ? <><Loader size={16} className="animate-spin" /> Submitting...</> : <><Upload size={16} /> Submit Quiz</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                variants={slideUp}
                className="rounded-koru-lg bg-koru-surface-container-lowest p-6 shadow-koru-card ring-1 ring-inset ring-koru-outline-faint"
              >
                <h2 className="mb-2 text-koru-caption font-medium text-koru-primary">
                  {isSubmitted ? "Resubmit Work" : "Submit Your Work"}
                </h2>
                {isPastDue && !isSubmitted && (
                  <p className="mb-4 text-sm font-medium text-koru-warning">This assignment is past due — late submissions are still accepted.</p>
                )}
                {isSubmitted && (
                  <p className="text-sm text-koru-on-surface-variant mb-6">
                    You've already submitted. You can resubmit at any time.
                  </p>
                )}
                {!isSubmitted && !isPastDue && <div className="mb-6" />}

                {/* File upload zone */}
                <UploadZone
                  file={file}
                  onFileSelect={setFile}
                  onFileClear={() => setFile(null)}
                  disabled={submitting}
                />

                {/* Comment / notes field */}
                <div className="mt-6">
                  <label htmlFor="submission-comment" className="mb-1.5 block text-koru-label text-koru-on-surface-variant">
                    Submission Comments (optional)
                  </label>
                  <textarea
                    id="submission-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                    rows={3}
                    placeholder="Add any notes for your lecturer..."
                    className="w-full resize-none rounded-koru-xs bg-koru-surface-container-lowest px-4 py-3 text-sm text-koru-on-surface shadow-koru-xs outline-none ring-1 ring-inset ring-koru-outline-variant transition placeholder:text-koru-on-surface-variant/70 focus:ring-koru-primary disabled:opacity-50"
                  />
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4"
                    >
                      <Alert variant="error">{submitError}</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-xs text-koru-on-surface-variant">
                    {file
                      ? `Ready to submit: ${file.name}`
                      : "Select a file to enable submission"}
                  </p>
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!file || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        {isSubmitted ? "Resubmit" : "Submit Assignment"}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
  );
}
