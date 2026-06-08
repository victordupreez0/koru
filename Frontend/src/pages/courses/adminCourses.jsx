import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, BookOpen, TrendingUp, Clock, CheckCircle, X, Bell } from "lucide-react";
import { courseService, userService, subjectService, enrollmentService } from "../../services/adminService";

// Modularized Components
import {
  StatCard,
  FilterDropdown,
  CourseListItem,
  CourseDetailModal
} from "./adminCoursesComponents";

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("All Years");
  const [filterSemester, setFilterSemester] = useState("All Semesters");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [fetchedCourses, fetchedTeachers, fetchedSubjects, fetchedEnrollments] = await Promise.all([
        courseService.getAllCourses(),
        userService.getTeachers(),
        subjectService.getSubjects(),
        enrollmentService.getAllEnrollments().catch(() => [])
      ]);

      setCourses(fetchedCourses || []);
      setTeachers(fetchedTeachers || []);
      setSubjects(fetchedSubjects || []);

    } catch (error) {
      console.error("Failed to load course registry data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const avgCapacity = courses.length > 0 ? Math.round(totalCapacity / courses.length) : 0;

    return {
      registryCount: courses.length,
      facultyCount: teachers.length,
      avgCapacity,
    };
  }, [courses, teachers]);

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setEditForm({ ...course });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      await courseService.updateCourse(editForm.id, {
        subjectId: editForm.subjectId,
        teacherId: editForm.teacherId,
        term: editForm.term,
        year: parseInt(editForm.year),
        capacity: parseInt(editForm.capacity),
        isVisible: editForm.isVisible || false,
        degree: editForm.degree || ""
      });
      setSelectedCourse(null);
      setIsEditing(false);
      await fetchInitialData();
    } catch (error) {
      alert("Error updating course: " + error.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await courseService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      setSelectedCourse(null);
      await fetchInitialData();
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
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-8 pb-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-5 bg-[#3C0078] rounded-full"></div>
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3C0078] opacity-60">System Registry</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-none">Course <span className="text-[#3C0078]">Management</span></h1>
            </div>
            <button onClick={() => navigate("/courses/create")} className="px-8 py-4 rounded-[20px] bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20 flex items-center gap-3 hover:scale-[1.03] transition-all group cursor-pointer">
                <Plus size={20} />
                <span className="text-[12px] font-black uppercase tracking-wider">Add Course</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Registry" value={stats.registryCount} icon={BookOpen} accent trend="+0" />
            <StatCard label="Faculty Strength" value={stats.facultyCount} icon={Users} trend="Active" />
            <StatCard label="Avg Capacity" value={stats.avgCapacity} icon={TrendingUp} trend="Per Course" />
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
    </div>
  );
}
