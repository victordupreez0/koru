import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";

import { TeacherAnalyticsModal } from "../courses/adminCoursesComponents";
import { createEvent } from "../../services/eventService";
import {
  courseService,
  userService,
  subjectService,
  enrollmentService,
  registrationService,
} from "../../services/adminService";
import {
  FilterDropdown,
  LecturerColumn,
  CourseColumn,
  StudentColumn,
  AssignStudentsModal,
  SendNotificationModal,
} from "./adminDashboardComponents";
import DashboardHeader from "../../components/DashboardHeader";
import { getCourseCohorts, getCourseStudents } from "../../services/classGroupService";

export default function AdminDashboard() {
  // ── Global filters ──
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("1");

  // ── Data state ──
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Selection state ──
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // ── Cohort data for selected course ──
  const [courseCohorts, setCourseCohorts] = useState([]);
  const [cohortStudentMap, setCohortStudentMap] = useState({});

  // ── Search state ──
  const [lecturerSearch, setLecturerSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] = useState("alpha");

  // ── Add-mode state ──
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAssigningStudents, setIsAssigningStudents] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState(false);
  const [analyticsTeacher, setAnalyticsTeacher] = useState(null);

  // ── Data fetch ──
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawTeachers, rawCourses, rawEnrollments, rawSubjects] = await Promise.all([
        userService.getTeachers(),
        courseService.getAllCourses(),
        enrollmentService.getAll(),
        subjectService.getSubjects(),
      ]);

      // Normalize teachers to add a display `name` field
      const normalizedTeachers = rawTeachers.map(t => ({
        ...t,
        name: `${t.firstName} ${t.lastName}`,
      }));

      // Normalize courses to match the shape child components expect:
      // - title  ← subject.name
      // - code   ← subject.code
      // - lecturerId ← teacherId (for existing filter/display logic)
      // - semester ← 1 or 2 parsed from term string
      const normalizedCourses = rawCourses.map(c => ({
        ...c,
        title: c.subject?.name || "Unknown Subject",
        code: c.subject?.code || "",
        lecturerId: c.teacherId,
        semester: c.term?.includes("2") ? 2 : 1,
      }));

      // Derive students from enrollments, grouping courseIds per student
      const studentMap = {};
      rawEnrollments.forEach(e => {
        if (!e.student) return;
        const sid = e.student.id;
        if (!studentMap[sid]) {
          studentMap[sid] = {
            ...e.student,
            name: `${e.student.firstName} ${e.student.lastName}`,
            courseIds: [],
          };
        }
        studentMap[sid].courseIds.push(e.courseId);
      });

      setLecturers(normalizedTeachers);
      setCourses(normalizedCourses);
      setStudents(Object.values(studentMap));
      setSubjects(rawSubjects);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Available calendar years derived from courses ──
  const availableYears = useMemo(() => {
    return [...new Set(courses.map(c => c.year.toString()))].sort((a, b) => a - b);
  }, [courses]);

  // Default year to first available year when data loads
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears]);

  // ── Derived data ──
  const filteredLecturers = useMemo(() => {
    const lecturerIdsWithCourses = new Set(
      courses
        .filter(c => c.year === parseInt(year) && c.semester === parseInt(semester))
        .map(c => c.lecturerId)
    );
    return lecturers.filter(
      l =>
        lecturerIdsWithCourses.has(l.id) &&
        l.name.toLowerCase().includes(lecturerSearch.toLowerCase())
    );
  }, [lecturers, courses, year, semester, lecturerSearch]);

  const filteredCourses = useMemo(() => {
    if (!selectedLecturerId) return [];
    return courses.filter(
      c =>
        c.lecturerId === selectedLecturerId &&
        c.year === parseInt(year) &&
        c.semester === parseInt(semester) &&
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, selectedLecturerId, year, semester, courseSearch]);

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    let result = students.filter(
      s =>
        s.courseIds.includes(selectedCourseId) &&
        s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );
    if (studentSort === "alpha") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [students, selectedCourseId, studentSearch, studentSort]);

  // ── Auto-select first lecturer + first course on load / filter change ──
  useEffect(() => {
    if (filteredLecturers.length > 0) {
      if (!filteredLecturers.find(l => l.id === selectedLecturerId)) {
        setSelectedLecturerId(filteredLecturers[0].id);
      }
    } else {
      setSelectedLecturerId(null);
    }
  }, [filteredLecturers]);

  useEffect(() => {
    if (filteredCourses.length > 0) {
      if (!filteredCourses.find(c => c.id === selectedCourseId)) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    } else {
      setSelectedCourseId(null);
    }
  }, [filteredCourses]);

  // ── Fetch cohorts whenever selected course changes ──
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseCohorts([]);
      setCohortStudentMap({});
      return;
    }
    Promise.all([
      getCourseCohorts(selectedCourseId).catch(() => []),
      getCourseStudents(selectedCourseId).catch(() => []),
    ]).then(([cohorts, students]) => {
      setCourseCohorts(cohorts || []);
      const map = {};
      (students || []).forEach(s => { map[s.studentId] = s.classGroupId; });
      setCohortStudentMap(map);
    });
  }, [selectedCourseId]);

  // ── Handlers ──
  const handleSelectLecturer = (id) => {
    setSelectedLecturerId(id);
    setSelectedCourseId(null);
    setIsAddingLecturer(false);
    setIsAddingCourse(false);
  };

  const handleSelectCourse = (id) => {
    setSelectedCourseId(id);
    setIsAddingCourse(false);
  };

  const handleSaveLecturer = async ({ firstName, lastName, email }) => {
    try {
      await registrationService.registerTeacher({ firstName, lastName, email });
      setIsAddingLecturer(false);
      await fetchData();
    } catch (err) {
      alert("Failed to create lecturer: " + err.message);
    }
  };

  const handleOpenAnalytics = (lecturer) => {
    setAnalyticsTeacher(lecturer);
    setShowTeacherAnalytics(true);
  };

  const handleSendNotification = async ({ title, description, startTime, endTime, selectedIds, eventType, bgColor, textColor }) => {
    try {
      const targetCourses = courses.filter(c => selectedIds.includes(c.lecturerId));
      if (targetCourses.length === 0) {
        alert("The selected lecturers have no courses in the current filter. No events created.");
        return;
      }
      await Promise.all(
        targetCourses.map(c =>
          createEvent({ title, description, eventType, startTime, endTime, bgColor, textColor, courseId: c.id })
        )
      );
      setIsSendingNotification(false);
    } catch (err) {
      console.error("Failed to send notification:", err);
      alert("Failed to send notification. Please try again.");
    }
  };

  const handleSaveCourse = async (subjectId, term) => {
    try {
      await courseService.createCourse({
        subjectId,
        teacherId: selectedLecturerId,
        term,
        year: parseInt(year),
        capacity: 50,
      });
      setIsAddingCourse(false);
      await fetchData();
    } catch (err) {
      alert("Error creating course: " + err.message);
    }
  };

  const handleAssignStudent = async (studentId) => {
    try {
      await enrollmentService.create({
        studentId,
        courseId: selectedCourseId,
        status: "Active",
      });
      await fetchData();
    } catch (err) {
      alert("Failed to assign student: " + err.message);
    }
  };

  const selectedLecturer = lecturers.find(l => l.id === selectedLecturerId);
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const showAddCourse = selectedLecturerId && !isAddingLecturer;
  const showAddStudent = selectedCourseId && !isAddingCourse && !isAddingLecturer;

  // ── Header KPIs derived from current filter ──
  const currentTermCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.year === parseInt(year) && c.semester === parseInt(semester)
      ),
    [courses, year, semester]
  );

  const enrolledStudentCount = useMemo(() => {
    const courseIds = new Set(currentTermCourses.map((c) => c.id));
    const ids = new Set();
    students.forEach((s) => {
      if (s.courseIds.some((cid) => courseIds.has(cid))) ids.add(s.id);
    });
    return ids.size;
  }, [students, currentTermCourses]);

  const activeLecturerCount = useMemo(
    () => new Set(currentTermCourses.map((c) => c.lecturerId)).size,
    [currentTermCourses]
  );

  const headerStats = [
    {
      icon: UserCheck,
      label: "Active Lecturers",
      value: activeLecturerCount,
      variant: "purple",
    },
    {
      icon: BookOpen,
      label: "Courses This Term",
      value: currentTermCourses.length,
      variant: "sky",
    },
    {
      icon: GraduationCap,
      label: "Enrolled Students",
      value: enrolledStudentCount,
      variant: "emerald",
    },
    {
      icon: Users,
      label: "Total Lecturers",
      value: lecturers.length,
      variant: "orange",
    },
  ];

  if (isLoading) {
    return (
      <div className="h-[68vh] min-h-[520px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#3C0078] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const headerActions = (
    <>
      <FilterDropdown
        label="Year"
        value={year}
        onChange={setYear}
        options={availableYears.map((y) => ({ value: y, label: y }))}
      />
      <FilterDropdown
        label="Semester"
        value={semester}
        onChange={setSemester}
        options={[
          { value: "1", label: "1" },
          { value: "2", label: "2" },
        ]}
      />

      <motion.button
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsSendingNotification(true)}
        className="px-5 py-3 rounded-2xl bg-[#3C0078] text-white flex items-center gap-2.5 hover:bg-[#2a0055] transition-colors"
      >
        <Bell size={16} />
        <span className="text-[11px] font-black uppercase tracking-wider">
          Send Notification
        </span>
      </motion.button>
    </>
  );

  return (
    <div className="flex flex-col gap-6 pb-2">
      <DashboardHeader
        stats={headerStats}
        actions={headerActions}
        contextLine={`Managing ${year || "—"} · Semester ${semester}.`}
      />

      <motion.section
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.08, delayChildren: 0.15 },
          },
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto h-[68vh] min-h-[520px]"
        aria-label="Admin dashboard overview"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          }}
          className="min-h-0"
        >
          <LecturerColumn
            lecturerSearch={lecturerSearch}
            setLecturerSearch={setLecturerSearch}
            isAddingLecturer={isAddingLecturer}
            setIsAddingLecturer={setIsAddingLecturer}
            setIsAddingCourse={setIsAddingCourse}
            handleSaveLecturer={handleSaveLecturer}
            filteredLecturers={filteredLecturers}
            selectedLecturerId={selectedLecturerId}
            handleSelectLecturer={handleSelectLecturer}
            onOpenAnalytics={handleOpenAnalytics}
            onOpenNotification={() => setIsSendingNotification(true)}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          }}
          className="min-h-0"
        >
          <CourseColumn
            showAddCourse={showAddCourse}
            setIsAddingCourse={setIsAddingCourse}
            courseSearch={courseSearch}
            setCourseSearch={setCourseSearch}
            isAddingCourse={isAddingCourse}
            selectedLecturer={selectedLecturer}
            handleSaveCourse={handleSaveCourse}
            selectedLecturerId={selectedLecturerId}
            filteredCourses={filteredCourses}
            selectedCourseId={selectedCourseId}
            handleSelectCourse={handleSelectCourse}
            lecturers={lecturers}
            subjects={subjects}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
          }}
          className="min-h-0"
        >
          <StudentColumn
            showAddStudent={showAddStudent}
            setIsAssigningStudents={setIsAssigningStudents}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            studentSort={studentSort}
            setStudentSort={setStudentSort}
            selectedCourseId={selectedCourseId}
            filteredStudents={filteredStudents}
            cohorts={courseCohorts}
            cohortStudentMap={cohortStudentMap}
          />
        </motion.div>
      </motion.section>

      {/* ── Assign Students Modal ── */}
      <AnimatePresence>
        {isAssigningStudents && selectedCourse && (
          <AssignStudentsModal
            allStudents={students}
            currentStudentIds={filteredStudents.map(s => s.id)}
            courseTitle={selectedCourse.title}
            onAssign={handleAssignStudent}
            onClose={() => setIsAssigningStudents(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Teacher Analytics Modal ── */}
      <AnimatePresence>
        {showTeacherAnalytics && analyticsTeacher && (
          <TeacherAnalyticsModal
            teacher={analyticsTeacher}
            isOpen={showTeacherAnalytics}
            onClose={() => setShowTeacherAnalytics(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Send Notification Modal ── */}
      <AnimatePresence>
        {isSendingNotification && (
          <SendNotificationModal
            lecturers={lecturers}
            onClose={() => setIsSendingNotification(false)}
            onSend={handleSendNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
