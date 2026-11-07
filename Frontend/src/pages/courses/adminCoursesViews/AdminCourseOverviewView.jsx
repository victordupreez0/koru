import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X, User, BookOpen, Users, GraduationCap, Plus } from "lucide-react";
import { courseService, userService, enrollmentService } from "../../../services/adminService";
import { getCourseLecturers } from "../../../services/courseService";
import { getCourseCohorts } from "../../../services/classGroupService";
import { staggerContainer, slideUp, scaleIn } from "../teacherCoursesComponents/constants";
import { Avatar, Button, Card, Input, Select, Badge } from "../../../components/UI";

export function AdminCourseOverviewView({ course, onSaved }) {
  const [teachers, setTeachers] = useState([]);
  const [courseLecturers, setCourseLecturers] = useState([]);
  const [lecturerIds, setLecturerIds] = useState([""]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [studentCount, setStudentCount] = useState(null);
  const [cohortCount, setCohortCount] = useState(null);

  useEffect(() => {
    userService.getTeachers().then(setTeachers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!course) return;
    setForm({
      year: course.year || new Date().getFullYear(),
      capacity: course.capacity || 30,
      isVisible: course.isVisible ?? false,
    });
    setLecturerIds([course.teacherId || ""]);
    setDirty(false);

    enrollmentService.getAllEnrollments()
      .then(all => setStudentCount((all || []).filter(e => e.courseId === course.id || e.course?.id === course.id).length))
      .catch(() => setStudentCount(0));
    getCourseCohorts(course.id).then(c => setCohortCount(c.length)).catch(() => setCohortCount(0));
    getCourseLecturers(course.id).then(l => {
      const loaded = l || [];
      setCourseLecturers(loaded);
      setLecturerIds(loaded.length > 0 ? loaded.map(t => t.id) : [course.teacherId || ""]);
    }).catch(() => {
      setCourseLecturers([]);
    });
  }, [course?.id]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const setLecturerId = (index, value) => {
    setLecturerIds(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setDirty(true);
  };

  const addLecturerRow = () => {
    setLecturerIds(prev => [...prev, ""]);
    setDirty(true);
  };

  const removeLecturerRow = (index) => {
    setLecturerIds(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form || !course) return;
    setSaving(true);
    try {
      await courseService.updateCourse(course.id, {
        subjectId: course.subjectId,
        teacherId: lecturerIds[0] || "",
        term: course.term,
        year: parseInt(form.year),
        capacity: parseInt(form.capacity),
        isVisible: form.isVisible,
      });
      setDirty(false);
      onSaved?.();
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!course) return;
    setForm({
      year: course.year || new Date().getFullYear(),
      capacity: course.capacity || 30,
      isVisible: course.isVisible ?? false,
    });
    setLecturerIds(courseLecturers.length > 0 ? courseLecturers.map(t => t.id) : [course.teacherId || ""]);
    setDirty(false);
  };

  if (!course || !form) {
    return (
      <div className="flex-1 flex items-center justify-center text-koru-on-surface-variant text-sm">
        Select a course to view its overview.
      </div>
    );
  }

  const enrollFill = form.capacity > 0 ? Math.min(Math.round(((studentCount ?? 0) / form.capacity) * 100), 100) : 0;


  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.header variants={slideUp} className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">
              {course.subject?.code || course.code}
            </span>
            <span className="text-koru-caption text-koru-outline">·</span>
            <span className="text-koru-caption font-medium text-koru-on-surface-variant">{course.term}</span>
            <span className="text-koru-caption text-koru-outline">·</span>
            <span className="text-koru-caption font-medium text-koru-on-surface-variant">{course.year}</span>
          </div>
          <h1 className="text-2xl font-medium font-display tracking-tight text-koru-on-surface leading-tight">
            {course.subject?.name || course.name || "Course Overview"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {dirty && (
            <Button variant="outlined" onClick={handleDiscard} startIcon={<X size={14} aria-hidden="true" />}>
              Discard
            </Button>
          )}
          <Button
            variant="filled"
            onClick={handleSave}
            disabled={!dirty || saving}
            startIcon={<Save size={14} aria-hidden="true" />}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </motion.header>

      {/* Stats strip */}
      <motion.div variants={slideUp} className="grid grid-cols-3 divide-x divide-koru-outline-faint bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl mb-5 overflow-hidden">
        {[
          { label: "Enrolled", value: studentCount ?? "—", icon: Users },
          { label: "Groups", value: cohortCount ?? "—", icon: GraduationCap },
          { label: "Capacity", value: form.capacity, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="px-6 py-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-koru-lg bg-koru-primary-container flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-koru-primary" />
            </div>
            <div>
              <p className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant mb-0.5">{label}</p>
              <p className="text-2xl font-medium text-koru-on-surface tabular-nums leading-none">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Enrollment fill bar */}
      {studentCount !== null && (
        <motion.div variants={slideUp} className="mb-5 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl px-6 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-medium text-koru-on-surface-variant">Enrollment Capacity</p>
            <p className="text-xs font-medium text-koru-on-surface tabular-nums">{studentCount} / {form.capacity} · {enrollFill}%</p>
          </div>
          <div className="h-1.5 bg-koru-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                enrollFill >= 90 ? "bg-koru-error" : enrollFill >= 70 ? "bg-koru-warning" : "bg-koru-primary"
              }`}
              style={{ width: `${enrollFill}%` }}
            />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Course Settings */}
        <motion.div variants={scaleIn} className="bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-koru-outline-faint">
            <h3 className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Course Settings</h3>
          </div>
          <div className="px-6 py-5 space-y-4">

            {/* Lecturer rows */}
            <div>
              <label className="text-xs font-medium text-koru-on-surface-variant uppercase tracking-widest block mb-2">
                Lecturers
              </label>
              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {lecturerIds.map((tid, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-1">
                        <Select
                          aria-label={`Lecturer ${idx + 1}`}
                          size="sm"
                          value={tid}
                          onChange={e => setLecturerId(idx, e.target.value)}
                        >
                          <option value="">No lecturer assigned</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                          ))}
                        </Select>
                      </div>
                      {lecturerIds.length > 1 && (
                        <Button
                          variant="text"
                          size="icon"
                          onClick={() => removeLecturerRow(idx)}
                          title="Remove lecturer"
                          aria-label="Remove lecturer"
                        >
                          <X size={14} aria-hidden="true" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button
                  variant="text"
                  size="sm"
                  onClick={addLecturerRow}
                  className="w-fit"
                  startIcon={<Plus size={13} aria-hidden="true" />}
                >
                  Add another lecturer
                </Button>
              </div>
            </div>

            {/* Year + Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                size="sm"
                type="number"
                min={2020}
                max={2035}
                value={form.year}
                onChange={e => update("year", e.target.value)}
              />
              <Input
                label="Capacity"
                size="sm"
                type="number"
                min={1}
                max={500}
                value={form.capacity}
                onChange={e => update("capacity", e.target.value)}
              />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-koru-outline-faint">
              <div>
                <p className="text-sm font-medium text-koru-on-surface">Course Visibility</p>
                <p className="text-xs text-koru-on-surface-variant mt-0.5">
                  {form.isVisible ? "Published — visible to students" : "Draft — hidden from students"}
                </p>
              </div>
              <button
                onClick={() => update("isVisible", !form.isVisible)}
                aria-pressed={form.isVisible}
                className={`w-11 h-6 rounded-full transition-colors motion-reduce:transition-none flex items-center px-0.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 ${
                  form.isVisible ? "bg-koru-primary" : "bg-koru-surface-container-highest"
                }`}
              >
                <span className={`w-5 h-5 bg-koru-surface-container-lowest rounded-full shadow-koru-xs transition-transform motion-reduce:transition-none ${form.isVisible ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Lecturers + Subject */}
        <motion.div variants={scaleIn} className="space-y-4">
          {/* Lecturers card */}
          <div className="bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-koru-outline-faint">
              <h3 className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Lecturers</h3>
            </div>
            <div className="px-6 py-5 flex flex-col gap-2">
              {courseLecturers.length > 0 ? (
                courseLecturers.map(t => (
                  <div key={t.id} className="flex items-center gap-3.5 p-3 rounded-koru-lg bg-koru-primary-subtle">
                    <Avatar user={t} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-koru-on-surface">{t.firstName} {t.lastName}</p>
                      <p className="text-xs text-koru-on-surface-variant mt-0.5 truncate">{t.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-koru-md bg-koru-surface-container-high flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-koru-outline" />
                  </div>
                  <p className="text-sm text-koru-on-surface-variant">No lecturer assigned to this course.</p>
                </div>
              )}
            </div>
          </div>

          {/* Subject info */}
          <div className="bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-koru-outline-faint">
              <h3 className="text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Subject</h3>
            </div>
            <div className="px-6 py-5 space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-koru-on-surface-variant">Code</span>
                <Badge variant="primary">{course.subject?.code || course.code || "—"}</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-koru-on-surface-variant shrink-0">Name</span>
                <span className="text-sm font-medium text-koru-on-surface text-right leading-snug">
                  {course.subject?.name || course.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-koru-on-surface-variant">Term</span>
                <Badge variant="neutral">{course.term || "—"}</Badge>
              </div>
              {course.subject?.description && (
                <p className="text-xs text-koru-on-surface-variant leading-relaxed pt-3 border-t border-koru-outline-faint">
                  {course.subject.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
