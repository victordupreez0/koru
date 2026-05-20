import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdEditNote } from "react-icons/md";
import { Plus, Mail, FileText, Check } from "lucide-react";
import confetti from "canvas-confetti";
import ProgressRing from "./UI/progressRing";

// ──────────────────────────────────────────────
// Teacher To-Do list + Progress ring
// Mirrors the wireframe's right column layout.
// Data stored locally – ready for backend swap.
// ──────────────────────────────────────────────
const defaultTodos = [
  {
    id: 1,
    title: "Mark DV Assignment 1",
    dueDate: "By Mar 2 at 20:00",
    courseCode: "DV300",
    completed: false,
    icon: "edit",
  },
  {
    id: 2,
    title: "Send Emails",
    dueDate: "By Mar 10 at 20:00",
    courseCode: "Personal",
    completed: false,
    icon: "mail",
  },
  {
    id: 3,
    title: "Feedback Report",
    dueDate: "By Mar 21 at 10:00",
    courseCode: "UX300",
    completed: false,
    icon: "file",
  },
];

const iconMap = {
  edit: MdEditNote,
  mail: Mail,
  file: FileText,
};

export default function TeacherTodoProgress() {
  const [todos, setTodos] = useState(defaultTodos);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newCourse, setNewCourse] = useState("");

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

  function toggleTodo(id) {
    const target = todos.find((t) => t.id === id);
    if (target && !target.completed) fireConfetti();
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newTitle.trim(),
        dueDate: newDue.trim() || "No due date",
        courseCode: newCourse.trim() || "General",
        completed: false,
        icon: "edit",
      },
    ]);
    setNewTitle("");
    setNewDue("");
    setNewCourse("");
    setIsAdding(false);
  }

  // Calculate progress
  const progress = useMemo(() => {
    if (todos.length === 0) return 0;
    const done = todos.filter((t) => t.completed).length;
    return Math.round((done / todos.length) * 100);
  }, [todos]);

  return (
    <div className="w-full h-full flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4">
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
      <p className="text-sm text-transparent mb-5 font-medium select-none" aria-hidden="true">
        Spacer
      </p>

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
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Due date (e.g. Mar 5 at 10:00)"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Course"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
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
        <AnimatePresence>
          {todos.map((todo) => {
            const IconComp = iconMap[todo.icon] || MdEditNote;
            return (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`w-full border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-300 cursor-pointer
                  ${todo.completed ? "bg-gray-50 border-gray-100 opacity-50" : "bg-white border-gray-200 hover:shadow-md"}`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${todo.completed ? "bg-gray-100" : "bg-[#3C0078]/8"}`}
                >
                  <IconComp
                    className={`w-5 h-5 ${todo.completed ? "text-gray-400" : "text-[#3C0078]"}`}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-base font-semibold leading-tight font-['Gabarito'] ${
                      todo.completed ? "text-gray-400 line-through" : "text-black"
                    }`}
                  >
                    {todo.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{todo.dueDate}</span>
                    <span className="font-bold text-black">{todo.courseCode}</span>
                  </p>
                </div>

                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTodo(todo.id);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200
                    ${todo.completed
                      ? "border-[#3C0078] bg-[#3C0078]"
                      : "border-gray-300 hover:border-[#3C0078]"
                    }`}
                  aria-label={`Toggle ${todo.title}`}
                >
                  {todo.completed && (
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
      <div className="w-full bg-gray-100 rounded-2xl border border-gray-200 p-4 shrink-0">
        <ProgressRing percentage={progress} />
      </div>
    </div>
  );
}
