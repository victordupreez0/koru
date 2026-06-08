import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";

const DEGREES = [
  "UX Design Degree",
  "Software Engineering Degree",
  "Visual Arts Degree",
  "Interaction Design Degree",
  "Design Leadership Degree"
];

export default function CreateCourseModal({ show, onClose, form, setForm, subjects, teachers, onCreate }) {
  if (!show) return null;

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
        className="relative w-full max-w-[1400px] h-fit max-h-[90vh] bg-white rounded-3xl shadow-[0_32px_128px_-16px_rgba(60,0,120,0.3)] overflow-hidden flex flex-col"
      >
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column: Context & Subject Info */}
            <div className="md:w-[500px] bg-gray-50 border-r border-gray-100 p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-8">
                    <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all group">
                      <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-[#3C0078]/5 text-[10px] font-black tracking-widest text-[#3C0078] uppercase rounded-lg">New Entry</span>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Name</label>
                          <input 
                            type="text"
                            value={form.subjectName || subjects.find(s => s.id === form.subjectId)?.name || ""}
                            onChange={(e) => setForm({...form, subjectName: e.target.value})}
                            placeholder="Enter subject name"
                            className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-[16px] font-black text-[#3C0078] focus:ring-2 focus:ring-[#3C0078]/10 transition-all outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Code</label>
                          <div className="relative">
                            <select 
                              value={form.subjectId}
                              onChange={(e) => setForm({...form, subjectId: e.target.value})}
                              className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-[14px] font-bold text-gray-600 focus:ring-2 focus:ring-[#3C0078]/10 transition-all outline-none appearance-none"
                            >
                              {[100, 200, 300].map(code => <option key={code} value={code}>{code}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Course Description</label>
                          <div className="p-6 rounded-2xl bg-white border border-gray-100 text-[16px] font-medium text-gray-500 leading-relaxed shadow-sm">
                            {subjects.find(s => s.id === form.subjectId)?.description || "Select a subject to see its description."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 pt-8 border-t border-gray-200/60">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Status</label>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setForm({...form, status: "Active"})}
                            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${form.status === "Active" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                          >Active</button>
                          <button 
                            onClick={() => setForm({...form, status: "Inactive"})}
                            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${form.status === "Inactive" ? "shadow-inner bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}
                          >Inactive</button>
                        </div>
                      </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Detailed Configuration */}
            <div className="flex-1 p-10 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Lecturer Assignment</label>
                          <div className="relative">
                            <select 
                              className="w-full px-8 py-3.5 rounded-2xl bg-gray-50 border-none text-[15px] font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                              value={form.teacherId}
                              onChange={(e) => setForm({...form, teacherId: e.target.value})}
                            >
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>)}
                            </select>
                            <ChevronDown size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Degree Program</label>
                          <div className="space-y-3">
                            <div className="relative">
                              <select 
                                className="w-full px-8 py-3.5 rounded-2xl bg-gray-50 border-none text-[15px] font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                                value={form.degree}
                                onChange={(e) => setForm({...form, degree: e.target.value})}
                              >
                                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <ChevronDown size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="px-4 text-[10px] font-medium text-gray-400 leading-relaxed">
                              * All learners assigned to this degree will be automatically assigned to this course.
                            </p>
                          </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Academic Year</label>
                        <div className="relative">
                          <select 
                            value={form.year}
                            onChange={(e) => setForm({...form, year: e.target.value})}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                          >
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y===1 ? "st" : y===2 ? "nd" : y===3 ? "rd" : "th"} Year</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Active Semester</label>
                        <div className="relative">
                          <select 
                            value={form.term}
                            onChange={(e) => setForm({...form, term: e.target.value})}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                          >
                            {["Semester 1", "Semester 2"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Capacity</label>
                         <input 
                            type="number"
                            value={form.capacity}
                            onChange={(e) => setForm({...form, capacity: e.target.value})}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all"
                         />
                      </div>
                    </div>
                </div>

                <div className="flex gap-6 mt-10 font-sans">
                    <button 
                      disabled={!form.subjectId || !form.teacherId}
                      onClick={onCreate}
                      className="flex-[2] py-4 rounded-3xl bg-[#3C0078] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-[#3C0078]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      Create Subject Registry
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
