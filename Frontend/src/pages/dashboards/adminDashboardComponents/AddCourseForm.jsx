import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Select } from "../../../components/UI";

export function AddCourseForm({ lecturerName, subjects, onSave, onCancel }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [term, setTerm] = useState("Semester 1");

  const canSave = subjectId && term;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <Card variant="outlined" tone="surface" radius="lg" padding="sm" className="mb-3 flex flex-col gap-3">
        <Select
          size="sm"
          aria-label="Subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          autoFocus
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
          ))}
        </Select>
        <Select
          size="sm"
          aria-label="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
        </Select>
        <p className="text-xs text-koru-on-surface-variant">Lecturer: {lecturerName}</p>
        <div className="flex justify-end gap-2">
          <Button variant="text" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => canSave && onSave(subjectId, term)} disabled={!canSave}>Save</Button>
        </div>
      </Card>
    </motion.div>
  );
}
