import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X } from "lucide-react";
import { courseService, userService, enrollmentService } from "../../../services/adminService";
import { getCourseCohorts } from "../../../services/classGroupService";
import { staggerContainer, slideUp, scaleIn } from "../teacherCoursesComponents/constants";

const DEGREES = [
  "UX Design Degree",
  "Software Engineering Degree",
  "Visual Arts Degree",
  "Interaction Design Degree",
  "Design Leadership Degree",
];

export function AdminCourseOverviewView({ course, onSaved }) {
  const [teachers, setTeachers] = useState([]);
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
      teacherId: course.teacherId || "",
      term: course.term || "Semester 1",
      year: course.year || new Date().getFullYear(),
      degree: course.degree || "",
      capacity: course.capacity || 30,
      isVisible: course.isVisible ?? false,
    });
    setDirty(false);

    enrollmentService.getAllEnrollments()
      .then(all => setStudentCount((all || []).filter(e => e.courseId === course.id || e.course?.id === course.id).length))
      .catch(() => setStudentCount(0));
    getCourseCohorts(course.id).then(c => setCohortCount(c.length)).catch(() => setCohortCount(0));
  }, [course?.id]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form || !course) return;
    setSaving(true);
    try {
      await courseService.updateCourse(course.id, {
        subjectId: course.subjectId,
        teacherId: form.teacherId,
        term: form.term,
        year: parseInt(form.year),
        capacity: parseInt(form.capacity),
        degree: form.degree,
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
      teacherId: course.teacherId || "",
      term: course.term || "Semester 1",
      year: course.year || new Date().getFullYear(),
      degree: course.degree || "",
      capacity: course.capacity || 30,
      isVisible: course.isVisible ?? false,
    });
    setDirty(false);
  };

  if (!course || !form) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a course to view its overview.
      </div>
    );
  }

  const assignedTeacher = teachers.find(t => t.id === form.teacherId);
  const enrollFill = form.capacity > 0 ? Math.min(Math.round(((studentCount ?? 0) / form.capacity) * 100), 100) : 0;

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.header variants={slideUp} className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {course.subject?.code}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
            {course.subject?.name || "Course Overview"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {form.term} · {form.year}
            {form.degree ? ` · ${form.degree}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {dirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleDiscard}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X size={14} /> Discard
            </motion.button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              dirty
                ? "bg-[#3C0078] text-white hover:bg-[#2a0055]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.header>

      {/* Stats strip */}
      <motion.div variants={slideUp} className="grid grid-cols-3 divide-x divide-gray-100 bg-white border border-gray-100 rounded-3xl mb-5 overflow-hidden">
        {[
          { label: "Enrolled", value: studentCount ?? "—" },
          { label: "Groups", value: cohortCount ?? "—" },
          { label: "Capacity", value: form.capacity },
        ].map(stat => (
          <div key={stat.label} className="px-6 py-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Enrollment fill bar */}
      {studentCount !== null && (
        <motion.div variants={slideUp} className="mb-5 bg-white border border-gray-100 rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-bold text-gray-500">Enrollment Capacity</p>
            <p className="text-xs font-bold text-gray-900 tabular-nums">{studentCount} / {form.capacity} · {enrollFill}%</p>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3C0078] rounded-full transition-all duration-500"
              style={{ width: `${enrollFill}%` }}
            />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Course Settings */}
        <motion.div variants={scaleIn} className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Course Settings</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Teacher */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Assigned Faculty</label>
              <select
                value={form.teacherId}
                onChange={e => update("teacherId", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none cursor-pointer"
              >
                <option value="">No teacher assigned</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>

            {/* Term + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Semester</label>
                <select
                  value={form.term}
                  onChange={e => update("term", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none cursor-pointer"
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Year</label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={form.year}
                  onChange={e => update("year", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
                />
              </div>
            </div>

            {/* Degree + Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Degree Programme</label>
                <select
                  value={form.degree}
                  onChange={e => update("degree", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none cursor-pointer"
                >
                  <option value="">No degree assigned</option>
                  {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.capacity}
                  onChange={e => update("capacity", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
                />
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Course Visibility</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.isVisible ? "Published — visible to students" : "Draft — hidden from students"}
                </p>
              </div>
              <button
                onClick={() => update("isVisible", !form.isVisible)}
                aria-pressed={form.isVisible}
                aria-label={form.isVisible ? "Hide course from students" : "Publish course to students"}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 cursor-pointer ${
                  form.isVisible ? "bg-[#3C0078]" : "bg-gray-200"
                }`}
              >
                <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isVisible ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Faculty + Subject */}
        <motion.div variants={scaleIn} className="space-y-4">
          {/* Faculty card */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Faculty</h3>
            </div>
            <div className="px-6 py-5">
              {assignedTeacher ? (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#3C0078] text-white flex items-center justify-center font-bold text-sm shrink-0 select-none">
                    {assignedTeacher.firstName?.[0]}{assignedTeacher.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{assignedTeacher.firstName} {assignedTeacher.lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{assignedTeacher.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No faculty assigned to this course.</p>
              )}
            </div>
          </div>

          {/* Subject info */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-gray-400 shrink-0">Code</span>
                <span className="text-xs font-bold text-[#3C0078] px-2.5 py-1 rounded-lg bg-[#3C0078]/5 shrink-0">
                  {course.subject?.code || "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-semibold text-gray-400 shrink-0">Name</span>
                <span className="text-sm font-semibold text-gray-900 text-right leading-snug">
                  {course.subject?.name || "—"}
                </span>
              </div>
              {course.subject?.description && (
                <p className="text-xs text-gray-400 leading-relaxed pt-3 border-t border-gray-100">
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
