import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdEditNote } from "react-icons/md";
import { Plus, Mail, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import ProgressRing from "./UI/progressRing";
import { useAuth } from "../contexts/AuthContext";
import { getTeacherTodos, createTodo, toggleTodo as apiToggleTodo } from "../services/todoService";

// ──────────────────────────────────────────────
// Teacher To-Do list + Progress ring
// Teacher-created todos → purple (#3C0078)
// Admin-assigned todos  → orange (#FF8731)
// ──────────────────────────────────────────────

const iconMap = {
  edit: MdEditNote,
  mail: Mail,
  file: FileText,
};

// Color tokens per source
const theme = {
  teacher: {
    icon: "bg-[#3C0078]/8",
    iconText: "text-[#3C0078]",
    checkbox: "border-[#3C0078] bg-[#3C0078]",
    checkboxHover: "hover:border-[#3C0078]",
    badge: "bg-[#3C0078]/10 text-[#3C0078]",
    dot: "bg-[#3C0078]",
  },
  admin: {
    icon: "bg-[#FF8731]/10",
    iconText: "text-[#FF8731]",
    checkbox: "border-[#FF8731] bg-[#FF8731]",
    checkboxHover: "hover:border-[#FF8731]",
    badge: "bg-[#FF8731]/10 text-[#FF8731]",
    dot: "bg-[#FF8731]",
  },
  shared: {
    icon: "bg-emerald-50",
    iconText: "text-emerald-600",
    checkbox: "border-emerald-500 bg-emerald-500",
    checkboxHover: "hover:border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
};

// Format a datetime-local value ("2026-03-05T10:00") into "Mar 5 at 10:00"
function formatDueDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day} at ${hours}:${mins}`;
}

export default function TeacherTodoProgress() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [shareMode, setShareMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch todos on mount
  useEffect(() => {
    if (!user?.userId) return;
    getTeacherTodos(user.userId)
      .then(setTodos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.userId]);

  // Fire confetti when a task is completed
  function fireConfetti() {
    const colors = ["#3C0078", "#FF8731", "#87CEFA"];
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { x: 0.75, y: 0.3 },
      colors,
      gravity: 0.8,
      scalar: 1,
    });
    document.body.classList.add("orbs-vibrant");
    setTimeout(() => document.body.classList.remove("orbs-vibrant"), 3000);
  }

  async function handleToggle(id) {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    if (!target.isCompleted) fireConfetti();
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
    try {
      await apiToggleTodo(id);
    } catch (err) {
      // Revert on failure
      console.error(err);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
      );
    }
  }

  async function handleAdd() {
    if (!newTitle.trim() || !user?.userId) return;
    try {
      const created = await createTodo({
        title: newTitle.trim(),
        dueDate: newDue ? formatDueDate(newDue) : null,
        teacherId: user.userId,
        sharedWithCoLecturers: shareMode,
      });
      setTodos((prev) => [...prev, created]);
    } catch (err) {
      console.error(err);
    }
    setNewTitle("");
    setNewDue("");
    setShareMode(false);
    setIsAdding(false);
  }

  // Calculate progress
  const progress = useMemo(() => {
    if (todos.length === 0) return 0;
    const done = todos.filter((t) => t.isCompleted).length;
    return Math.round((done / todos.length) * 100);
  }, [todos]);

  return (
    <div className="w-full h-full flex flex-col bg-white/70 border border-gray-100 rounded-3xl p-4">
      {/* ── To Do Header ── */}
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="text-2xl font-['Gabarito']">To Do</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Add to-do"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* ── Add task form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
              />
              <input
                type="datetime-local"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
              />
              {/* Segmented share selector */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShareMode(false)}
                  className={`flex-1 py-2 transition-colors ${
                    !shareMode
                      ? "bg-[#3C0078] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Just me
                </button>
                <button
                  type="button"
                  onClick={() => setShareMode(true)}
                  className={`flex-1 py-2 border-l border-gray-200 transition-colors ${
                    shareMode
                      ? "bg-[#3C0078] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Share with co-lecturers
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── To-Do Cards ── */}
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto scrollbar-black pr-2">
        {loading && (
          <p className="text-sm text-gray-400 text-center mt-4">Loading...</p>
        )}
        <AnimatePresence>
          {todos.map((todo) => {
            const isAdminTodo = !!todo.createdByAdminId;
            const isSharedTodo = !!todo.sharedByTeacherId;
            const colors = isAdminTodo ? theme.admin : isSharedTodo ? theme.shared : theme.teacher;
            const IconComp = MdEditNote;
            return (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`w-full border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-300 cursor-pointer
                  ${todo.isCompleted ? "bg-gray-50/60 border-gray-100 opacity-40" : "bg-white/80 border-gray-100 hover:border-gray-200"}`}
              >
                {/* Icon + source dot */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center
                      ${todo.isCompleted ? "bg-gray-100" : colors.icon}`}
                  >
                    <IconComp
                      className={`w-5 h-5 ${todo.isCompleted ? "text-gray-400" : colors.iconText}`}
                    />
                  </div>
                  {/* Colored dot indicates source: purple = self, orange = admin, green = shared */}
                  <span
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
                      ${todo.isCompleted ? "bg-gray-300" : colors.dot}`}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-base font-semibold leading-tight font-['Gabarito'] ${
                      todo.isCompleted ? "text-gray-400 line-through" : "text-black"
                    }`}
                  >
                    {todo.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                    {todo.dueDate && <span>{todo.dueDate}</span>}
                    {todo.courseCode && (
                      <span className="font-bold text-black">{todo.courseCode}</span>
                    )}
                    {isAdminTodo && todo.createdByAdminName && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                        {todo.createdByAdminName}
                      </span>
                    )}
                    {isSharedTodo && todo.sharedByTeacherName && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                        {todo.sharedByTeacherName}
                      </span>
                    )}
                  </p>
                </div>

                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(todo.id);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200
                    ${todo.isCompleted
                      ? colors.checkbox
                      : `border-gray-300 ${colors.checkboxHover}`
                    }`}
                  aria-label={`Toggle ${todo.title}`}
                >
                  {todo.isCompleted && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Progress Header ── */}
      <h2 className="text-2xl font-['Gabarito'] mt-4 mb-2 shrink-0">Progress</h2>

      {/* ── Progress Ring ── */}
      <div className="w-full bg-gray-50/60 rounded-2xl border border-gray-100 p-4 shrink-0">
        <ProgressRing percentage={progress} />
      </div>
    </div>
  );
}
