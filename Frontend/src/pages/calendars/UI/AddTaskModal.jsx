import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AddTaskModal
 *
 * Props:
 *  - open        (boolean)  : whether the modal is visible
 *  - onClose     (function) : called to close without saving
 *  - onAdd       (function) : called with the event object on submit (new or edited)
 *  - defaultDate (string)   : optional YYYY-MM-DD to pre-fill the date field
 *  - editEvent   (object)   : when set, the modal opens in edit mode pre-filled with this event
 */
export default function AddTaskModal({ open, onClose, onAdd, defaultDate = "", editEvent = null }) {
  const isEditing = !!editEvent;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Populate form when modal opens (new or edit)
  useEffect(() => {
    if (!open) return;
    if (editEvent) {
      setTitle(editEvent.title || "");
      setDate(editEvent.date || defaultDate || "");
      setStartTime(editEvent.startTime || "09:00");
      setEndTime(editEvent.endTime || "10:00");
    } else {
      setTitle("");
      setDate(defaultDate || "");
      setStartTime("09:00");
      setEndTime("10:00");
    }
  }, [open, editEvent, defaultDate]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    onAdd({
      id: isEditing ? editEvent.id : `task-local-${Date.now()}`,
      date,
      title: title.trim(),
      startTime,
      endTime,
      type: "task",
      lecturer: editEvent?.lecturer || "",
      location: editEvent?.location || "",
    });
    onClose();
  }

  function handleBackdropClick() {
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                {isEditing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                )}
              </div>
              <h2 className="font-['Gabarito'] text-xl font-bold text-gray-900">{isEditing ? "Edit Task" : "Add Task"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Review lesson plan"
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-400 transition"
                />
              </div>

              {/* Time row */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-400 transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  {isEditing ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
