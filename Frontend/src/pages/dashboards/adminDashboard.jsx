import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import { TeacherAnalyticsModal } from "../courses/adminCoursesComponents";
import { createEvent } from "../../services/eventService";
import { 
  FilterDropdown, 
  LecturerColumn, 
  CourseColumn, 
  StudentColumn, 
  AssignStudentsModal,
  SendNotificationModal
} from "./adminDashboardComponents";

// ──────────────────────────────────────────────
// MOCK DATA – swap with backend service later
// ──────────────────────────────────────────────
const MOCK_LECTURERS = [
  { id: 1, name: "Tsungai Katsuro" },
  { id: 2, name: "Laudette Sass" },
  { id: 3, name: "Peter Smith" },
];

const MOCK_COURSES = [
  { id: 1, title: "User Experience Design 200", code: "UX200", lecturerId: 1, year: 3, semester: 1 },
  { id: 2, title: "Interactive Development 200", code: "ID200", lecturerId: 1, year: 3, semester: 1 },
  { id: 3, title: "Photography 200", code: "PH200", lecturerId: 3, year: 3, semester: 1 },
  { id: 4, title: "Communication Design 200", code: "CM200", lecturerId: 2, year: 3, semester: 1 },
  { id: 5, title: "Robotics and Electronic 200", code: "RE200", lecturerId: 2, year: 3, semester: 1 },
  { id: 6, title: "User Experience Design 200", code: "UX200", lecturerId: 2, year: 3, semester: 2 },
  { id: 7, title: "Interactive Development 200", code: "ID200", lecturerId: 1, year: 3, semester: 2 },
];

const MOCK_STUDENTS = [
  { id: 1, name: "Abigail Bota", major: "Double Major UX & DV", courseIds: [1, 2] },
  { id: 2, name: "Andre Delport", major: "Double Major UX & DV", courseIds: [1, 2] },
  { id: 3, name: "Bianca Du Toit", major: "Single Major DV", courseIds: [2, 3] },
  { id: 4, name: "Ben Cole", major: "Double Major CM & DV", courseIds: [1, 4] },
  { id: 5, name: "Cara Clark", major: "Double Major Pho & CM", courseIds: [3, 4] },
  { id: 6, name: "Cloe Mathews", major: "Single Major DV", courseIds: [2, 5] },
  { id: 7, name: "Dave Strydom", major: "Single Major UX", courseIds: [1, 6] },
  { id: 8, name: "Daniel Martins", major: "Single Major PH", courseIds: [3, 5] },
  { id: 9, name: "Emily Sanders", major: "Double Major UX & CM", courseIds: [4, 6] },
  { id: 10, name: "Franco Visser", major: "Single Major RE", courseIds: [5, 7] },
];

// ──────────────────────────────────────────────
// MAIN ADMIN DASHBOARD
// ──────────────────────────────────────────────
export default function AdminDashboard() {
  // ── Global filters ──
  const [year, setYear] = useState("3");
  const [semester, setSemester] = useState("1");

  // ── Data state (local mock) ──
  const [lecturers, setLecturers] = useState(MOCK_LECTURERS);
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [students, setStudents] = useState(MOCK_STUDENTS);

  // ── Selection state ──
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

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

  // ── Derived data ──
  const filteredLecturers = useMemo(() => {
    // Only show lecturers who teach at least one course in the selected year/semester
    const lecturerIdsWithCourses = new Set(
      courses
        .filter((c) => c.year === parseInt(year) && c.semester === parseInt(semester))
        .map((c) => c.lecturerId)
    );
    return lecturers.filter(
      (l) =>
        lecturerIdsWithCourses.has(l.id) &&
        l.name.toLowerCase().includes(lecturerSearch.toLowerCase())
    );
  }, [lecturers, courses, year, semester, lecturerSearch]);

  const filteredCourses = useMemo(() => {
    if (!selectedLecturerId) return [];
    return courses.filter(
      (c) =>
        c.lecturerId === selectedLecturerId &&
        c.year === parseInt(year) &&
        c.semester === parseInt(semester) &&
        c.title.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, selectedLecturerId, year, semester, courseSearch]);

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    let result = students.filter(
      (s) =>
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
      // Keep current selection if still valid, otherwise pick the first
      if (!filteredLecturers.find((l) => l.id === selectedLecturerId)) {
        setSelectedLecturerId(filteredLecturers[0].id);
      }
    } else {
      setSelectedLecturerId(null);
    }
  }, [filteredLecturers]);

  useEffect(() => {
    if (filteredCourses.length > 0) {
      if (!filteredCourses.find((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    } else {
      setSelectedCourseId(null);
    }
  }, [filteredCourses]);

  // ── Handlers ──
  const handleSelectLecturer = (id) => {
    setSelectedLecturerId(id);
    setSelectedCourseId(null); // Reset course – will auto-select via effect
    setIsAddingLecturer(false);
    setIsAddingCourse(false);
  };

  const handleSelectCourse = (id) => {
    setSelectedCourseId(id);
    setIsAddingCourse(false);
  };

  const handleSaveLecturer = (name) => {
    const newId = Math.max(...lecturers.map((l) => l.id), 0) + 1;
    setLecturers((prev) => [...prev, { id: newId, name }]);
    setIsAddingLecturer(false);
    // Don't auto-select – they have no courses yet
  };

  const handleOpenAnalytics = (lecturer) => {
    // Map the dashboard lecturer data to the format expected by the modal
    const formattedTeacher = {
      firstName: lecturer.name.split(" ")[0] || "Lecturer",
      lastName: lecturer.name.split(" ").slice(1).join(" ") || "",
      email: `${lecturer.name.toLowerCase().replace(/\s+/g, ".")}@learnonline.ac.za`,
      ...lecturer
    };
    setAnalyticsTeacher(formattedTeacher);
    setShowTeacherAnalytics(true);
  };

  const handleSendNotification = async (notificationData) => {
    try {
      // Backend integration is paused as requested. 
      // For now, we just simulate the success.
      console.log("Simulating notification send:", notificationData);
      
      alert(`Simulation Mode: Notification sent to ${notificationData.selectedIds.length} lecturers!\n\nDetails:\nTitle: ${notificationData.title}\nDate: ${notificationData.startTime}`);
      
      setIsSendingNotification(false);
    } catch (err) {
      console.error("Failed to send notification:", err);
      alert("Failed to send notification. Please try again.");
    }
  };

  const handleSaveCourse = (title, code) => {
    const newId = Math.max(...courses.map((c) => c.id), 0) + 1;
    const newCourse = {
      id: newId,
      title,
      code,
      lecturerId: selectedLecturerId,
      year: parseInt(year),
      semester: parseInt(semester),
    };
    setCourses((prev) => [...prev, newCourse]);
    setIsAddingCourse(false);
    setSelectedCourseId(newId);
  };

  const handleAssignStudent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, courseIds: [...s.courseIds, selectedCourseId] }
          : s
      )
    );
  };

  const selectedLecturer = lecturers.find((l) => l.id === selectedLecturerId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Conditional Add-button visibility
  const showAddCourse = selectedLecturerId && !isAddingLecturer;
  const showAddStudent = selectedCourseId && !isAddingCourse && !isAddingLecturer;

  return (
    <div className="relative h-[80vh] overflow-hidden flex items-center justify-center p-6">
      <Menu />
      <SideMenu />

      <div className="flex flex-col h-full w-full max-w-[1400px]">
        {/* ── Year / Semester filter bar ── */}
        <div className="flex items-center justify-start gap-4 pt-16 pb-4">
          <FilterDropdown
            label="Year"
            value={year}
            onChange={setYear}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
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
          
          <button 
            onClick={() => setIsSendingNotification(true)}
            className="ml-auto px-6 py-3 rounded-2xl bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20 flex items-center gap-3 hover:scale-[1.03] transition-all group"
          >
            <Bell size={18} />
            <span className="text-[11px] font-black uppercase tracking-wider">Send Notification</span>
          </button>
        </div>

        {/* ── Three-column grid ── */}
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
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
          />

          <StudentColumn
            showAddStudent={showAddStudent}
            setIsAssigningStudents={setIsAssigningStudents}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            studentSort={studentSort}
            setStudentSort={setStudentSort}
            selectedCourseId={selectedCourseId}
            filteredStudents={filteredStudents}
          />
        </div>
      </div>

      {/* ── Assign Students Modal ── */}
      <AnimatePresence>
        {isAssigningStudents && selectedCourse && (
          <AssignStudentsModal
            allStudents={students}
            currentStudentIds={filteredStudents.map((s) => s.id)}
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
