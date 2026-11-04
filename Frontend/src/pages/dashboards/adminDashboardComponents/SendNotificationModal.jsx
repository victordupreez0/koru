import React, { useState } from "react";
import { Bell, Calendar, Clock, Check } from "lucide-react";
import { Avatar, Button, Input, Modal } from "../../../components/UI";
import { SearchInput } from "./SearchInput";

export function SendNotificationModal({ lecturers, onClose, onSend }) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  const filteredLecturers = lecturers.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLecturer = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (!title || !startTime || !endTime || selectedIds.length === 0) {
      alert("Please fill in all fields and select at least one lecturer.");
      return;
    }
    onSend({
      title,
      description,
      startTime,
      endTime,
      selectedIds,
      eventType: "Meeting",
      bgColor: "#3C0078", // event colour persisted with the calendar entry (data, not styling)
      textColor: "#ffffff"
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Send Notification"
      description="Schedule a meeting or send a notice to lecturers' calendars."
      size="lg"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} startIcon={<Bell className="h-4 w-4" />}>
            Send Notification
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {/* Left: Details */}
        <div className="space-y-5">
          <Input
            label="Subject / Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Faculty Meeting"
          />

          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            startIcon={<Calendar className="h-4 w-4" />}
          />
          <Input
            label="End Date & Time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            startIcon={<Clock className="h-4 w-4" />}
          />

          <div>
            <label htmlFor="send-notification-message" className="mb-1.5 block text-koru-label text-koru-on-surface-variant">Message (Optional)</label>
            <textarea
              id="send-notification-message"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about the meeting..."
              rows={3}
              className="w-full resize-none rounded-koru-xs bg-koru-surface-container-lowest px-4 py-3 text-sm text-koru-on-surface shadow-koru-xs outline-none transition placeholder:text-koru-on-surface-variant/70 hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary"
            />
          </div>
        </div>

        {/* Right: Lecturer Selection */}
        <div className="flex min-h-0 flex-col">
          <span className="mb-2 block text-koru-label text-koru-on-surface-variant">Select Lecturers ({selectedIds.length})</span>
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search names..." />
          </div>
          <div className="max-h-72 flex-1 space-y-2 overflow-y-auto pr-2">
            <Button
              variant="text"
              size="sm"
              onClick={() => {
                if (selectedIds.length === lecturers.length) setSelectedIds([]);
                else setSelectedIds(lecturers.map(l => l.id));
              }}
            >
              {selectedIds.length === lecturers.length ? "Deselect All" : "Select All"}
            </Button>
            {filteredLecturers.map((l) => {
              const selected = selectedIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleLecturer(l.id)}
                  className={`flex w-full items-center gap-3 rounded-koru-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
                    selected
                      ? "bg-koru-primary-container text-koru-on-primary-container"
                      : "bg-koru-surface-container-lowest text-koru-on-surface hover:bg-koru-surface-container"
                  }`}
                >
                  <Avatar user={l} name={l.name} size="sm" />
                  <span className="text-sm font-medium">{l.name}</span>
                  {selected && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-koru-primary text-koru-on-primary">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
