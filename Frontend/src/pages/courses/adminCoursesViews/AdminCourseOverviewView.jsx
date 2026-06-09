import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Clock, Eye, Save, X, BarChart3 } from "lucide-react";
import { courseService, userService } from "../../../services/adminService";
import { getCourseStudentCount } from "../../../services/enrollmentService";
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

  // Quick stats
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

    getCourseStudentCount(course.id).then(setStudentCount).catch(() => setStudentCount(0));
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
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a course to view its overview.</div>;
  }

  const assignedTeacher = teachers.find(t => t.id === form.teacherId);

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Header */}
      <motion.header variants={slideUp} className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Course Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">{course.subject?.code} — {course.subject?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleDiscard}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 flex items-center gap-2"
            >
              <X size={15} /> Discard
            </motion.button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
              dirty
                ? "bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20 hover:bg-[#2a0055]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.header>

      {/* Stats row */}
      <motion.div variants={slideUp} className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Enrolled Students", value: studentCount ?? "—", icon: Users, color: "text-[#3C0078]", bg: "bg-[#3C0078]/5" },
          { label: "Groups", value: cohortCount ?? "—", icon: BookOpen, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Capacity", value: form.capacity, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-3xl font-black italic text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Core settings */}
        <motion.div variants={scaleIn} className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Course Settings</h3>

            {/* Teacher */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Assigned Faculty</label>
              <select
                value={form.teacherId}
                onChange={e => update("teacherId", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none"
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
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Semester</label>
                <select
                  value={form.term}
                  onChange={e => update("term", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none"
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Year</label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={form.year}
                  onChange={e => update("year", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
                />
              </div>
            </div>

            {/* Degree + Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Degree Programme</label>
                <select
                  value={form.degree}
                  onChange={e => update("degree", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10 appearance-none"
                >
                  <option value="">No degree assigned</option>
                  {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={form.capacity}
                  onChange={e => update("capacity", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
                />
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-gray-800">Course Visibility</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.isVisible ? "Published — students can see this course" : "Draft — hidden from students"}
                </p>
              </div>
              <button
                onClick={() => update("isVisible", !form.isVisible)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${form.isVisible ? "bg-[#3C0078]" : "bg-gray-300"}`}
              >
                <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isVisible ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Teacher card + Perspective actions */}
        <motion.div variants={scaleIn} className="space-y-4">
          {/* Teacher info card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Lead Faculty</h3>
            {assignedTeacher ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#3C0078] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#3C0078]/20 shrink-0">
                  {assignedTeacher.firstName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900">{assignedTeacher.firstName} {assignedTeacher.lastName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{assignedTeacher.email}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#3C0078]/5 text-[#3C0078]">
                  <BarChart3 size={18} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No faculty assigned to this course.</p>
            )}
          </div>

          {/* Subject info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Subject Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Code</span>
                <span className="text-xs font-black text-gray-900 px-3 py-1 rounded-full bg-[#3C0078]/5 text-[#3C0078]">{course.subject?.code || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Name</span>
                <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{course.subject?.name || "—"}</span>
              </div>
              {course.subject?.description && (
                <p className="text-xs text-gray-400 leading-relaxed mt-2 pt-3 border-t border-gray-100">{course.subject.description}</p>
              )}
            </div>
          </div>

          {/* Perspective view */}
          <div className="bg-[#3C0078] rounded-3xl p-6 text-white">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Perspective View</h3>
            <p className="text-sm font-medium text-white/80 mb-4">Preview this course as students or teachers see it.</p>
            <div className="flex gap-3">
              <a
                href={`/courses/${course.id}?viewAs=teacher`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-white/10 text-white text-[11px] font-black uppercase tracking-widest text-center hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={14} /> Teacher
              </a>
              <a
                href={`/courses/${course.id}?viewAs=student`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-white/10 text-white text-[11px] font-black uppercase tracking-widest text-center hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Eye size={14} /> Student
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
