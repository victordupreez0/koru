import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";

import { TeacherAnalyticsModal } from "../courses/adminCoursesComponents";
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

const column = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
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

  // ── Modal state ──
  const [isAddingLecturer, setIsAddingLecturer] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showTeacherAnalytics, setShowTeacherAnalytics] = useState(false);
  const [analyticsTeacher, setAnalyticsTeacher] = useState(null);

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
        title: c.subject?.name || "Unknown Subject",
        code: c.subject?.code || "",
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

  useEffect(() => {
    fetchData();
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
    ]).then(([cohorts, courseStudents]) => {
      setCourseCohorts(cohorts || []);
      const map = {};
      (courseStudents || []).forEach(s => { map[s.studentId] = s.classGroupId; });
      setCohortStudentMap(map);
    });
  }, [selectedCourseId]);

  // ── Handlers ──
  const handleSelectLecturer = (id) => {
    setSelectedLecturerId(id);
    setSelectedCourseId(null);
  };

  const handleSelectCourse = (id) => {
    setSelectedCourseId(id);
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
        await enrollmentService.create({
          studentId,
          courseId: selectedCourseId,
          status: "Active",
        });
      }
      setIsAddingStudent(false);
      await fetchData();
    } catch (err) {
      alert("Failed to create student: " + err.message);
    }
  };

  const showAddStudent = !!selectedCourseId;

  // ── Header KPIs ──
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
        <div className="min-h-[520px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#3C0078] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Loading Dashboard...
            </p>
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
          <motion.div variants={column} className="min-h-0 h-full">
            <LecturerColumn
              lecturerSearch={lecturerSearch}
              setLecturerSearch={setLecturerSearch}
              isAddingLecturer={isAddingLecturer}
              setIsAddingLecturer={setIsAddingLecturer}
              filteredLecturers={filteredLecturers}
              selectedLecturerId={selectedLecturerId}
              handleSelectLecturer={handleSelectLecturer}
              onOpenAnalytics={handleOpenAnalytics}
              onOpenNotification={() => setIsSendingNotification(true)}
            />
          </motion.div>

          <motion.div variants={column} className="min-h-0 h-full">
            <CourseColumn
              courseSearch={courseSearch}
              setCourseSearch={setCourseSearch}
              selectedLecturerId={selectedLecturerId}
              filteredCourses={filteredCourses}
              selectedCourseId={selectedCourseId}
              handleSelectCourse={handleSelectCourse}
              lecturers={lecturers}
            />
          </motion.div>

          <motion.div variants={column} className="min-h-0 h-full">
            <StudentColumn
              showAddStudent={showAddStudent}
              isAddingStudent={isAddingStudent}
              setIsAddingStudent={setIsAddingStudent}
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
