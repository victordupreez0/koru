import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Users, BookOpen, Clock, 
  TrendingUp, CheckCircle, X, Bell
} from "lucide-react";


// Modularized Components
import {
  StatCard,
  FilterDropdown,
  CourseListItem,
  CreateCourseModal,
  CourseDetailModal
} from "./adminCoursesComponents";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterSemester, setFilterSemester] = useState("All Semesters");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  
  const [newCourseForm, setNewCourseForm] = useState({
    subjectId: "",
    teacherId: "",
    year: "1",
    term: "Semester 1",
    capacity: 50,
    status: "Active",
    degree: "UX Design Degree",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
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

  const stats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const avgEnrolment = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
    
    return {
      registryCount: courses.length,
      facultyCount: teachers.length,
      avgEnrolment: `${avgEnrolment}%`,
      health: "98%"
    };
  }, [courses, teachers, enrollments]);

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setEditForm({ ...course });
    setIsEditing(false);
  };

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
      setNewCourseForm({ ...newCourseForm, capacity: 50 });
    } catch (error) {
      alert("Error creating course: " + error.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedCourses = courses.map(c => 
        c.id === editForm.id ? { ...editForm, year: parseInt(editForm.year), capacity: parseInt(editForm.capacity) } : c
      );
      setCourses(updatedCourses);
      setSelectedCourse(null);
      setIsEditing(false);
    } catch (error) {
      alert("Error updating course: " + error.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      setCourses(prev => prev.filter(c => c.id !== id));
      setSelectedCourse(null);
    } catch (error) {
      alert("Failed to delete: " + error.message);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (!course.subject) return false;
      const matchesSearch = 
        course.subject.name.toLowerCase().includes(search.toLowerCase()) || 
        course.subject.code.toLowerCase().includes(search.toLowerCase());
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
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-12 pb-24 space-y-10">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Registry" value={stats.registryCount} icon={BookOpen} accent trend="+0" />
            <StatCard label="Faculty Strength" value={stats.facultyCount} icon={Users} trend="Active" />
            <StatCard label="Avg Enrolment" value={stats.avgEnrolment} icon={TrendingUp} trend="Steady" />
            <StatCard label="Registry Health" value={stats.health} icon={CheckCircle} trend="Target" />
        </div>

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

        <div className="space-y-3">
            {filteredCourses.map(course => (
                <CourseListItem 
                  key={course.id} 
                  course={course} 
                  onClick={() => handleViewCourse(course)} 
                />
            ))}
            {filteredCourses.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest">No matching courses found</p>
              </div>
            )}
        </div>
      </main>

      <AnimatePresence>
        <CourseDetailModal 
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          teachers={teachers}
          onSave={handleSaveEdit}
          onDelete={handleDeleteCourse}
        />
      </AnimatePresence>

      <AnimatePresence>
        <CreateCourseModal 
          show={showCreate}
          onClose={() => setShowCreate(false)}
          form={newCourseForm}
          setForm={setNewCourseForm}
          subjects={subjects}
          teachers={teachers}
          onCreate={handleCreateCourse}
        />
      </AnimatePresence>
    </div>
  );
}

