import React from "react";
import { motion } from "framer-motion";
import { X, ChevronDown } from "lucide-react";

const DEGREES = [
  "Software Engineering Degree",
  "UX Design Degree",
  "Visual Arts Degree",
  "Interaction Design Degree",
  "Design Leadership Degree",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);

export default function CreateCourseModal({ show, onClose, form, setForm, subjects, teachers, onCreate }) {
  if (!show) return null;

  const selectedSubject = subjects.find(s => s.id === form.subjectId);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0A0510]/80 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-[1100px] h-fit max-h-[90vh] bg-white rounded-3xl shadow-[0_32px_128px_-16px_rgba(60,0,120,0.3)] overflow-hidden flex flex-col"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Column */}
          <div className="md:w-[420px] bg-gray-50 border-r border-gray-100 p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <div className="space-y-1">
                <span className="px-3 py-1 bg-[#3C0078]/5 text-[10px] font-black tracking-widest text-[#3C0078] uppercase rounded-lg inline-block">New Course</span>
                <h2 className="text-2xl font-black font-['Gabarito'] text-gray-900 pt-2">Create Course</h2>
                <p className="text-sm text-gray-400">Choose an existing subject and configure the course details.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Subject</label>
                <div className="relative">
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[#3C0078]/10 focus:border-[#3C0078] transition-all outline-none appearance-none"
                  >
                    <option value="">Select a subject…</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code} — ${s.name}` : s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              {selectedSubject?.description && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Description</label>
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 text-sm text-gray-500 leading-relaxed">
                    {selectedSubject.description}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200/60 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Course Status</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForm({ ...form, status: "Active" })}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${form.status === "Active" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                  >Active</button>
                  <button
                    onClick={() => setForm({ ...form, status: "Inactive" })}
                    className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${form.status === "Inactive" ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}
                  >Inactive</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Lecturer Assignment</label>
                  <div className="relative">
                    <select
                      value={form.teacherId}
                      onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 text-sm font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                    >
                      <option value="">Select a lecturer…</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Degree Program</label>
                  <div className="relative">
                    <select
                      value={form.degree}
                      onChange={(e) => setForm({ ...form, degree: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 text-sm font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                    >
                      {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Year</label>
                  <div className="relative">
                    <select
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Semester</label>
                  <div className="relative">
                    <select
                      value={form.term}
                      onChange={(e) => setForm({ ...form, term: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Capacity</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                disabled={!form.subjectId || !form.teacherId}
                onClick={onCreate}
                className="flex-[2] py-4 rounded-3xl bg-[#3C0078] text-white font-black uppercase tracking-widest text-[13px] shadow-xl shadow-[#3C0078]/20 hover:bg-[#2a0055] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Create Course
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-3xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-[13px] hover:bg-gray-50 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
