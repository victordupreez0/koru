import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronDown, ExternalLink, User, X } from "lucide-react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";

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
// REUSABLE COLUMN CARD
// ──────────────────────────────────────────────
function ColumnCard({ children, isSelected, onClick, className = "" }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 cursor-pointer border
        ${isSelected
          ? "bg-[#3C0078] text-white border-[#3C0078] shadow-lg shadow-[#3C0078]/15"
          : "bg-white border-gray-200 hover:shadow-md hover:border-gray-300"
        } ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ──────────────────────────────────────────────
// FILTER DROPDOWN
// ──────────────────────────────────────────────
function FilterDropdown({ label, value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 rounded-full px-5 py-2.5 pr-10 text-sm font-semibold text-gray-700 cursor-pointer hover:border-gray-300 transition-colors outline-none focus:ring-2 focus:ring-[#3C0078]/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {label} {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ──────────────────────────────────────────────
// SEARCH INPUT
// ──────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full max-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#3C0078]/30 focus:bg-white transition-colors"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// ADD LECTURER FORM
// ──────────────────────────────────────────────
function AddLecturerForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 mb-3">
        <input
          type="text"
          placeholder="Lecturer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          autoFocus
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())} className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors">Save</button>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// ADD COURSE FORM
// ──────────────────────────────────────────────
function AddCourseForm({ lecturerName, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 mb-3">
        <input type="text" placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors" />
        <input type="text" placeholder="Course code (e.g. UX300)" value={code} onChange={(e) => setCode(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors" />
        <p className="text-xs text-gray-400">Lecturer: {lecturerName}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={() => title.trim() && code.trim() && onSave(title.trim(), code.trim())} className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors">Save</button>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// ASSIGN STUDENTS MODAL
// ──────────────────────────────────────────────
function AssignStudentsModal({ allStudents, currentStudentIds, courseTitle, onAssign, onClose }) {
  const [search, setSearch] = useState("");
  const unassigned = allStudents.filter(
    (s) => !currentStudentIds.includes(s.id) && s.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-['Gabarito']">Assign Students</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Adding to <span className="font-semibold text-gray-700">{courseTitle}</span></p>
        <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
          {unassigned.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No more students to assign.</p>
          ) : (
            unassigned.map((student) => (
              <button
                key={student.id}
                onClick={() => onAssign(student.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.major}</p>
                </div>
                <Plus className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

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
        </div>

        {/* ── Three-column grid ── */}
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">

          {/* ════════════════════ COLUMN 1: LECTURERS ════════════════════ */}
          <div className="flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold font-['Gabarito']">Lecturers</h2>
              <button
                onClick={() => { setIsAddingLecturer(true); setIsAddingCourse(false); }}
                className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Add lecturer"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <SearchInput value={lecturerSearch} onChange={setLecturerSearch} />

            <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
              <AnimatePresence>
                {isAddingLecturer && (
                  <AddLecturerForm
                    onSave={handleSaveLecturer}
                    onCancel={() => setIsAddingLecturer(false)}
                  />
                )}
              </AnimatePresence>

              {filteredLecturers.length === 0 && !isAddingLecturer ? (
                <p className="text-sm text-gray-400 text-center py-8">No lecturers found for this filter.</p>
              ) : (
                filteredLecturers.map((lecturer, idx) => (
                  <div key={lecturer.id} className="flex items-stretch gap-0">
                    {/* Timeline track */}
                    <div className="flex flex-col items-center w-6 shrink-0">
                      <div className={`w-px flex-1 ${idx === 0 ? "bg-transparent" : "bg-gray-300"}`} />
                      <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${lecturer.id === selectedLecturerId ? "border-[#3C0078] bg-[#3C0078]" : "border-gray-300 bg-white"
                        }`} />
                      <div className={`w-px flex-1 ${idx === filteredLecturers.length - 1 ? "bg-transparent" : "bg-gray-300"}`} />
                    </div>

                    {/* Card */}
                    <ColumnCard
                      isSelected={lecturer.id === selectedLecturerId}
                      onClick={() => handleSelectLecturer(lecturer.id)}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${lecturer.id === selectedLecturerId ? "bg-white/20" : "bg-gray-100"
                        }`}>
                        <User className={`w-4 h-4 ${lecturer.id === selectedLecturerId ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${lecturer.id === selectedLecturerId ? "text-white/70" : "text-gray-400"}`}>
                          Lecturer
                        </p>
                        <p className={`text-sm font-bold ${lecturer.id === selectedLecturerId ? "text-white" : "text-gray-800"}`}>
                          {lecturer.name}
                        </p>
                      </div>
                    </ColumnCard>
                  </div>
                ))
              )}
            </div>
          </div>


          {/* ════════════════════ COLUMN 2: COURSES ════════════════════ */}
          <div className="flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold font-['Gabarito']">Courses</h2>
              {showAddCourse && (
                <button
                  onClick={() => { setIsAddingCourse(true); }}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  aria-label="Add course"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
            <SearchInput value={courseSearch} onChange={setCourseSearch} />

            <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
              <AnimatePresence>
                {isAddingCourse && selectedLecturer && (
                  <AddCourseForm
                    lecturerName={selectedLecturer.name}
                    onSave={handleSaveCourse}
                    onCancel={() => setIsAddingCourse(false)}
                  />
                )}
              </AnimatePresence>

              {!selectedLecturerId ? (
                <p className="text-sm text-gray-400 text-center py-8">Select a lecturer to view courses.</p>
              ) : filteredCourses.length === 0 && !isAddingCourse ? (
                <p className="text-sm text-gray-400 text-center py-8">No courses found.</p>
              ) : (
                filteredCourses.map((course) => (
                  <ColumnCard
                    key={course.id}
                    isSelected={course.id === selectedCourseId}
                    onClick={() => handleSelectCourse(course.id)}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${course.id === selectedCourseId ? "bg-white" : "bg-gray-300"
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${course.id === selectedCourseId ? "text-white" : "text-gray-800"}`}>
                        {course.title}
                      </p>
                      <p className={`text-xs ${course.id === selectedCourseId ? "text-white/70" : "text-gray-400"}`}>
                        {lecturers.find((l) => l.id === course.lecturerId)?.name}
                      </p>
                    </div>
                  </ColumnCard>
                ))
              )}
            </div>
          </div>


          {/* ════════════════════ COLUMN 3: STUDENTS ════════════════════ */}
          <div className="flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold font-['Gabarito']">Students</h2>
              {showAddStudent && (
                <button
                  onClick={() => setIsAssigningStudents(true)}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  aria-label="Add student to course"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SearchInput value={studentSearch} onChange={setStudentSearch} />
              <select
                value={studentSort}
                onChange={(e) => setStudentSort(e.target.value)}
                className="appearance-none text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="alpha">Alphabetical Order</option>
                <option value="default">Default Order</option>
              </select>
            </div>

            <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {!selectedCourseId ? (
                <p className="text-sm text-gray-400 text-center py-8">Select a course to view students.</p>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No students enrolled.</p>
              ) : (
                filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 bg-white border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.major}</p>
                    </div>
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

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
    </div>
  );
}
