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
  uploadSubmissionFile,
} from "../../services/submissionService.jsx";
import { useAuth } from "../../contexts/AuthContext";

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
  if (diff < 0) return { label: "Past due", color: "text-red-500", bg: "bg-red-50" };
  if (diff === 0) return { label: "Due today", color: "text-orange-500", bg: "bg-orange-50" };
  if (diff === 1) return { label: "Due tomorrow", color: "text-orange-500", bg: "bg-orange-50" };
  if (diff <= 5) return { label: `${diff} days left`, color: "text-orange-500", bg: "bg-orange-50" };
  return { label: `${diff} days left`, color: "text-blue-500", bg: "bg-blue-50" };
}

// ─────────────────────────────────────────────
// Upload drop zone component
// ─────────────────────────────────────────────
function UploadZone({ file, onFileSelect, onFileClear, disabled }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !file && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-[28px] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${dragging ? "border-[#3C0078] bg-[#3C0078]/5 scale-[1.01]" : file ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-gray-50/50 hover:border-[#3C0078]/40 hover:bg-[#3C0078]/3"}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }}
        accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.fig,.sketch"
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
            {/* File icon */}
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
              <FileText size={26} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); onFileClear(); }}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Upload size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                Drag & drop your file here, or{" "}
                <span className="text-[#3C0078] font-bold">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported: PDF, DOC, DOCX, ZIP, PNG, JPG, FIG, Sketch
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  // Check for an existing submission
  useEffect(() => {
    let mounted = true;
    async function fetchSubmission() {
      if (!assignmentId || !user?.userId) return;
      try {
        setLoadingSubmission(true);
        const sub = await getSubmissionForAssignment(user.userId, assignmentId);
        if (mounted) setExistingSubmission(sub);
      } catch (err) {
        // No submission is fine – just means not submitted yet
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
        const uploaded = await uploadSubmissionFile(file);
        fileUrl = uploaded.url;
      }

      if (existingSubmission) {
        await updateSubmission(existingSubmission.id, {
          fileUrl,
          status: "Resubmitted",
          assignmentId,
          studentId: user.userId,
        });
        setExistingSubmission((prev) => ({ ...prev, fileUrl, status: "Resubmitted", submittedAt: new Date().toISOString() }));
      } else {
        const created = await createSubmission({
          assignmentId,
          studentId: user.userId,
          fileUrl,
          status: "Submitted",
        });
        setExistingSubmission(created);
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

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
        {/* ── Breadcrumb ── */}
        <motion.div variants={slideUp} className="flex items-center gap-3 mb-10">
          <button
            onClick={() => navigate(`/courses/${activeCourseId}/assignments`)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#3C0078] transition-colors font-semibold text-sm group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Assignments
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-sm text-gray-400 font-medium truncate max-w-[260px]">
            {loadingAssignment ? "Loading..." : assignment?.title}
          </span>
        </motion.div>

        {loadingAssignment ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-medium">
            Loading assignment details...
          </div>
        ) : !assignment ? (
          <div className="flex items-center justify-center h-64 text-red-400 font-medium">
            Assignment not found.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Title & Meta bar ── */}
            <motion.div variants={slideUp}>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                {assignment.title}
              </h1>

              {/* Info strip – Due | Points | Status */}
              <div className="flex flex-wrap gap-3">
                {/* Due date */}
                <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <Calendar size={18} className="text-[#3C0078]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Due</span>
                    <span className="text-sm font-bold text-gray-900 leading-tight">
                      {formatDueDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Days left badge */}
                {daysLeft && (
                  <div className={`flex items-center px-5 py-3 rounded-2xl border border-transparent ${daysLeft.bg}`}>
                    <span className={`text-sm font-bold ${daysLeft.color}`}>{daysLeft.label}</span>
                  </div>
                )}

                {/* Points */}
                <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <InfoCircle size={18} className="text-[#FF8731]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Points</span>
                    <span className="text-sm font-bold text-gray-900 leading-tight">
                      {assignment.maxPoints ?? "—"}
                    </span>
                  </div>
                </div>

                {/* Submission status */}
                {!loadingSubmission && (
                  <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border ${isSubmitted ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
                    {isSubmitted
                      ? <CheckCircle size={18} className="text-green-600" />
                      : <CloseCircle size={18} className="text-gray-400" />}
                    <span className={`text-sm font-bold ${isSubmitted ? "text-green-600" : "text-gray-400"}`}>
                      {isSubmitted ? existingSubmission.status || "Submitted" : "Not submitted"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Description Card ── */}
            <motion.div
              variants={slideUp}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10"
            >
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3C0078] mb-5">
                Assignment Brief
              </h2>
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
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
                  className="bg-green-50 border border-green-100 rounded-[40px] p-10"
                >
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-green-600 mb-5">
                    Your Submission
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                      <FileText size={22} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {existingSubmission?.fileUrl || "File submitted"}
                      </p>
                      {existingSubmission?.submittedAt && (
                        <p className="text-xs text-gray-500 mt-0.5">
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
                    <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest">
                      {existingSubmission?.status || "Submitted"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submission Upload Area ── */}
            {isClosed ? (
              <motion.div
                variants={slideUp}
                className="bg-red-50 border border-red-100 rounded-[40px] p-10 text-center"
              >
                <p className="text-red-500 font-bold text-lg mb-1">Assignment Closed</p>
                <p className="text-gray-400 text-sm">This assignment has been closed by your lecturer. No more submissions are accepted.</p>
              </motion.div>
            ) : isSubmitted && !canResubmit ? (
              <motion.div
                variants={slideUp}
                className="bg-gray-50 border border-gray-100 rounded-[40px] p-10 text-center"
              >
                <p className="text-gray-500 font-medium">Only one submission is allowed for this assignment.</p>
              </motion.div>
            ) : isQuiz ? (
              /* Quiz submission area */
              <motion.div variants={slideUp} className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF8731] mb-6">
                  {isSubmitted ? "Retake Quiz" : "Quiz"}
                </h2>
                {!quizStarted && !isSubmitted ? (
                  <div className="flex flex-col items-center gap-6 py-6">
                    <p className="text-gray-500 text-sm">{quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""} — select the correct answer for each</p>
                    <button
                      onClick={() => setQuizStarted(true)}
                      className="px-10 py-4 rounded-2xl bg-[#FF8731] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#e0722a] transition-all shadow-lg shadow-[#FF8731]/20"
                    >
                      Start Quiz
                    </button>
                  </div>
                ) : quizStarted || isSubmitted ? (
                  <div className="space-y-6">
                    {quizQuestions.map((q, qi) => (
                      <div key={qi} className="bg-gray-50 rounded-[24px] p-6">
                        <p className="font-semibold text-gray-900 mb-4">{qi + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <label key={oi} className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                              quizAnswers[qi] === oi
                                ? "bg-[#3C0078]/10 border-2 border-[#3C0078]"
                                : "bg-white border-2 border-gray-100 hover:border-gray-200"
                            }`}>
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                checked={quizAnswers[qi] === oi}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                className="accent-[#3C0078]"
                                disabled={submitting}
                              />
                              <span className="text-sm font-medium text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <AnimatePresence>
                      {submitError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-sm text-red-500 font-medium">{submitError}</motion.p>
                      )}
                    </AnimatePresence>
                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(quizAnswers).length < quizQuestions.length}
                        className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all shadow-sm ${
                          submitting || Object.keys(quizAnswers).length < quizQuestions.length
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-[#3C0078] hover:bg-[#2A0054] shadow-[#3C0078]/20"
                        }`}
                      >
                        {submitting ? <><Loader size={16} className="animate-spin" /> Submitting...</> : <><Upload size={16} /> Submit Quiz</>}
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : !isPastDue || isSubmitted ? (
              <motion.div
                variants={slideUp}
                className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10"
              >
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3C0078] mb-2">
                  {isSubmitted ? "Resubmit Work" : "Submit Your Work"}
                </h2>
                {isSubmitted && (
                  <p className="text-sm text-gray-400 mb-6">
                    You've already submitted. You can resubmit until the due date.
                  </p>
                )}
                {!isSubmitted && <div className="mb-6" />}

                {/* File upload zone */}
                <UploadZone
                  file={file}
                  onFileSelect={setFile}
                  onFileClear={() => setFile(null)}
                  disabled={submitting}
                />

                {/* Comment / notes field */}
                <div className="mt-6">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Submission Comments (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                    rows={3}
                    placeholder="Add any notes for your lecturer..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#3C0078] transition-colors placeholder:text-gray-300 disabled:opacity-50"
                  />
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {submitError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 text-sm text-red-500 font-medium"
                    >
                      {submitError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <div className="mt-8 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {file
                      ? `Ready to submit: ${file.name}`
                      : "Select a file to enable submission"}
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!file || submitting}
                    className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all shadow-sm
                      ${!file || submitting
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-[#3C0078] hover:bg-[#2A0054] shadow-[#3C0078]/20"}`}
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
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Past due and no submission */
              <motion.div
                variants={slideUp}
                className="bg-gray-50 border border-gray-100 rounded-[40px] p-10 text-center"
              >
                <p className="text-gray-400 font-medium">
                  This assignment is past due and no submission was recorded.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
  );
}
