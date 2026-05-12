import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Users, BookOpen, Clock, 
  TrendingUp, CheckCircle, X,
  ChevronRight, Calendar, MapPin, ChevronDown
} from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

// ── Dummy Data ──
const DUMMY_COURSES = [
  {
    id: 1,
    subject: { name: "Advanced Interaction Design", code: "IXD402" },
    teacher: { id: "t1", firstName: "Sarah", lastName: "Conner", email: "s.conner@edu.com" },
    year: "3rd Year",
    term: "Semester 1",
    capacity: 45,
    enrolled: 42,
    status: "Active",
    degree: "UX Design Degree",
    description: "Deep dive into cognitive ergonomics and tactile feedback loops in modern interfaces. Focuses on advanced user psychology and interaction patterns.",
    schedule: "Mon & Wed • 10:00 AM - 12:00 PM",
    room: "Studio 4A"
  },
  {
    id: 2,
    subject: { name: "Frontend Development III", code: "FED301" },
    teacher: { id: "t2", firstName: "Marcus", lastName: "Wright", email: "m.wright@edu.com" },
    year: "3rd Year",
    term: "Semester 1",
    capacity: 60,
    enrolled: 58,
    status: "Active",
    degree: "Interaction Design Degree",
    description: "Advanced React concepts, state management with Redux/Zustand, and complex frontend architectures.",
    schedule: "Tue & Thu • 02:00 PM - 04:00 PM",
    room: "Lab 2B"
  },
  {
    id: 3,
    subject: { name: "Creative Computing", code: "CC101" },
    teacher: { id: "t3", firstName: "Kyle", lastName: "Reese", email: "k.reese@edu.com" },
    year: "1st Year",
    term: "Semester 2",
    capacity: 100,
    enrolled: 95,
    status: "Active",
    degree: "Digital Arts Degree",
    description: "Introduction to generative art, p5.js, and computational creativity for visual communication.",
    schedule: "Fri • 09:00 AM - 01:00 PM",
    room: "Great Hall"
  },
  {
    id: 4,
    subject: { name: "Visual Communication Design", code: "VCD201" },
    teacher: { id: "t4", firstName: "John", lastName: "Connor", email: "j.connor@edu.com" },
    year: "2nd Year",
    term: "Semester 1",
    capacity: 50,
    enrolled: 48,
    status: "Active",
    degree: "UX Design Degree",
    description: "Principles of typography, color theory, and layout applied to digital and physical products.",
    schedule: "Wed • 01:00 PM - 05:00 PM",
    room: "Studio 1C"
  }
];

const TEACHERS = [
  { id: "t1", firstName: "Sarah", lastName: "Conner", email: "s.conner@edu.com" },
  { id: "t2", firstName: "Marcus", lastName: "Wright", email: "m.wright@edu.com" },
  { id: "t3", firstName: "Kyle", lastName: "Reese", email: "k.reese@edu.com" },
  { id: "t4", firstName: "John", lastName: "Connor", email: "j.connor@edu.com" },
  { id: "t5", firstName: "Ellen", lastName: "Ripley", email: "e.ripley@edu.com" }
];

const DEGREES = [
  "UX Design Degree",
  "Interaction Design Degree",
  "Digital Arts Degree",
  "Film & Media Degree",
  "Creative Computing Degree"
];

function StatCard({ label, value, icon: Icon, trend, accent = false }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-[24px] p-6 flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${accent ? "bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20" : "bg-white border border-gray-100 shadow-sm"}`}
    >
      <div className="flex justify-between items-start">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${accent ? "bg-white/10" : "bg-[#3C0078]/5"}`}>
          <Icon size={20} className={accent ? "text-white" : "text-[#3C0078]"} />
        </span>
        {trend && <div className={`text-[11px] font-black ${accent ? "text-white/60" : "text-[#3C0078]"}`}>{trend}</div>}
      </div>
      <div>
        <span className={`text-[11px] font-black uppercase tracking-[0.15em] block mb-1 ${accent ? "text-white/50" : "text-gray-400"}`}>{label}</span>
        <span className={`text-3xl font-black ${accent ? "text-white" : "text-gray-900"}`}>{value}</span>
      </div>
    </motion.div>
  );
}

function FilterDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3.5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:border-[#3C0078]/20 transition-all min-w-[170px]"
      >
        <div className="flex-1 text-left">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">{label}</span>
          <span className="text-[13px] font-black text-gray-900 leading-none">{value}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-[24px] shadow-2xl z-[110] overflow-hidden p-2"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-5 py-3 rounded-[16px] text-[12px] font-black uppercase tracking-wider transition-colors ${value === opt ? "bg-[#3C0078] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-[#3C0078]"}`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState(DUMMY_COURSES);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterSemester, setFilterSemester] = useState("All Semesters");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Handle opening modal for viewing
  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setEditForm({ ...course });
    setIsEditing(false);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    setCourses(prev => prev.map(c => c.id === editForm.id ? editForm : c));
    setSelectedCourse(editForm);
    setIsEditing(false);
  };

  // Handle delete course
  const handleDeleteCourse = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setSelectedCourse(null);
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.subject.name.toLowerCase().includes(search.toLowerCase()) || 
                           course.subject.code.toLowerCase().includes(search.toLowerCase());
      const matchesYear = filterYear === "All Years" || course.year === filterYear;
      const matchesSemester = filterSemester === "All Semesters" || course.term === filterSemester;
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [courses, search, filterYear, filterSemester]);

  return (
    <div className="relative min-h-screen flex flex-col font-sans">
      <Menu />
      <SideMenu />

      <main className="flex-1 w-full max-w-[1700px] mx-auto pt-16 px-12 pb-24 space-y-10">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-5 bg-[#3C0078] rounded-full"></div>
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3C0078] opacity-60">System Registry</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-none">Course <span className="text-[#3C0078]">Management</span></h1>
            </div>
            <button onClick={() => setShowCreate(true)} className="px-8 py-4 rounded-[20px] bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20 flex items-center gap-3 hover:scale-[1.03] transition-all group">
                <Plus size={20} />
                <span className="text-[12px] font-black uppercase tracking-wider">Add Course</span>
            </button>
        </div>

        {/* Statistics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Registry" value={courses.length} icon={BookOpen} accent trend="+0" />
            <StatCard label="Faculty Strength" value={TEACHERS.length} icon={Users} trend="Active" />
            <StatCard label="Avg Enrolment" value="94%" icon={TrendingUp} trend="Steady" />
            <StatCard label="Registry Health" value="98%" icon={CheckCircle} trend="Target" />
        </div>

        {/* Control Bar - Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-4">
            <FilterDropdown 
              label="Academic Year"
              value={filterYear}
              options={["1st Year", "2nd Year", "3rd Year", "All Years"]}
              onChange={setFilterYear}
            />
            
            <FilterDropdown 
              label="Active Semester"
              value={filterSemester}
              options={["Semester 1", "Semester 2", "All Semesters"]}
              onChange={setFilterSemester}
            />

            <div className="relative flex-1 max-w-sm ml-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search registry..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 shadow-sm rounded-[20px] text-[13px] font-bold outline-none focus:border-[#3C0078]/20 transition-all" 
                />
            </div>
        </div>

        {/* Registry List - Floating Cards */}
        <div className="space-y-3">
            {filteredCourses.map(course => (
                <motion.div 
                    key={course.id} 
                    onClick={() => handleViewCourse(course)} 
                    className="group bg-white border border-gray-100 p-6 rounded-[28px] flex items-center justify-between hover:shadow-xl hover:border-transparent transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-11 h-11 rounded-xl bg-[#3C0078]/5 text-[#3C0078] flex items-center justify-center group-hover:bg-[#3C0078] group-hover:text-white transition-all"><BookOpen size={18} /></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#3C0078] uppercase tracking-widest">{course.subject.code}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {course.year} • {course.term}</span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{course.subject.name}</h3>
                            <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{course.degree}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{course.teacher.firstName} {course.teacher.lastName}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Lead Faculty</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-[#3C0078] group-hover:text-white transition-all"><ChevronRight size={16} /></div>
                    </div>
                </motion.div>
            ))}
            {filteredCourses.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest">No matching courses found</p>
              </div>
            )}
        </div>
      </main>

      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setSelectedCourse(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="bg-white rounded-[40px] w-[80vw] max-w-[1400px] shadow-3xl overflow-hidden relative" 
              onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row min-h-[600px]">
                  {/* Left Column: Core Info & Main Meta */}
                  <div className="p-12 md:w-2/5 bg-gray-50/50 border-r border-gray-100 flex flex-col justify-between">
                      <div className="mb-10">
                          <div className="flex items-center gap-3 mb-4">
                            {isEditing ? (
                              <input 
                                value={editForm.subject.code}
                                onChange={(e) => setEditForm({...editForm, subject: {...editForm.subject, code: e.target.value}})}
                                className="px-3 py-1 w-24 rounded-full bg-white border border-[#3C0078]/20 text-[10px] font-black text-[#3C0078] uppercase tracking-widest outline-none"
                              />
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-[#3C0078]/5 text-[10px] font-black text-[#3C0078] uppercase tracking-widest">{selectedCourse.subject.code}</span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              (isEditing ? editForm.status : selectedCourse.status) === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            }`}>
                              {isEditing ? editForm.status : selectedCourse.status}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="space-y-4">
                              <input 
                                value={editForm.subject.name}
                                onChange={(e) => setEditForm({...editForm, subject: {...editForm.subject, name: e.target.value}})}
                                className="w-full text-5xl font-black text-gray-900 tracking-tighter bg-transparent border-b-2 border-[#3C0078]/10 focus:border-[#3C0078] outline-none pb-1"
                              />
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">{editForm.year} Registry</span>
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">{editForm.term}</span>
                              </div>
                            </div>
                          ) : (
                            <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">{selectedCourse.subject.name}</h2>
                          )}

                          <div className="mt-8 p-6 rounded-3xl bg-[#3C0078]/5 border border-[#3C0078]/10">
                            <label className="text-[10px] font-black text-[#3C0078] uppercase tracking-widest block mb-2">Degree Assignment</label>
                            {isEditing ? (
                              <select 
                                value={editForm.degree}
                                onChange={(e) => setEditForm({...editForm, degree: e.target.value})}
                                className="w-full px-5 py-3 rounded-2xl bg-white border border-gray-100 text-[13px] font-bold outline-none appearance-none"
                              >
                                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <p className="text-[14px] font-black text-gray-900 uppercase tracking-wider">{selectedCourse.degree}</p>
                            )}
                            <p className="mt-3 text-[11px] font-medium text-gray-500 leading-relaxed italic">
                              * All students enrolled in this degree program will be automatically assigned to this module.
                            </p>
                          </div>
                      </div>

                      <div className="space-y-6">
                          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Assigned Faculty</label>
                              <div className="flex items-center justify-between">
                                {isEditing ? (
                                  <div className="flex-1">
                                    <select 
                                      value={editForm.teacher.id}
                                      onChange={(e) => {
                                        const teacher = TEACHERS.find(t => t.id === e.target.value);
                                        setEditForm({...editForm, teacher});
                                      }}
                                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-[13px] font-bold outline-none"
                                    >
                                      {TEACHERS.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#3C0078] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#3C0078]/20">
                                      {selectedCourse.teacher.firstName[0]}
                                    </div>
                                    <div>
                                      <h4 className="text-[14px] font-black text-gray-900">{selectedCourse.teacher.firstName} {selectedCourse.teacher.lastName}</h4>
                                      <p className="text-[10px] font-bold text-gray-400">{selectedCourse.teacher.email}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                          </div>

                          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Registry Status</label>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-[12px] font-black uppercase tracking-wider ${
                                  (isEditing ? editForm.status : selectedCourse.status) === "Active" ? "text-green-600" : "text-red-500"
                                }`}>
                                  {isEditing ? editForm.status : selectedCourse.status}
                                </span>
                                {isEditing && (
                                  <button 
                                    onClick={() => setEditForm({...editForm, status: editForm.status === "Active" ? "Inactive" : "Active"})}
                                    className={`w-12 h-6 rounded-full transition-all relative ${editForm.status === "Active" ? "bg-green-500" : "bg-gray-300"}`}
                                  >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.status === "Active" ? "right-1" : "left-1"}`}></div>
                                  </button>
                                )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Narrative & Actions */}
                  <div className="p-16 md:w-3/5 flex flex-col justify-between">
                      <button onClick={() => setSelectedCourse(null)} className="absolute top-10 right-10 p-3 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
                      
                      <div className="space-y-12">
                          <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Course Specification</label>
                            {isEditing ? (
                              <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                className="w-full px-8 py-8 rounded-[32px] bg-gray-50 border-none text-[16px] font-medium text-gray-600 leading-relaxed min-h-[250px] outline-none ring-2 ring-transparent focus:ring-[#3C0078]/5 transition-all shadow-inner"
                                placeholder="Describe the course learning outcomes..."
                              />
                            ) : (
                              <div className="relative">
                                <p className="text-[18px] font-medium text-gray-500 leading-relaxed max-w-prose">
                                  {selectedCourse.description}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-10 grid grid-cols-2 gap-6">
                            {isEditing ? (
                              <>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Academic Year</label>
                                  <div className="relative group">
                                    <select 
                                      value={editForm.year}
                                      onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                                    >
                                      {["1st Year", "2nd Year", "3rd Year"].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                      <ChevronDown size={16} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Active Semester</label>
                                  <div className="relative group">
                                    <select 
                                      value={editForm.term}
                                      onChange={(e) => setEditForm({...editForm, term: e.target.value})}
                                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                                    >
                                      {["Semester 1", "Semester 2"].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                      <ChevronDown size={16} />
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-4 text-gray-400 bg-gray-50 px-6 py-4 rounded-2xl">
                                  <div className="w-2 h-2 rounded-full bg-[#3C0078]"></div>
                                  <span className="text-[12px] font-black uppercase tracking-wider">{selectedCourse.year} Registry</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 bg-gray-50 px-6 py-4 rounded-2xl">
                                  <div className="w-2 h-2 rounded-full bg-[#3C0078]"></div>
                                  <span className="text-[12px] font-black uppercase tracking-wider">{selectedCourse.term}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="mt-12 flex items-center gap-4 p-8 rounded-[32px] bg-[#3C0078]/5 border border-[#3C0078]/10 group/view">
                              <div className="flex-1">
                                <h4 className="text-[14px] font-black text-[#3C0078] uppercase tracking-widest mb-1">Perspective View</h4>
                                <p className="text-[11px] font-medium text-gray-400 leading-tight">Preview this course as it appears to different platform roles.</p>
                              </div>
                              <div className="flex gap-3">
                                <button className="px-6 py-3.5 rounded-2xl bg-white border border-[#3C0078]/10 text-[11px] font-black uppercase text-[#3C0078] tracking-widest hover:bg-[#3C0078] hover:text-white hover:border-transparent transition-all shadow-sm">
                                  Teacher View
                                </button>
                                <button className="px-6 py-3.5 rounded-2xl bg-white border border-[#3C0078]/10 text-[11px] font-black uppercase text-[#3C0078] tracking-widest hover:bg-[#3C0078] hover:text-white hover:border-transparent transition-all shadow-sm">
                                  Student View
                                </button>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex gap-6 mt-16 font-sans">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={handleSaveEdit}
                              className="flex-[2] py-7 rounded-[32px] bg-[#3C0078] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-[#3C0078]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              Confirm Registry Update
                            </button>
                            <button 
                              onClick={() => handleDeleteCourse(editForm.id)}
                              className="flex-1 py-7 rounded-[32px] bg-red-50 text-red-500 font-black uppercase tracking-widest text-[13px] hover:bg-red-500 hover:text-white transition-all border-none"
                            >
                              Delete Registry
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => setIsEditing(true)}
                              className="flex-[2] py-7 rounded-[32px] bg-[#3C0078] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-[#3C0078]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              Modify system data
                            </button>
                            <button className="flex-1 py-7 rounded-[32px] border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-[13px] hover:bg-gray-50 transition-all">
                              Archive
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
