import React, { useState } from "react";
import { MdDelete } from "react-icons/md";
import { Button, Input, Modal, Select } from "./UI";

// Event modal – opens when you click an event or an empty slot
// Closes on backdrop click or Escape (handled by <Modal>)
// mode: "create" or "edit"
export default function EventModal({ mode, event, onSave, onDelete, onClose }) {
  // Form state – pre-filled when editing, blank when creating
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.extendedProps?.description || "");
  const [eventType, setEventType] = useState(event?.extendedProps?.eventType || "");
  const [start, setStart] = useState(formatForInput(event?.start));
  const [end, setEnd] = useState(formatForInput(event?.end));
  const [bgColor, setBgColor] = useState(event?.backgroundColor || "#3C0078");
  const [courseId, setCourseId] = useState(event?.extendedProps?.courseId || "");

  // Submit the form – builds the event object and calls onSave
  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      id: event?.id || undefined,
      title,
      description,
      eventType,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      createdBy: event?.extendedProps?.createdBy || "",
      courseId,
      bgColor,
      textColor: "#ffffff",
    });
  }

  const textareaClass =
    "w-full resize-none rounded-koru-xs bg-koru-surface-container-lowest px-4 py-3 text-sm text-koru-on-surface shadow-koru-xs outline-none transition placeholder:text-koru-on-surface-variant/70 hover:bg-koru-surface focus:ring-1 focus:ring-inset focus:ring-koru-primary";

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "create" ? "New Event" : "Edit Event"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. DV300 – Theory"
        />

        <div>
          <label
            htmlFor="event-modal-description"
            className="mb-1.5 block text-koru-label text-koru-on-surface-variant"
          >
            Description
          </label>
          <textarea
            id="event-modal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={textareaClass}
            placeholder="Optional details…"
          />
        </div>

        <Select
          label="Event Type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">Select type…</option>
          <option value="Lecture">Lecture</option>
          <option value="Tutorial">Tutorial</option>
          <option value="Workshop">Workshop</option>
          <option value="Assignment">Assignment Due</option>
          <option value="Exam">Exam</option>
          <option value="Meeting">Meeting</option>
          <option value="Other">Other</option>
        </Select>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
          <Input
            label="End"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="event-modal-colour"
              className="mb-1.5 block text-koru-label text-koru-on-surface-variant"
            >
              Colour
            </label>
            <input
              id="event-modal-colour"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-12 w-full cursor-pointer rounded-koru-xs bg-koru-surface-container-lowest p-1 shadow-koru-xs"
            />
          </div>
          <Input
            label="Course ID"
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. course-123"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {mode === "edit" ? (
            <Button
              type="button"
              variant="error"
              startIcon={<MdDelete className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onDelete(event.id)}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <Button type="submit">
            {mode === "create" ? "Create Event" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Convert an ISO string or date string to "YYYY-MM-DDTHH:mm" for datetime-local inputs
function formatForInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 16); // fallback
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
