import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MdEditNote } from "react-icons/md";
import Badge from "./Badge";
import Button from "./Button";

export default function AssignmentItem({
  title = "Assignment",
  dueDate = "Mar 2 at 20:00",
  courseCode = "UX300",
  completed = false,
  uiState = "",
  onToggle,
  assignmentId,
  courseId,
}) {
    const navigate = useNavigate();
    // Determine color based on uiState
    const getUiStateVariant = (state) => {
        if (state === "Late") return "error";
        if (state === "Due Soon") return "warning";
        if (state === "Closed") return "neutral";
        if (state === "Submitted" || completed) return "success";
        return "info";
    }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`my-2 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-koru-md px-3 py-2.5 transition-all duration-300 ease-koru-out
        ${completed ? "bg-koru-surface-container opacity-50" : "bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint hover:shadow-koru-card-hover"}`}
    >
      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full
          ${completed ? "bg-koru-surface-container-high" : "bg-koru-primary-container/60"}`}
      >
        <MdEditNote
          className={`h-5 w-5 ${completed ? "text-koru-outline" : "text-koru-primary"}`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4
          className={`text-koru-label ${completed ? "text-koru-outline line-through" : "text-koru-on-surface"
            }`}
        >
          {title}
        </h4>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-koru-caption text-koru-on-surface-variant">
          <span>Due {dueDate}</span>
          <span className="font-semibold text-koru-on-surface">{courseCode}</span>
          {uiState && !completed && (
              <Badge variant={getUiStateVariant(uiState)}>{uiState}</Badge>
          )}
        </p>
      </div>

      {/* Actions */}
      {completed ? (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-koru-sm border-2 border-koru-primary bg-koru-primary"
          aria-label="Completed"
        >
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
        </div>
      ) : (
        <Button
            size="sm"
            variant={uiState === 'Closed' ? "tonal" : "filled"}
            className="shrink-0"
            onClick={(e) => {
                e.stopPropagation();
                if (courseId && assignmentId) {
                    navigate(`/courses/${courseId}/assignments/${assignmentId}`);
                }
            }}
        >
            {uiState === 'Closed' ? 'View' : 'Submit'}
        </Button>
      )}
    </motion.div>
  );
}
