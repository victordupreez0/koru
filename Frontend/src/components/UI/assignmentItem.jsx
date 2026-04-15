import { motion } from "framer-motion";
import { MdEditNote } from "react-icons/md";

export default function AssignmentItem({
  title = "Assignment",
  dueDate = "Mar 2 at 20:00",
  courseCode = "UX300",
  completed = false,
  onToggle,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-300 cursor-pointer
        ${completed ? "bg-gray-50 border-gray-100 opacity-50" : "bg-white border-gray-200 hover:shadow-md"}`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${completed ? "bg-gray-100" : "bg-[#3C0078]/8"}`}
      >
        <MdEditNote
          className={`w-5 h-5 ${completed ? "text-gray-400" : "text-[#3C0078]"}`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4
          className={`text-base font-semibold leading-tight font-['Gabarito'] ${completed ? "text-gray-400 line-through" : "text-black"
            }`}
        >
          {title}
        </h4>
        <p className="text-xs text-gray-400 mt-0.5">
          <span className="font-bold text-gray-500">DUE</span> {dueDate}
          <span className="ml-2 font-bold text-black">{courseCode}</span>
        </p>
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 bg-transparent p-0 transition-colors duration-200
          ${completed ? "border-[#3C0078] bg-[#3C0078]" : "border-gray-300 hover:border-gray-400"}`}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      >
        {completed && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-4 h-4 text-[#3C0078]"
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
}
