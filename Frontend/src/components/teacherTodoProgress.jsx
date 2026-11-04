import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdEditNote } from "react-icons/md";
import { Plus, Mail, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import ProgressRing from "./UI/progressRing";
import { useAuth } from "../contexts/AuthContext";
import { useCourses } from "../contexts/CoursesContext";
import { getTeacherTodos, createTodo, toggleTodo as apiToggleTodo } from "../services/todoService";
import { getCourseSubmissions } from "../services/submissionService";
import { getCourseGrades } from "../services/gradeService";
import { Badge, Button, Card, Input, Skeleton } from "./UI";

const MIN_LOADING_MS = 1500;

const theme = {
  teacher: {
    icon: "bg-koru-primary-container/60",
    iconText: "text-koru-primary",
    checkbox: "border-koru-primary bg-koru-primary",
    checkboxHover: "hover:border-koru-primary",
    badge: "primary",
    dot: "bg-koru-primary",
  },
  admin: {
    icon: "bg-koru-accent-soft",
    iconText: "text-koru-accent",
    checkbox: "border-koru-accent bg-koru-accent",
    checkboxHover: "hover:border-koru-accent",
    badge: "accent",
    dot: "bg-koru-accent",
  },
  shared: {
    icon: "bg-koru-success-soft",
    iconText: "text-koru-success",
    checkbox: "border-koru-success bg-koru-success",
    checkboxHover: "hover:border-koru-success",
    badge: "success",
    dot: "bg-koru-success",
  },
};

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

function SkeletonTodo() {
  return (
    <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint">
      <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-7 w-7 shrink-0 rounded-koru-sm" />
    </div>
  );
}

export default function TeacherTodoProgress() {
  const { user } = useAuth();
  const { visibleCourses } = useCourses();
  const [todos, setTodos] = useState([]);
  const [gradingProgress, setGradingProgress] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [shareMode, setShareMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    let mounted = true;
    async function load() {
      try {
        const courseIds = (visibleCourses || []).map(c => c.id);
        const [data, ...courseResults] = await Promise.all([
          getTeacherTodos(user.userId),
          ...courseIds.map(id =>
            Promise.all([
              getCourseSubmissions(id).catch(() => []),
              getCourseGrades(id).catch(() => []),
            ])
          ),
          new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
        ]);

        if (mounted) {
          setTodos(data);

          let totalSubs = 0;
          let gradedSubs = 0;
          courseResults.forEach(result => {
            if (!Array.isArray(result)) return;
            const [subs, grades] = result;
            const gradedIds = new Set((Array.isArray(grades) ? grades : []).map(g => g.submissionId));
            totalSubs += (Array.isArray(subs) ? subs : []).length;
            gradedSubs += (Array.isArray(subs) ? subs : []).filter(s => gradedIds.has(s.id)).length;
          });
          setGradingProgress(totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.userId, visibleCourses]);

  function fireConfetti() {
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = ["--color-koru-primary", "--color-koru-accent", "--color-koru-sky"]
      .map((token) => rootStyle.getPropertyValue(token).trim())
      .filter(Boolean);
    confetti({ particleCount: 60, spread: 55, origin: { x: 0.75, y: 0.3 }, colors, gravity: 0.8, scalar: 1 });
    document.body.classList.add("orbs-vibrant");
    setTimeout(() => document.body.classList.remove("orbs-vibrant"), 3000);
  }

  async function handleToggle(id) {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    if (!target.isCompleted) fireConfetti();
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
    try {
      await apiToggleTodo(id);
    } catch (err) {
      console.error(err);
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)));
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

  const progress = useMemo(() => {
    if (todos.length === 0) return 0;
    const done = todos.filter((t) => t.isCompleted).length;
    return Math.round((done / todos.length) * 100);
  }, [todos]);

  return (
    <Card variant="outlined" tone="low" radius="lg" padding="sm" className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="font-display text-koru-heading text-koru-on-surface">To Do</h2>
        <Button
          variant="tonal"
          size="icon"
          onClick={() => setIsAdding(!isAdding)}
          aria-label="Add to-do"
          aria-expanded={isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <Card tone="muted" padding="sm" className="flex flex-col gap-3">
              <Input
                size="sm"
                type="text"
                aria-label="Task title"
                placeholder="Task title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Input
                size="sm"
                type="datetime-local"
                aria-label="Due date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
              <div className="flex gap-1 rounded-koru-pill bg-koru-surface-container-high p-1 text-xs font-medium">
                <button
                  type="button"
                  aria-pressed={!shareMode}
                  onClick={() => setShareMode(false)}
                  className={`flex-1 rounded-koru-pill py-2 transition-colors duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${!shareMode ? "bg-koru-primary text-koru-on-primary shadow-koru-xs" : "text-koru-on-surface-variant hover:text-koru-on-surface"}`}
                >
                  Just me
                </button>
                <button
                  type="button"
                  aria-pressed={shareMode}
                  onClick={() => setShareMode(true)}
                  className={`flex-1 rounded-koru-pill py-2 transition-colors duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${shareMode ? "bg-koru-primary text-koru-on-primary shadow-koru-xs" : "text-koru-on-surface-variant hover:text-koru-on-surface"}`}
                >
                  Share with co-lecturers
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="text" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAdd}>
                  Add
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col">
        {loading ? (
          <>{[0, 1, 2].map(i => <SkeletonTodo key={i} />)}</>
        ) : todos.length === 0 ? (
          <div className="my-2 flex min-h-14 w-full items-center justify-center rounded-koru-md border border-dashed border-koru-outline-variant px-3 text-koru-caption text-koru-on-surface-variant">No tasks yet</div>
        ) : (
          <AnimatePresence>
            {todos.map((todo) => {
              const isAdminTodo  = !!todo.createdByAdminId;
              const isSharedTodo = !!todo.sharedByTeacherId;
              const colors = isAdminTodo ? theme.admin : isSharedTodo ? theme.shared : theme.teacher;
              return (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`my-2 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-koru-md px-3 py-2.5 ring-1 ring-inset ring-koru-outline-faint transition-all duration-300 ease-koru-out
                    ${todo.isCompleted ? "bg-koru-surface-container opacity-40" : "bg-koru-surface-container-lowest shadow-koru-card hover:shadow-koru-card-hover"}`}
                >
                  <div className="relative shrink-0">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${todo.isCompleted ? "bg-koru-surface-container-high" : colors.icon}`}>
                      <MdEditNote className={`h-5 w-5 ${todo.isCompleted ? "text-koru-outline" : colors.iconText}`} />
                    </div>
                    <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-koru-surface-container-lowest ${todo.isCompleted ? "bg-koru-outline-variant" : colors.dot}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-koru-label ${todo.isCompleted ? "text-koru-outline line-through" : "text-koru-on-surface"}`}>
                      {todo.title}
                    </h4>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-koru-caption text-koru-on-surface-variant">
                      {todo.dueDate && <span>{todo.dueDate}</span>}
                      {todo.courseCode && <span className="font-semibold text-koru-on-surface">{todo.courseCode}</span>}
                      {isAdminTodo && todo.createdByAdminName && (
                        <Badge variant={colors.badge}>{todo.createdByAdminName}</Badge>
                      )}
                      {isSharedTodo && todo.sharedByTeacherName && (
                        <Badge variant={colors.badge}>{todo.sharedByTeacherName}</Badge>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleToggle(todo.id); }}
                    aria-pressed={todo.isCompleted}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-koru-sm border-2 transition-all duration-200 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2
                      ${todo.isCompleted ? colors.checkbox : `border-koru-outline-variant ${colors.checkboxHover}`}`}
                    aria-label={`Toggle ${todo.title}`}
                  >
                    {todo.isCompleted && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="h-4 w-4 text-koru-on-primary"
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
        )}
      </div>

      {/* Progress section anchored to bottom of equalised card via mt-auto */}
      <h2 className="mb-4 mt-auto pt-8 font-display text-koru-heading text-koru-on-surface">Progress & Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <>{[0, 1].map(i => (
            <div key={i} className="p-4 flex flex-col items-center gap-3">
              <Skeleton variant="text" className="h-2.5 w-20" />
              <Skeleton variant="circle" className="h-28 w-28" />
            </div>
          ))}</>
        ) : (
          <>
            <div className="p-4 flex flex-col items-center">
              <span className="mb-2 text-koru-caption font-medium text-koru-primary/70">To-do</span>
              <ProgressRing percentage={progress} size={110} strokeWidth={8} />
            </div>
            <div className="p-4 flex flex-col items-center">
              <span className="mb-2 text-koru-caption font-medium text-koru-primary/70">Graded</span>
              <ProgressRing percentage={gradingProgress} size={110} strokeWidth={8} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
