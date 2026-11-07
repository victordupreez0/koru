import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Search, Check, Users, ArrowLeft, 
  BookOpen, Calendar, HelpCircle, Loader2, Sparkles
} from "lucide-react";
import { 
  courseService, 
  userService, 
  subjectService, 
  enrollmentService 
} from "../../services/adminService";
import { Avatar, Badge, Button, Input, Select } from "../../components/UI";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  
  // Form States
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [year, setYear] = useState(new Date().getFullYear());
  const [capacity, setCapacity] = useState(150);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Data States
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load teachers and students from API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [fetchedTeachers, fetchedStudents] = await Promise.all([
          userService.getTeachers(),
          userService.getStudents()
        ]);
        setTeachers(fetchedTeachers || []);
        setStudents(fetchedStudents || []);
        
        if (fetchedTeachers.length > 0) {
          setSelectedTeacherId(fetchedTeachers[0].id);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        setErrorMessage("Error retrieving user registry. Please check backend connection.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const email = student.email.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [students, searchQuery]);

  // Student list selection helpers
  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(prev => {
      const union = new Set([...prev, ...filteredIds]);
      return Array.from(union);
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim() || !selectedTeacherId) {
      setErrorMessage("Please complete all required fields (Course Name, Code, and Lecturer).");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      // 1. Create the Subject entry
      const subjectPayload = {
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        description: description.trim() || "No course description provided."
      };
      
      const newSubject = await subjectService.getSubjects().then(async (existing) => {
        // Double check if subject code already exists to reuse or prevent duplicate errors
        const found = existing.find(s => s.code.toLowerCase() === subjectCode.trim().toLowerCase());
        if (found) return found;
        
        // Use the proper service function that points to the correct backend host
        return await subjectService.createSubject(subjectPayload);
      });

      // 2. Create the Course Offering
      const coursePayload = {
        term: term,
        year: parseInt(year),
        capacity: parseInt(capacity) || 150,
        subjectId: newSubject.id,
        teacherId: selectedTeacherId,
        isVisible: false, // Starts as draft, lecturer publishes
        degree: "UX Design Degree" // Default program linkage
      };

      const newCourse = await courseService.createCourse(coursePayload);

      // 3. Enroll students if any are selected
      if (selectedStudentIds.length > 0) {
        await enrollmentService.bulkEnrollStudents(newCourse.id, selectedStudentIds);
      }

      setSubmitSuccess(true);
      
      // Auto redirect back to Course Management after short delay
      setTimeout(() => {
        navigate("/courses");
      }, 2000);

    } catch (err) {
      console.error("Course creation failed:", err);
      setErrorMessage(err.message || "Failed to create course. Please verify form details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1700px] mx-auto px-8 pb-12 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-3 mt-2">
            <div className="h-3 rounded-full bg-koru-surface-container-highest w-40" />
            <div className="h-10 rounded-koru-lg bg-koru-surface-container-highest w-96 mt-1" />
          </div>
          <div className="h-9 rounded-koru-lg bg-koru-surface-container-high w-52" />
        </div>
        {/* Form skeleton */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl space-y-5">
              <div className="h-5 rounded-full bg-koru-surface-container-highest w-44 mb-2" />
              {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-koru-lg bg-koru-surface-container-high" />)}
            </div>
            <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl space-y-5">
              <div className="h-5 rounded-full bg-koru-surface-container-highest w-36 mb-2" />
              {[1, 2].map(i => <div key={i} className="h-14 rounded-koru-lg bg-koru-surface-container-high" />)}
            </div>
          </div>
          {/* Right column */}
          <div className="xl:w-[420px] space-y-6">
            <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl space-y-5">
              <div className="h-5 rounded-full bg-koru-surface-container-highest w-36 mb-2" />
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-koru-lg bg-koru-surface-container-high" />)}
            </div>
            <div className="h-14 rounded-koru-2xl bg-koru-primary/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto px-8 pb-12 font-sans">
      
      {/* Breadcrumbs / Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate("/courses")}
            className="self-start"
            startIcon={<ArrowLeft size={14} aria-hidden="true" />}
          >
            Back to Course Registry
          </Button>
          <div className="flex items-center gap-2.5 mt-2">
             <div className="w-1.5 h-6 bg-koru-primary rounded-full" />
             <h1 className="font-display text-koru-display text-koru-on-surface">
               Create New <span className="text-koru-primary">Course offering</span>
             </h1>
          </div>
        </div>
        <Badge variant="primary" size="md" className="hidden md:inline-flex">
          <Sparkles size={14} className="animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          System Administrator Mode
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        {submitSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto py-16 px-10 bg-koru-surface-container-lowest rounded-koru-2xl ring-1 ring-inset ring-koru-outline-faint shadow-koru-md flex flex-col items-center text-center gap-6 mt-12"
          >
            <div className="w-20 h-20 rounded-full bg-koru-success-soft flex items-center justify-center text-koru-success animate-bounce motion-reduce:animate-none">
              <Check size={40} strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-koru-title text-koru-on-surface">Course Registered!</h2>
              <p className="text-sm text-koru-on-surface-variant font-medium max-w-sm">
                The catalog subject and course offering have been created in the database. Redirecting to registry...
              </p>
            </div>
            <Loader2 className="w-6 h-6 text-koru-primary animate-spin motion-reduce:animate-none mt-4" />
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-8">
            
            {/* Left Column: Course Parameters */}
            <div className="flex-1 space-y-6">
              
              <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-koru-outline-faint">
                  <BookOpen className="text-koru-primary" size={20} />
                  <h3 className="font-display text-koru-heading text-koru-on-surface">Course Definition</h3>
                </div>

                {/* Course Name */}
                <Input
                  label="Course Name"
                  required
                  type="text"
                  placeholder="e.g. User Interface Design 300"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />

                {/* Code & Lecturer Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subject Code */}
                  <Input
                    label="Course Code"
                    required
                    type="text"
                    placeholder="e.g. UI300"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="uppercase"
                  />

                  {/* Lecturer Assignment */}
                  <Select
                    label="Lecturer"
                    required
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                  >
                    {teachers.length === 0 ? (
                      <option disabled value="">No Teachers Available</option>
                    ) : (
                      teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))
                    )}
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="course-description" className="text-koru-label text-koru-on-surface-variant block">
                    Description
                  </label>
                  <textarea 
                    id="course-description"
                    rows={4}
                    placeholder="Enter academic summary, prerequisites, or learning outcomes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-koru-surface-container-lowest hover:bg-koru-surface focus:bg-koru-surface-container-lowest focus:ring-1 focus:ring-inset focus:ring-koru-primary px-4 py-3 rounded-koru-xs shadow-koru-xs text-koru-label text-koru-on-surface transition outline-none resize-none leading-relaxed placeholder:text-koru-on-surface-variant/70"
                  />
                </div>
              </div>

              {/* Offer Details */}
              <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-koru-outline-faint">
                  <Calendar className="text-koru-primary" size={20} />
                  <h3 className="font-display text-koru-heading text-koru-on-surface">Academic Offer Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Academic Year */}
                  <Input
                    label="Academic Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                  />

                  {/* Semester / Term */}
                  <Select
                    label="Active Semester"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  >
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                  </Select>

                  {/* Capacity */}
                  <Input
                    label="Capacity (Max Students)"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Student Enrolment List */}
            <div className="w-full xl:w-[500px] shrink-0">
              
              <div className="p-8 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl flex flex-col h-[600px]">
                <div className="flex items-center justify-between pb-4 border-b border-koru-outline-faint shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="text-koru-primary" size={20} />
                    <h3 className="font-display text-koru-heading text-koru-on-surface">Enrol Students</h3>
                  </div>
                  <Badge variant="primary">Selected: {selectedStudentIds.length}</Badge>
                </div>

                {/* Student Search */}
                <div className="my-4 shrink-0">
                  <Input
                    aria-label="Search student database"
                    size="sm"
                    type="text"
                    startIcon={<Search size={16} />}
                    placeholder="Search student database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <Button type="button" variant="outlined" size="sm" className="flex-1" onClick={handleSelectAllFiltered}>
                    Select All Search
                  </Button>
                  <Button type="button" variant="outlined" size="sm" className="flex-1" onClick={handleDeselectAllFiltered}>
                    Clear Search
                  </Button>
                </div>

                {/* Scrollable Student Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                  {filteredStudents.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs font-medium text-koru-on-surface-variant">No students matched search criteria</p>
                    </div>
                  ) : (
                    filteredStudents.map(student => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <div 
                          key={student.id}
                          onClick={() => handleToggleStudent(student.id)}
                          className={`flex items-center justify-between p-3 rounded-koru-lg border transition-all cursor-pointer select-none group
                            ${isSelected 
                              ? "bg-koru-primary-subtle border-koru-primary/20" 
                              : "bg-transparent border-koru-outline-faint hover:bg-koru-surface-container"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar user={student} size="sm" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-medium text-koru-on-surface truncate">
                                {student.firstName} {student.lastName}
                              </h4>
                              <p className="text-koru-caption font-medium text-koru-on-surface-variant truncate mt-0.5">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          
                          {/* Checkbox indicator */}
                          <div className={`w-5 h-5 rounded-koru-sm border flex items-center justify-center shrink-0 transition-all
                            ${isSelected 
                              ? "bg-koru-primary border-koru-primary text-koru-on-primary" 
                              : "border-koru-outline-variant group-hover:border-koru-outline-variant bg-koru-surface-container-lowest"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </form>
        )}
      </AnimatePresence>

      {/* Error & Form Actions Panel */}
      {!submitSuccess && (
        <div className="w-full max-w-full mt-6 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint shadow-koru-card rounded-koru-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            {errorMessage ? (
              <p className="text-xs font-medium text-koru-error flex items-center gap-2">
                <HelpCircle size={16} />
                <span>{errorMessage}</span>
              </p>
            ) : (
              <p className="text-xs font-medium text-koru-on-surface-variant">
                * By registering this course offering, it will be initialized as a <strong className="text-koru-on-surface-variant font-medium">Draft</strong>. The assigned lecturer can check it and publish it to the students when ready.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
            <Button variant="outlined" className="flex-1 md:flex-none" onClick={() => navigate("/courses")}>
              Cancel
            </Button>
            <Button
              variant="filled"
              size="lg"
              className="flex-1 md:flex-none"
              onClick={handleSubmit}
              disabled={isSubmitting || !subjectName.trim() || !subjectCode.trim() || !selectedTeacherId}
              loading={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register Course"}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

