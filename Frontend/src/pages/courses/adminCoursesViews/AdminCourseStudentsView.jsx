import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserMinus, UserPlus, Search } from "lucide-react";
import { userService, enrollmentService } from "../../../services/adminService";
import { getCourseCohorts, getCourseStudents, assignStudents } from "../../../services/classGroupService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

async function removeEnrollment(enrollmentId) {
  const res = await fetch(`${API_BASE}/Enrollment/${enrollmentId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to remove enrollment");
}

export function AdminCourseStudentsView({ courseId }) {
  const [enrollments, setEnrollments] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  // studentId -> classGroupId (cohort assignment)
  const [studentCohortMap, setStudentCohortMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [showEnrollPanel, setShowEnrollPanel] = useState(false);
  const [enrolling, setEnrolling] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [allEnrs, cohs, studs, cohortStudents] = await Promise.all([
        enrollmentService.getAllEnrollments().catch(() => []),
        getCourseCohorts(courseId).catch(() => []),
        userService.getStudents().catch(() => []),
        getCourseStudents(courseId).catch(() => []),
      ]);
      // Filter enrollments to just this course
      const enrs = (allEnrs || []).filter(
        e => e.courseId === courseId || e.course?.id === courseId
      );
      setEnrollments(enrs || []);
      setCohorts(cohs || []);
      setAllStudents(studs || []);

      // Build studentId -> classGroupId map from cohort-students endpoint
      const map = {};
      (cohortStudents || []).forEach(s => {
        if (s.studentId && s.classGroupId) {
          map[s.studentId] = s.classGroupId;
        }
      });
      setStudentCohortMap(map);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const enrolledIds = new Set(enrollments.map(e => e.student?.id || e.studentId));

  const handleEnroll = async (studentId) => {
    setEnrolling(studentId);
    try {
      await enrollmentService.create({ studentId, courseId, status: "Active" });
      await load();
      setEnrollSearch("");
    } catch (err) {
      alert("Failed to enroll: " + err.message);
    } finally {
      setEnrolling(null);
    }
  };

  const handleRemove = async (enrollmentId, studentId) => {
    if (!window.confirm("Remove this student from the course?")) return;
    setRemoving(enrollmentId);
    try {
      await removeEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      // Also clean up cohort map
      setStudentCohortMap(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (err) {
      alert("Failed to remove: " + err.message);
    } finally {
      setRemoving(null);
    }
  };

  const handleCohortChange = async (studentId, newCohortId) => {
    const oldCohortId = studentCohortMap[studentId] || null;

    // Optimistically update UI
    setStudentCohortMap(prev => ({ ...prev, [studentId]: newCohortId || undefined }));

    try {
      // Remove from old cohort
      if (oldCohortId) {
        const oldCohortStudentIds = Object.entries(studentCohortMap)
          .filter(([sid, cid]) => cid === oldCohortId && sid !== studentId)
          .map(([sid]) => sid);
        await assignStudents(oldCohortId, oldCohortStudentIds);
      }

      // Assign to new cohort
      if (newCohortId) {
        const newCohortStudentIds = Object.entries(studentCohortMap)
          .filter(([sid, cid]) => cid === newCohortId && sid !== studentId)
          .map(([sid]) => sid);
        await assignStudents(newCohortId, [...newCohortStudentIds, studentId]);
      }
    } catch (err) {
      // Revert on failure
      setStudentCohortMap(prev => ({ ...prev, [studentId]: oldCohortId || undefined }));
      alert("Failed to update group: " + err.message);
    }
  };

  const filtered = enrollments.filter(e => {
    const name = e.student ? `${e.student.firstName} ${e.student.lastName}` : "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
           e.student?.email?.toLowerCase().includes(search.toLowerCase());
  });

  const notEnrolled = allStudents.filter(s =>
    !enrolledIds.has(s.id) &&
    (`${s.firstName} ${s.lastName}`.toLowerCase().includes(enrollSearch.toLowerCase()) ||
     s.email?.toLowerCase().includes(enrollSearch.toLowerCase()))
  );

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.header variants={slideUp} className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1 text-sm">{enrollments.length} enrolled</p>
        </div>
        <button
          onClick={() => setShowEnrollPanel(p => !p)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
            showEnrollPanel
              ? "bg-gray-100 text-gray-700"
              : "bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/20 hover:bg-[#2a0055]"
          }`}
        >
          <UserPlus size={16} /> Enroll Student
        </button>
      </motion.header>

      {/* Enroll panel */}
      {showEnrollPanel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Add Student to Course</h3>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students not yet enrolled..."
              value={enrollSearch}
              onChange={e => setEnrollSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {notEnrolled.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {enrollSearch ? "No matches found." : "All students are already enrolled."}
              </p>
            ) : (
              notEnrolled.slice(0, 20).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#3C0078]/10 flex items-center justify-center text-[#3C0078] font-black text-xs shrink-0">
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                  <button
                    onClick={() => handleEnroll(s.id)}
                    disabled={enrolling === s.id}
                    className="px-4 py-1.5 rounded-xl bg-[#3C0078] text-white text-xs font-bold hover:bg-[#2a0055] transition-all disabled:opacity-50 shrink-0"
                  >
                    {enrolling === s.id ? "…" : "Enroll"}
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Search bar */}
      <motion.div variants={slideUp} className="mb-4 relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search enrolled students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 outline-none shadow-sm focus:ring-2 focus:ring-[#3C0078]/10"
        />
      </motion.div>

      {/* Student list */}
      <motion.div variants={slideUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-8 py-12 text-center text-gray-400 text-sm">Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="px-8 py-12 text-center text-gray-400 text-sm">No students enrolled in this course.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Group</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(enrollment => {
                const student = enrollment.student;
                const studentId = student?.id || enrollment.studentId;
                const name = student ? `${student.firstName} ${student.lastName}` : "Unknown";
                const initials = student ? `${student.firstName?.[0]}${student.lastName?.[0]}` : "?";
                const assignedCohortId = studentCohortMap[studentId] || "";

                return (
                  <tr key={enrollment.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#3C0078]/5 border border-[#3C0078]/10 flex items-center justify-center text-[#3C0078] font-black text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{name}</p>
                          <p className="text-xs text-gray-400">{student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cohorts.length > 0 ? (
                        <select
                          value={assignedCohortId}
                          onChange={e => handleCohortChange(studentId, e.target.value || null)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl outline-none appearance-none cursor-pointer ${
                            assignedCohortId
                              ? "bg-[#3C0078]/5 text-[#3C0078] border border-[#3C0078]/10"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <option value="">Unassigned</option>
                          {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                        enrollment.status === "Active"
                          ? "bg-green-50 text-green-700"
                          : enrollment.status === "Dropped"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {enrollment.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(enrollment.id, studentId)}
                        disabled={removing === enrollment.id}
                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="Remove from course"
                      >
                        <UserMinus size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
