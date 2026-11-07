import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserMinus, UserPlus, Search } from "lucide-react";
import { userService, enrollmentService } from "../../../services/adminService";
import { getCourseCohorts, getCourseStudents, assignStudents } from "../../../services/classGroupService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";
import { Avatar, Badge, Button, Input, Select, Skeleton } from "../../../components/UI";

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
          <h1 className="font-display text-koru-title text-koru-on-surface">Students</h1>
          <p className="text-koru-on-surface-variant mt-1 text-sm">{enrollments.length} enrolled</p>
        </div>
        <Button
          variant={showEnrollPanel ? "tonal" : "filled"}
          onClick={() => setShowEnrollPanel(p => !p)}
          startIcon={<UserPlus size={16} aria-hidden="true" />}
        >
          Enroll Student
        </Button>
      </motion.header>

      {/* Enroll panel */}
      {showEnrollPanel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-koru-surface-container-lowest rounded-koru-2xl ring-1 ring-inset ring-koru-outline-faint shadow-koru-card p-6"
        >
          <h3 className="text-xs font-medium uppercase tracking-widest text-koru-on-surface-variant mb-4">Add Student to Course</h3>
          <Input
            aria-label="Search students not yet enrolled"
            containerClassName="mb-3"
            size="sm"
            type="text"
            startIcon={<Search size={14} />}
            placeholder="Search students not yet enrolled..."
            value={enrollSearch}
            onChange={e => setEnrollSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {notEnrolled.length === 0 ? (
              <p className="text-sm text-koru-on-surface-variant text-center py-4">
                {enrollSearch ? "No matches found." : "All students are already enrolled."}
              </p>
            ) : (
              notEnrolled.slice(0, 20).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-koru-lg bg-koru-surface-container hover:bg-koru-surface-container-high transition-colors">
                  <Avatar user={s} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-koru-on-surface truncate">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-koru-on-surface-variant truncate">{s.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="filled"
                    onClick={() => handleEnroll(s.id)}
                    disabled={enrolling === s.id}
                    className="shrink-0"
                  >
                    {enrolling === s.id ? "…" : "Enroll"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Search bar */}
      <motion.div variants={slideUp} className="mb-4">
        <Input
          aria-label="Search enrolled students"
          type="text"
          startIcon={<Search size={14} />}
          placeholder="Search enrolled students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </motion.div>

      {/* Student list */}
      <motion.div variants={slideUp} className="bg-koru-surface-container-lowest rounded-koru-2xl ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
        {loading ? (
          <div role="status" aria-label="Loading students">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-koru-surface-container/50 border-b border-koru-outline-faint">
                  <th className="px-6 py-4"><Skeleton variant="text" className="w-16" /></th>
                  <th className="px-6 py-4"><Skeleton variant="text" className="w-12" /></th>
                  <th className="px-6 py-4"><Skeleton variant="text" className="w-14" /></th>
                  <th className="px-6 py-4"><Skeleton variant="text" className="w-16 ml-auto" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-koru-outline-faint">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
                        <div className="flex flex-col gap-2">
                          <Skeleton variant="text" className="h-4" style={{ width: `${70 + (i * 17) % 45}px` }} />
                          <Skeleton variant="text" className="w-36" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-7 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-8 py-12 text-center text-koru-on-surface-variant text-sm">No students enrolled in this course.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-koru-surface-container/50 border-b border-koru-outline-faint">
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Student</th>
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Group</th>
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Status</th>
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(enrollment => {
                const student = enrollment.student;
                const studentId = student?.id || enrollment.studentId;
                const name = student ? `${student.firstName} ${student.lastName}` : "Unknown";
                const assignedCohortId = studentCohortMap[studentId] || "";

                return (
                  <tr key={enrollment.id} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={student || { id: studentId }} name={name} size={36} />
                        <div>
                          <p className="text-sm font-medium text-koru-on-surface">{name}</p>
                          <p className="text-xs text-koru-on-surface-variant">{student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cohorts.length > 0 ? (
                        <div className="w-40">
                          <Select
                            aria-label={`Group for ${name}`}
                            size="sm"
                            value={assignedCohortId}
                            onChange={e => handleCohortChange(studentId, e.target.value || null)}
                          >
                            <option value="">Unassigned</option>
                            {cohorts.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </Select>
                        </div>
                      ) : (
                        <span className="text-xs text-koru-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={enrollment.status === "Active" ? "success" : enrollment.status === "Dropped" ? "error" : "neutral"}>
                        {enrollment.status || "Active"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="text"
                        size="icon"
                        onClick={() => handleRemove(enrollment.id, studentId)}
                        disabled={removing === enrollment.id}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        title="Remove from course"
                        aria-label={`Remove ${name} from course`}
                      >
                        <UserMinus size={15} aria-hidden="true" />
                      </Button>
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
