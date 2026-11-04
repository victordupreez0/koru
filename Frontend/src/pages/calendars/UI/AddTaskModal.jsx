import React, { useState, useEffect } from "react";
import { Button, Input, Modal, Select } from "../../../components/UI";

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
export default function AddTaskModal({ open, onClose, onAdd, defaultDate = "", editEvent = null, courses = [] }) {
  const isEditing = !!editEvent;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [courseId, setCourseId] = useState("");

  // Populate form when modal opens (new or edit)
  useEffect(() => {
    if (!open) return;
    if (editEvent) {
      setTitle(editEvent.title || "");
      setDate(editEvent.date || defaultDate || "");
      setStartTime(editEvent.startTime || "09:00");
      setEndTime(editEvent.endTime || "10:00");
      setCourseId(editEvent.courseId || courses[0]?.id || "");
    } else {
      setTitle("");
      setDate(defaultDate || "");
      setStartTime("09:00");
      setEndTime("10:00");
      setCourseId(courses[0]?.id || "");
    }
  }, [open, editEvent, defaultDate, courses]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date || !courseId) return;
    onAdd({
      id: isEditing ? editEvent.id : null,
      title: title.trim(),
      startTime: new Date(`${date}T${startTime}`).toISOString(),
      endTime: new Date(`${date}T${endTime}`).toISOString(),
      courseId,
      description: editEvent?.description || "",
      lecturer: editEvent?.lecturer || "",
      location: editEvent?.location || "",
    });
    onClose();
  }

  const titleNode = (
    <span className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-koru-lg bg-koru-accent-soft flex items-center justify-center text-koru-accent-ink shrink-0">
        {isEditing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        )}
      </span>
      <span>{isEditing ? "Edit Task" : "Add Task"}</span>
    </span>
  );

  return (
    <Modal open={open} onClose={onClose} size="sm" title={titleNode}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Review lesson plan"
        />

        <Select
          label="Course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          required
        >
          <option value="" disabled>Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.subject?.code} - {course.subject?.name} ({course.term})
            </option>
          ))}
        </Select>

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="flex gap-3">
          <Input
            label="Start"
            type="time"
            containerClassName="flex-1"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End"
            type="time"
            containerClassName="flex-1"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="outlined" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {isEditing ? "Save Changes" : "Add Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
