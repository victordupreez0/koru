import React from "react";
import { Modal, Button, Input, Select } from "../../../components/UI";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);

export default function CreateCourseModal({ show, onClose, form, setForm, teachers, onCreate }) {
  if (!show) return null;

  const canCreate = form.name?.trim() && form.teacherId;

  return (
    <Modal
      open={show}
      onClose={onClose}
      title="New Course"
      description="Create a course and assign a lecturer"
      size="md"
      footer={
        <>
          <Button variant="tonal" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="filled" onClick={onCreate} disabled={!canCreate}>
            Create Course
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Course name + code */}
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input
            type="text"
            label="Course Name"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Interactive Development"
          />
          <Input
            type="text"
            label="Code"
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="DV300"
            className="uppercase tracking-wider"
          />
        </div>

        {/* Lecturer */}
        <Select
          label="Lecturer"
          value={form.teacherId}
          onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
        >
          <option value="">Select a lecturer…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </Select>

        {/* Year + Semester */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Year"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>

          <Select
            label="Semester"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
          >
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </Select>
        </div>

        {/* Capacity */}
        <Input
          type="number"
          label="Capacity"
          min={1}
          max={500}
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
      </div>
    </Modal>
  );
}
