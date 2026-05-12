import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Users, BookOpen, Clock, 
  TrendingUp, CheckCircle, X,
  ChevronRight, Calendar, MapPin, ChevronDown
} from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import { courseService, userService, subjectService } from "../../services/adminService";


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

const DEGREES = [
  "UX Design Degree",
  "Software Engineering Degree",
  "Visual Arts Degree",
  "Interaction Design Degree",
  "Design Leadership Degree"
];


export default function AdminCourses() {
  const [courses, setCourses] = useState([]); // Initialize with empty array for backend data
  const [teachers, setTeachers] = useState([]); // Real teachers from DB
  const [subjects, setSubjects] = useState([]); // Real subjects from DB
  const [enrollments, setEnrollments] = useState([]); // Real enrollments to calculate stats
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterSemester, setFilterSemester] = useState("All Semesters");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form state for creating a new course linking a subject and a teacher
  const [newCourseForm, setNewCourseForm] = useState({
    subjectId: "",
    teacherId: "",
    year: "1",
    term: "Semester 1",
    capacity: 50,
    status: "Active",
    degree: "UX Design Degree", // This seems to be UI only for now in the model
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  /**
   * Loads dummy data instead of fetching from the backend.
   */
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Dummy data representing what's in the database
      const fetchedSubjects = [
        { id: "s1", name: "User Experience Design 300", code: "UX300", description: "Inclusive & Neurodiverse UX foundation course." },
        { id: "s2", name: "Development 300", code: "DV300", description: "Advanced Full-Stack Engineering and Architecture." },
        { id: "s3", name: "Visual Culture 300", code: "VC300", description: "Exploration of visual systems, semiotics, and interactive media aesthetics." }
      ];

      const fetchedTeachers = [
        { id: "t1", firstName: "Dev", lastName: "Teacher", email: "devteacher@learnonline.co.za", role: "teacher" },
        { id: "t2", firstName: "Sarah", lastName: "Smith", email: "sarah@learnonline.co.za", role: "teacher" }
      ];

      const fetchedCourses = [
        { 
          id: "c1", 
          subjectId: "s1", 
          teacherId: "t1", 
          term: "Term 1", 
          year: 2026, 
          capacity: 150,
          status: "Active",
          degree: "UX Design Degree",
          description: "This comprehensive course covers the principles of User Experience Design, focusing on inclusive and neurodiverse foundations to create accessible products for all users.",
          subject: fetchedSubjects[0],
          teacher: fetchedTeachers[0]
        },
        { 
          id: "c2", 
          subjectId: "s2", 
          teacherId: "t1", 
          term: "Term 1", 
          year: 2026, 
          capacity: 150,
          status: "Active",
          degree: "Software Engineering Degree",
          description: "Advanced Full-Stack Engineering and Architecture. Explore modern web technologies, database management, and scalable system design.",
          subject: fetchedSubjects[1],
          teacher: fetchedTeachers[0]
        },
        { 
          id: "c3", 
          subjectId: "s3", 
          teacherId: "t2", 
          term: "Term 1", 
          year: 2026, 
          capacity: 150,
          status: "Active",
          degree: "Visual Arts Degree",
          description: "Exploration of visual systems, semiotics, and interactive media aesthetics. Understand the cultural impact of visual communication.",
          subject: fetchedSubjects[2],
          teacher: fetchedTeachers[1]
        }
      ];

      const fetchedEnrollments = [
        { id: "e1", studentId: "std1", courseId: "c1", status: "Active" },
        { id: "e2", studentId: "std1", courseId: "c2", status: "Active" },
        { id: "e3", studentId: "std1", courseId: "c3", status: "Active" }
      ];

      setCourses(fetchedCourses);
      setTeachers(fetchedTeachers);
      setSubjects(fetchedSubjects);
      setEnrollments(fetchedEnrollments);
      
      console.log("Mock data loaded for AdminCourses");

      if (fetchedSubjects.length > 0 && fetchedTeachers.length > 0) {
        setNewCourseForm(prev => ({
          ...prev,
          subjectId: fetchedSubjects[0].id,
          teacherId: fetchedTeachers[0].id
        }));
      }
    } catch (error) {
      console.error("Failed to load mock data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analytics Calculation
   * Calculating stats from real database records (Enrollments / Courses)
   */
  const stats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const avgEnrolment = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    
    return {
      registryCount: courses.length,
      facultyCount: teachers.length,
      avgEnrolment: `${avgEnrolment}%`,
      health: "98%" // Placeholder for health metric
    };
  }, [courses, teachers, enrollments]);

  // Handle opening modal for viewing
  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setEditForm({ ...course });
    setIsEditing(false);
  };

  /**
   * Mock creating a new course.
   */
  const handleCreateCourse = async () => {
    try {
      const subject = subjects.find(s => s.id === newCourseForm.subjectId);
      const teacher = teachers.find(t => t.id === newCourseForm.teacherId);

      const newCourse = {
        id: Math.random().toString(36).substr(2, 9),
        ...newCourseForm,
        year: parseInt(newCourseForm.year),
        capacity: parseInt(newCourseForm.capacity),
        subject,
        teacher
      };

      setCourses(prev => [...prev, newCourse]);
      setShowCreate(false);
      
      // Reset form
      setNewCourseForm({
        ...newCourseForm,
        capacity: 50
      });
      console.log("Mock: Created course", newCourse);
    } catch (error) {
      alert("Error creating course: " + error.message);
    }
  };

  /**
   * Mock saving edits to a course.
   */
  const handleSaveEdit = async () => {
    try {
      const updatedCourses = courses.map(c => 
        c.id === editForm.id ? { ...editForm, year: parseInt(editForm.year), capacity: parseInt(editForm.capacity) } : c
      );
      setCourses(updatedCourses);
      setSelectedCourse(null);
      setIsEditing(false);
      console.log("Mock: Updated course", editForm.id);
    } catch (error) {
      alert("Error updating course: " + error.message);
    }
  };

  /**
   * Mock deleting a course record.
   */
  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    
    try {
      setCourses(prev => prev.filter(c => c.id !== id));
      setSelectedCourse(null);
      console.log("Mock: Deleted course", id);
    } catch (error) {
      alert("Failed to delete: " + error.message);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Basic safeguard for populated records
      if (!course.subject) return false;

      const matchesSearch = 
        course.subject.name.toLowerCase().includes(search.toLowerCase()) || 
        course.subject.code.toLowerCase().includes(search.toLowerCase());
      
      // Adjusting strings to match the DB format (ints vs strings)
      const matchesYear = filterYear === "All Years" || course.year.toString().includes(filterYear.charAt(0));
      const matchesSemester = filterSemester === "All Semesters" || course.term === filterSemester;
      
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [courses, search, filterYear, filterSemester]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3C0078] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Synchronizing Registry...</p>
        </div>
      </div>
    );
  }

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
            <StatCard label="Total Registry" value={stats.registryCount} icon={BookOpen} accent trend="+0" />
            <StatCard label="Faculty Strength" value={stats.facultyCount} icon={Users} trend="Active" />
            <StatCard label="Avg Enrolment" value={stats.avgEnrolment} icon={TrendingUp} trend="Steady" />
            <StatCard label="Registry Health" value={stats.health} icon={CheckCircle} trend="Target" />
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
                                    {/* Link: Pulling real subject code and academic meta */}
                                    <span className="text-[10px] font-black text-[#3C0078] uppercase tracking-widest">{course.subject?.code}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {course.year} Year • {course.term}</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">{course.subject?.name}</h3>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{course.degree || "UX Design Degree"}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                {/* Link: Displaying the real teacher assigned in the database */}
                                <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{course.teacher?.firstName} {course.teacher?.lastName}</div>
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
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">{editForm.year}{editForm.year===1 ? "st" : editForm.year===2 ? "nd" : editForm.year===3 ? "rd" : "th"} Year Registry</span>
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
                                      value={editForm.teacherId}
                                      onChange={(e) => {
                                        setEditForm({...editForm, teacherId: e.target.value});
                                      }}
                                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-[13px] font-bold outline-none"
                                    >
                                      {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#3C0078] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#3C0078]/20">
                                      {selectedCourse?.teacher?.firstName?.[0] || "?"}
                                    </div>
                                    <div>
                                      <h4 className="text-[14px] font-black text-gray-900">
                                        {selectedCourse?.teacher ? `${selectedCourse.teacher.firstName} ${selectedCourse.teacher.lastName}` : "No Teacher Assigned"}
                                      </h4>
                                      <p className="text-[10px] font-bold text-gray-400">{selectedCourse?.teacher?.email || "N/A"}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                          </div>

                          <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Registry Status</label>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-[12px] font-black uppercase tracking-wider ${
                                  (isEditing ? editForm?.status : selectedCourse?.status) === "Active" ? "text-green-600" : "text-red-500"
                                }`}>
                                  {isEditing ? editForm?.status : (selectedCourse?.status || "Active")}
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
                                value={editForm?.description || ""}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                className="w-full px-8 py-8 rounded-[32px] bg-gray-50 border-none text-[16px] font-medium text-gray-600 leading-relaxed min-h-[250px] outline-none ring-2 ring-transparent focus:ring-[#3C0078]/5 transition-all shadow-inner"
                                placeholder="Describe the course learning outcomes..."
                              />
                            ) : (
                              <div className="relative">
                                <p className="text-[18px] font-medium text-gray-500 leading-relaxed max-w-prose">
                                  {selectedCourse?.description || selectedCourse?.subject?.description || "No description available."}
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
                                      value={editForm?.year || 1}
                                      onChange={(e) => setEditForm({...editForm, year: parseInt(e.target.value)})}
                                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all appearance-none"
                                    >
                                      {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{y===1 ? "st" : y===2 ? "nd" : y===3 ? "rd" : "th"} Year</option>)}
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
                                      value={editForm?.term || "Semester 1"}
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
                                  <span className="text-[12px] font-black uppercase tracking-wider">{selectedCourse?.year}{selectedCourse?.year===1 ? "st" : selectedCourse?.year===2 ? "nd" : selectedCourse?.year===3 ? "rd" : "th"} Year Registry</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 bg-gray-50 px-6 py-4 rounded-2xl">
                                  <div className="w-2 h-2 rounded-full bg-[#3C0078]"></div>
                                  <span className="text-[12px] font-black uppercase tracking-wider">{selectedCourse?.term}</span>
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

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-[#0A0510]/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-[1400px] h-fit max-h-[90vh] bg-white rounded-[48px] shadow-[0_32px_128px_-16px_rgba(60,0,120,0.3)] overflow-hidden flex flex-col"
            >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Left Column: Context & Subject Info */}
                  <div className="md:w-[500px] bg-gray-50 border-r border-gray-100 p-12 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-12">
                          <button onClick={() => setShowCreate(false)} className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all group">
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
                                  value={newCourseForm.subjectName || subjects.find(s => s.id === newCourseForm.subjectId)?.name || ""}
                                  onChange={(e) => setNewCourseForm({...newCourseForm, subjectName: e.target.value})}
                                  placeholder="Enter subject name"
                                  className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-[16px] font-black text-[#3C0078] focus:ring-2 focus:ring-[#3C0078]/10 transition-all outline-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Code</label>
                                <div className="relative">
                                  <select 
                                    value={newCourseForm.subjectId}
                                    onChange={(e) => setNewCourseForm({...newCourseForm, subjectId: e.target.value})}
                                    className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-[14px] font-bold text-gray-600 focus:ring-2 focus:ring-[#3C0078]/10 transition-all outline-none appearance-none"
                                  >
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                  </select>
                                  <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Course Description</label>
                                <div className="p-6 rounded-2xl bg-white border border-gray-100 text-[16px] font-medium text-gray-500 leading-relaxed shadow-sm">
                                  {subjects.find(s => s.id === newCourseForm.subjectId)?.description || "Select a subject to see its description."}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8 pt-8 border-t border-gray-200/60">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Status</label>
                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={() => setNewCourseForm({...newCourseForm, status: "Active"})}
                                  className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${newCourseForm.status === "Active" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}
                                >Active</button>
                                <button 
                                  onClick={() => setNewCourseForm({...newCourseForm, status: "Inactive"})}
                                  className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${newCourseForm.status === "Inactive" ? "shadow-inner bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}
                                >Inactive</button>
                              </div>
                            </div>
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Detailed Configuration */}
                  <div className="flex-1 p-16 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Lecturer Assignment</label>
                                <div className="relative">
                                  <select 
                                    className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-none text-[15px] font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                                    value={newCourseForm.teacherId}
                                    onChange={(e) => setNewCourseForm({...newCourseForm, teacherId: e.target.value})}
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
                                      className="w-full px-8 py-5 rounded-[24px] bg-gray-50 border-none text-[15px] font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-[#3C0078]/5 transition-all outline-none"
                                      value={newCourseForm.degree}
                                      onChange={(e) => setNewCourseForm({...newCourseForm, degree: e.target.value})}
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
                                  value={newCourseForm.year}
                                  onChange={(e) => setNewCourseForm({...newCourseForm, year: e.target.value})}
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
                                  value={newCourseForm.term}
                                  onChange={(e) => setNewCourseForm({...newCourseForm, term: e.target.value})}
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
                                  value={newCourseForm.capacity}
                                  onChange={(e) => setNewCourseForm({...newCourseForm, capacity: e.target.value})}
                                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none text-[13px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#3C0078]/5 transition-all"
                               />
                            </div>
                          </div>
                      </div>

                      <div className="flex gap-6 mt-16 font-sans">
                          <button 
                            disabled={!newCourseForm.subjectId || !newCourseForm.teacherId}
                            onClick={handleCreateCourse}
                            className="flex-[2] py-7 rounded-[32px] bg-[#3C0078] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-[#3C0078]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                          >
                            Create Subject Registry
                          </button>
                          <button 
                            onClick={() => setShowCreate(false)}
                            className="flex-1 py-7 rounded-[32px] border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-[13px] hover:bg-gray-50 transition-all"
                          >
                            Discard
                          </button>
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
