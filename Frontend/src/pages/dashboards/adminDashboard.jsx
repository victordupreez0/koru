import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";

import { TeacherAnalyticsModal, CreateCourseModal } from "../courses/adminCoursesComponents";
import {
  courseService,
  userService,
  enrollmentService,
  registrationService,
} from "../../services/adminService";
import {
  FilterDropdown,
  LecturerColumn,
  CourseColumn,
  StudentColumn,
  AddLecturerForm,
  AddStudentForm,
  SendNotificationModal,
} from "./adminDashboardComponents";
import { createEvent } from "../../services/eventService";
import DashboardHeader from "../../components/DashboardHeader";
import { getCourseCohorts, getCourseStudents } from "../../services/classGroupService";
import { classService } from "../../services/classService";

const column = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_COURSE_FORM = {
  name: "",
  code: "",
  teacherId: "",
  year: String(CURRENT_YEAR),
  term: "Semester 1",
  capacity: "50",
};

export default function AdminDashboard() {
  // ── Global filters ──
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("1");

  // ── Data state ──
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Selection state ──
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // ── Cohort data for selected course ──
  const [courseCohorts, setCourseCohorts] = useState([]);
  const [cohortStudentMap, setCohortStudentMap] = useState({});
  const [unassignedClassCount, setUnassignedClassCount] = useState(0);

  // ── Search state ──
  const [courseSearch, setCourseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // ── Modal state ──
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState(false);
  const [analyticsTeacher, setAnalyticsTeacher] = useState(null);

  // ── Course creation state ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseForm, setCourseForm] = useState(DEFAULT_COURSE_FORM);
  const [createTeachers, setCreateTeachers] = useState([]);

  // ── Data fetch ──
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rawTeachers, rawCourses, rawEnrollments] = await Promise.all([
        userService.getTeachers(),
        courseService.getAllCourses(),
        enrollmentService.getAll(),
      ]);

      const normalizedTeachers = rawTeachers.map(t => ({
        ...t,
        name: `${t.firstName} ${t.lastName}`,
      }));

      const normalizedCourses = rawCourses.map(c => ({
        ...c,
        title: c.name || c.subject?.name || "Unknown Course",
        code: c.code || c.subject?.code || "",
        lecturerId: c.teacherId,
        semester: c.term?.includes("2") ? 2 : 1,
      }));

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
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Load teachers for course creation modal ──
  useEffect(() => {
    userService.getTeachers().catch(() => []).then(t => setCreateTeachers(t || []));
  }, []);

  // ── Available calendar years derived from courses ──
  const availableYears = useMemo(() => {
    return [...new Set(courses.map(c => c.year.toString()))].sort((a, b) => a - b);
  }, [courses]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(year)) {
      setYear(availableYears[0]);
    }
  }, [availableYears]);

  // ── Derived data ──
  const filteredCourses = useMemo(() => {
    return courses.filter(
      c =>
        c.year === parseInt(year) &&
        c.semester === parseInt(semester) &&
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, year, semester, courseSearch]);

  const selectedCourse = useMemo(
    () => courses.find(c => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const courseLecturer = useMemo(
    () => selectedCourse ? lecturers.find(l => l.id === selectedCourse.lecturerId) || null : null,
    [selectedCourse, lecturers]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    return students
      .filter(
        s =>
          s.courseIds.includes(selectedCourseId) &&
          s.name.toLowerCase().includes(studentSearch.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedCourseId, studentSearch]);

  // ── Warning: any group has 0 classes, OR ungrouped students with no fallback schedule ──
  const selectedCourseHasWarning = useMemo(() => {
    if (!selectedCourseId || filteredStudents.length === 0) return false;
    if (courseCohorts.some(g => (g.classCount ?? 0) === 0)) return true;
    if (unassignedClassCount === 0 && filteredStudents.some(s => !cohortStudentMap[s.id])) return true;
    return false;
  }, [selectedCourseId, filteredStudents, courseCohorts, cohortStudentMap, unassignedClassCount]);

  // ── Auto-select first course on load / filter change ──
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
      classService.getUnassignedByCourse(selectedCourseId).catch(() => []),
    ]).then(([cohorts, courseStudents, unassignedClasses]) => {
      setCourseCohorts(cohorts || []);
      const map = {};
      (courseStudents || []).forEach(s => { map[s.studentId] = s.classGroupId; });
      setCohortStudentMap(map);
      setUnassignedClassCount((unassignedClasses || []).length);
    });
  }, [selectedCourseId]);

  // ── Handlers ──
  const handleSelectCourse = (id) => setSelectedCourseId(id);

  const handleCreateCourse = async () => {
    try {
      await courseService.createCourse({
        name: courseForm.name,
        code: courseForm.code || null,
        teacherId: courseForm.teacherId,
        term: courseForm.term,
        year: parseInt(courseForm.year),
        capacity: parseInt(courseForm.capacity),
      });
      setShowCreateModal(false);
      setCourseForm(DEFAULT_COURSE_FORM);
      await fetchData();
    } catch (err) {
      alert("Failed to create course: " + err.message);
    }
  };

  const handleSaveLecturer = async ({ firstName, lastName, email, tempPassword }) => {
    try {
      await registrationService.registerTeacher({ firstName, lastName, email, tempPassword });
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
      alert("Failed to send notification: " + err.message);
    }
  };

  const handleCreateStudent = async ({ firstName, lastName, email, tempPassword }) => {
    try {
      const newUser = await registrationService.registerStudent({ firstName, lastName, email, tempPassword });
      const studentId = newUser?.id || newUser?.userId;
      if (selectedCourseId && studentId) {
        await enrollmentService.create({ studentId, courseId: selectedCourseId, status: "Active" });
      }
      setIsAddingStudent(false);
      await fetchData();
    } catch (err) {
      alert("Failed to create student: " + err.message);
    }
  };

  // ── Header KPIs ──
  const currentTermCourses = useMemo(
    () => courses.filter(c => c.year === parseInt(year) && c.semester === parseInt(semester)),
    [courses, year, semester]
  );

  const enrolledStudentCount = useMemo(() => {
    const courseIds = new Set(currentTermCourses.map(c => c.id));
    const ids = new Set();
    students.forEach(s => { if (s.courseIds.some(cid => courseIds.has(cid))) ids.add(s.id); });
    return ids.size;
  }, [students, currentTermCourses]);

  const activeLecturerCount = useMemo(
    () => new Set(currentTermCourses.map(c => c.lecturerId)).size,
    [currentTermCourses]
  );

  const headerStats = [
    { icon: UserCheck, label: "Active Lecturers", value: activeLecturerCount, variant: "purple" },
    { icon: BookOpen, label: "Courses This Term", value: currentTermCourses.length, variant: "sky" },
    { icon: GraduationCap, label: "Enrolled Students", value: enrolledStudentCount, variant: "emerald" },
    { icon: Users, label: "Total Lecturers", value: lecturers.length, variant: "orange" },
  ];

  const headerActions = (
    <>
      <FilterDropdown
        label="Year"
        value={year}
        onChange={setYear}
        options={availableYears.map(y => ({ value: y, label: y }))}
      />
      <FilterDropdown
        label="Semester"
        value={semester}
        onChange={setSemester}
        options={[{ value: "1", label: "1" }, { value: "2", label: "2" }]}
      />
    </>
  );

  return (
    <div className="flex flex-col gap-6 pb-2">
      <DashboardHeader
        stats={headerStats}
        loading={isLoading}
        actions={headerActions}
        contextLine={`Managing ${year || "—"} · Semester ${semester}.`}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto min-h-[520px] animate-pulse">
          {/* Column 1 — course list */}
          <div className="flex flex-col gap-3 bg-white rounded-[28px] p-5 shadow-sm border border-gray-100">
            <div className="h-5 rounded-full bg-gray-200 w-24 mb-1" />
            <div className="h-8 rounded-2xl bg-gray-100 w-full mb-2" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100" />
            ))}
          </div>
          {/* Column 2 — lecturer */}
          <div className="flex flex-col gap-3 bg-white rounded-[28px] p-5 shadow-sm border border-gray-100">
            <div className="h-5 rounded-full bg-gray-200 w-28 mb-1" />
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#3C0078]/10 mt-2">
              <div className="w-10 h-10 rounded-full bg-[#3C0078]/20 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-2 rounded-full bg-[#3C0078]/20 w-2/5" />
                <div className="h-3 rounded-full bg-[#3C0078]/20 w-3/5" />
              </div>
            </div>
          </div>
          {/* Column 3 — student list */}
          <div className="flex flex-col gap-3 bg-white rounded-[28px] p-5 shadow-sm border border-gray-100">
            <div className="h-5 rounded-full bg-gray-200 w-28 mb-1" />
            <div className="h-8 rounded-2xl bg-gray-100 w-full mb-2" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 rounded-full bg-gray-200" style={{ width: `${45 + i * 12}%` }} />
                  <div className="h-3 rounded-full bg-gray-100 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.section
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1400px] mx-auto h-[68vh] min-h-[520px]"
          aria-label="Admin dashboard overview"
        >
          {/* Column 1: Courses */}
          <motion.div variants={column} className="min-h-0 h-full">
            <CourseColumn
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              filteredCourses={filteredCourses}
              selectedCourseId={selectedCourseId}
              handleSelectCourse={handleSelectCourse}
              lecturers={lecturers}
              onAddCourse={() => setShowCreateModal(true)}
              isAddingCourse={showCreateModal}
              warningCourseId={selectedCourseHasWarning ? selectedCourseId : null}
            />
          </motion.div>

          {/* Column 2: Lecturer for selected course */}
          <motion.div variants={column} className="min-h-0 h-full">
            <LecturerColumn
              lecturer={courseLecturer}
              selectedCourseId={selectedCourseId}
              isAddingLecturer={isAddingLecturer}
              setIsAddingLecturer={setIsAddingLecturer}
              onOpenAnalytics={handleOpenAnalytics}
              onOpenNotification={() => setIsSendingNotification(true)}
            />
          </motion.div>

          {/* Column 3: Students for selected course */}
          <motion.div variants={column} className="min-h-0 h-full">
            <StudentColumn
              showAddStudent={!!selectedCourseId}
              isAddingStudent={isAddingStudent}
              setIsAddingStudent={setIsAddingStudent}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              selectedCourseId={selectedCourseId}
              filteredStudents={filteredStudents}
              cohorts={courseCohorts}
              cohortStudentMap={cohortStudentMap}
            />
          </motion.div>
        </motion.section>
      )}

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

      {/* ── Create Course Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            show={showCreateModal}
            onClose={() => { setShowCreateModal(false); setCourseForm(DEFAULT_COURSE_FORM); }}
            form={courseForm}
            setForm={setCourseForm}
            teachers={createTeachers}
            onCreate={handleCreateCourse}
          />
        )}
      </AnimatePresence>

      {/* ── Add Lecturer Modal ── */}
      <AnimatePresence>
        {isAddingLecturer && (
          <AddLecturerForm
            onSave={handleSaveLecturer}
            onCancel={() => setIsAddingLecturer(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Add Student Modal ── */}
      <AnimatePresence>
        {isAddingStudent && (
          <AddStudentForm
            onSave={handleCreateStudent}
            onCancel={() => setIsAddingStudent(false)}
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
