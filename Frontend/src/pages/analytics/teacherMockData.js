// ── Filter options ──
export const YEARS = [2026, 2025];
export const SEMESTERS = ["Semester 1", "Semester 2"];
export const YEAR_LEVELS = ["2nd Year", "3rd Year"];

// ── Courses this teacher gives (one combo shown: 2026 / Semester 1) ──
export const MOCK_TEACHER_COURSES = [
  { id: "c1", code: "DV300", name: "Development 300", yearLevel: "3rd Year", semester: "Semester 1", year: 2026, enrolled: 28, color: "#3C0078" },
  { id: "c2", code: "UX300", name: "User Experience 300", yearLevel: "3rd Year", semester: "Semester 1", year: 2026, enrolled: 32, color: "#14B8A6" },
  { id: "c3", code: "DV200", name: "Development 200", yearLevel: "2nd Year", semester: "Semester 1", year: 2026, enrolled: 45, color: "#6366F1" },
];

// ── Assignments per course with grading progress ──
export const MOCK_ASSIGNMENTS = [
  { id: "a1", title: "React Dashboard Prototype", courseId: "c1", courseCode: "DV300", maxPoints: 100, dueDate: "2026-04-20", totalSubmissions: 28, graded: 28, avgScore: 74 },
  { id: "a2", title: "API Integration Task", courseId: "c1", courseCode: "DV300", maxPoints: 100, dueDate: "2026-05-10", totalSubmissions: 22, graded: 15, avgScore: 69 },
  { id: "a3", title: "Database Schema Design", courseId: "c1", courseCode: "DV300", maxPoints: 80, dueDate: "2026-05-18", totalSubmissions: 10, graded: 0, avgScore: null },
  { id: "a4", title: "Heuristic Evaluation Report", courseId: "c2", courseCode: "UX300", maxPoints: 100, dueDate: "2026-04-15", totalSubmissions: 32, graded: 32, avgScore: 81 },
  { id: "a5", title: "Usability Test Plan", courseId: "c2", courseCode: "UX300", maxPoints: 100, dueDate: "2026-04-28", totalSubmissions: 30, graded: 24, avgScore: 77 },
  { id: "a6", title: "Persona Research Brief", courseId: "c2", courseCode: "UX300", maxPoints: 60, dueDate: "2026-05-12", totalSubmissions: 18, graded: 0, avgScore: null },
  { id: "a7", title: "Component Library", courseId: "c3", courseCode: "DV200", maxPoints: 100, dueDate: "2026-04-22", totalSubmissions: 45, graded: 45, avgScore: 82 },
  { id: "a8", title: "State Management Workshop", courseId: "c3", courseCode: "DV200", maxPoints: 80, dueDate: "2026-05-05", totalSubmissions: 40, graded: 30, avgScore: 78 },
];

// ── Per-course class average trend (monthly, Jan–May) ──
export const MOCK_COURSE_TRENDS = {
  c1: [68, 70, 72, 74, 74],
  c2: [75, 77, 78, 80, 81],
  c3: [79, 80, 81, 82, 82],
};

// ── Student roster for the selected course (shows top/bottom performers) ──
export const MOCK_STUDENTS = [
  { id: "s1", name: "Alice Johnson", avatar: "AJ", email: "alice.j@student.ac.za", avgGrade: 88, submissions: 8, totalAssignments: 8, status: "Excellent" },
  { id: "s2", name: "Bob Smith", avatar: "BS", email: "bob.s@student.ac.za", avgGrade: 74, submissions: 7, totalAssignments: 8, status: "Good" },
  { id: "s3", name: "Charlie Davis", avatar: "CD", email: "charlie.d@student.ac.za", avgGrade: 92, submissions: 8, totalAssignments: 8, status: "Excellent" },
  { id: "s4", name: "Diana Prince", avatar: "DP", email: "diana.p@student.ac.za", avgGrade: 65, submissions: 6, totalAssignments: 8, status: "At Risk" },
  { id: "s5", name: "Ethan Hunt", avatar: "EH", email: "ethan.h@student.ac.za", avgGrade: 52, submissions: 5, totalAssignments: 8, status: "Critical" },
  { id: "s6", name: "Fiona Apple", avatar: "FA", email: "fiona.a@student.ac.za", avgGrade: 79, submissions: 8, totalAssignments: 8, status: "Good" },
  { id: "s7", name: "George Clark", avatar: "GC", email: "george.c@student.ac.za", avgGrade: 85, submissions: 8, totalAssignments: 8, status: "Good" },
  { id: "s8", name: "Hannah Lee", avatar: "HL", email: "hannah.l@student.ac.za", avgGrade: 91, submissions: 8, totalAssignments: 8, status: "Excellent" },
];

// ── Grade distribution buckets (for the selected course) ──
export const MOCK_GRADE_DISTRIBUTION = [
  { range: "90-100", count: 4, color: "#22c55e" },
  { range: "80-89", count: 8, color: "#3C0078" },
  { range: "70-79", count: 9, color: "#6366F1" },
  { range: "60-69", count: 5, color: "#F59E0B" },
  { range: "50-59", count: 2, color: "#f97316" },
  { range: "0-49", count: 0, color: "#ef4444" },
];
