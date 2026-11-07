import React, { useState } from "react";
import { Button, Input, Modal } from "../../../components/UI";

export function AddTodoModal({ lecturer, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim() && dueDate;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), dueDate, courseCode: courseCode.trim() || "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add To Do"
      description={lecturer.name}
      size="sm"
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Adding…" : "Add To Do"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Task Title"
          type="text"
          placeholder="e.g. Grade submissions for Week 5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Input
          label={
            <>
              Course Code <span className="text-koru-caption text-koru-on-surface-variant/70">(optional)</span>
            </>
          }
          type="text"
          placeholder="e.g. IXD300"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </div>
    </Modal>
  );
}
