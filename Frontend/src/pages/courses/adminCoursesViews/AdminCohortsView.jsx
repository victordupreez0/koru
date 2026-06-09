import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Users, ChevronDown, ChevronRight, Shuffle, AlertTriangle } from "lucide-react";
import {
  getCourseCohorts,
  createClassGroup,
  deleteClassGroup,
  getCohortDetails,
  assignStudents,
} from "../../../services/classGroupService";
import { enrollmentService } from "../../../services/adminService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AdminCohortsView({ courseId }) {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);
  const [maxPerGroup, setMaxPerGroup] = useState(15);
  const [assigning, setAssigning] = useState(false);
  const [assignStep, setAssignStep] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [cohortDetails, setCohortDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [cohortsData, allEnrollments] = await Promise.all([
        getCourseCohorts(courseId).catch(() => []),
        enrollmentService.getAllEnrollments().catch(() => []),
      ]);
      setCohorts(cohortsData || []);

      const courseStudents = (allEnrollments || []).filter(
        e => e.courseId === courseId || e.course?.id === courseId
      );
      const ids = courseStudents.map(e => e.studentId || e.student?.id).filter(Boolean);
      setEnrolledCount(ids.length);
      setEnrolledStudentIds(ids);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const groupCount = maxPerGroup > 0 ? Math.ceil(enrolledCount / maxPerGroup) : 0;

  const handleAutoAssign = async () => {
    if (enrolledCount === 0) return;
    if (groupCount === 0) return;

    const hasExisting = cohorts.length > 0;
    if (hasExisting) {
      const ok = window.confirm(
        `This will delete ${cohorts.length} existing group${cohorts.length !== 1 ? "s" : ""} and reassign all ${enrolledCount} students into ${groupCount} new group${groupCount !== 1 ? "s" : ""}. Continue?`
      );
      if (!ok) return;
    }

    setAssigning(true);
    setAssignStep("Clearing existing groups…");
    try {
      // Delete existing groups
      for (const cohort of cohorts) {
        await deleteClassGroup(cohort.id).catch(() => {});
      }

      // Shuffle students randomly for fair distribution
      const shuffled = shuffle(enrolledStudentIds);

      // Create groups and assign
      for (let i = 0; i < groupCount; i++) {
        setAssignStep(`Creating Group ${i + 1} of ${groupCount}…`);
        const group = await createClassGroup({ name: `Group ${i + 1}`, courseId });
        const slice = shuffled.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
        if (slice.length > 0) {
          await assignStudents(group.id, slice);
        }
      }

      setAssignStep("Done!");
      await load();
      setCohortDetails({});
    } catch (err) {
      alert("Auto-assign failed: " + err.message);
    } finally {
      setAssigning(false);
      setAssignStep("");
    }
  };

  const handleExpand = async (cohortId) => {
    if (expandedId === cohortId) { setExpandedId(null); return; }
    setExpandedId(cohortId);
    if (!cohortDetails[cohortId]) {
      setLoadingDetails(prev => ({ ...prev, [cohortId]: true }));
      try {
        const details = await getCohortDetails(cohortId);
        setCohortDetails(prev => ({ ...prev, [cohortId]: details }));
      } catch {
        setCohortDetails(prev => ({ ...prev, [cohortId]: { students: [] } }));
      } finally {
        setLoadingDetails(prev => ({ ...prev, [cohortId]: false }));
      }
    }
  };

  const handleDelete = async (cohortId, name) => {
    if (!window.confirm(`Delete group "${name}"? Students will be unassigned.`)) return;
    setDeletingId(cohortId);
    try {
      await deleteClassGroup(cohortId);
      setCohorts(prev => prev.filter(c => c.id !== cohortId));
      if (expandedId === cohortId) setExpandedId(null);
    } catch (err) {
      alert("Failed to delete group: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.header variants={slideUp} className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Groups</h1>
        <p className="text-gray-500 mt-1 text-sm">{cohorts.length} {cohorts.length === 1 ? "group" : "groups"} · {enrolledCount} enrolled students</p>
      </motion.header>

      {/* Auto-assign config card */}
      <motion.div variants={slideUp} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Auto-Assign Configuration</h3>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Input */}
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
              Max students per group
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={maxPerGroup}
              onChange={e => setMaxPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
            />
          </div>

          {/* Preview + button */}
          <div className="flex flex-col gap-2 sm:items-end">
            {enrolledCount > 0 && groupCount > 0 ? (
              <p className="text-sm font-semibold text-gray-600">
                <span className="text-[#3C0078] font-black">{enrolledCount}</span> students →{" "}
                <span className="text-[#3C0078] font-black">{groupCount}</span> group{groupCount !== 1 ? "s" : ""}
                {" "}of ~<span className="text-[#3C0078] font-black">{maxPerGroup}</span>
              </p>
            ) : enrolledCount === 0 ? (
              <p className="text-sm text-gray-400">No enrolled students yet</p>
            ) : null}

            <button
              onClick={handleAutoAssign}
              disabled={assigning || enrolledCount === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-bold shadow-lg shadow-[#3C0078]/20 hover:bg-[#2a0055] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Shuffle size={15} />
              {assigning ? assignStep || "Working…" : cohorts.length > 0 ? "Reassign Groups" : "Auto-Assign Groups"}
            </button>
          </div>
        </div>

        {/* Warning if groups already exist */}
        {cohorts.length > 0 && !assigning && (
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-700">
              Reassigning will delete all current groups and redistribute students from scratch.
            </p>
          </div>
        )}
      </motion.div>

      {/* Groups list */}
      <motion.div variants={slideUp} className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-10 text-center text-gray-400 text-sm">
            Loading groups…
          </div>
        ) : cohorts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-14 text-center">
            <div className="w-14 h-14 rounded-3xl bg-[#3C0078]/5 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-[#3C0078]/40" />
            </div>
            <p className="text-gray-500 font-semibold mb-1">No groups yet</p>
            <p className="text-xs text-gray-400">Set a max per group above and click Auto-Assign to get started.</p>
          </div>
        ) : (
          cohorts.map(cohort => {
            const isExpanded = expandedId === cohort.id;
            const details = cohortDetails[cohort.id];
            const isLoadingDetails = loadingDetails[cohort.id];
            const studentCount = details?.students?.length ?? cohort.studentCount ?? "—";

            return (
              <div key={cohort.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center px-6 py-4 gap-4 group">
                  <button
                    onClick={() => handleExpand(cohort.id)}
                    className="w-9 h-9 rounded-2xl bg-gray-50 hover:bg-[#3C0078]/5 flex items-center justify-center text-gray-400 hover:text-[#3C0078] transition-all shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-[#3C0078]/5 border border-[#3C0078]/10 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-[#3C0078]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{cohort.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {typeof studentCount === "number" ? `${studentCount} student${studentCount !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(cohort.id, cohort.name)}
                    disabled={deletingId === cohort.id}
                    className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Delete group"
                  >
                    {deletingId === cohort.id ? <span className="text-xs">…</span> : <Trash2 size={15} />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-gray-50"
                    >
                      {isLoadingDetails ? (
                        <div className="px-8 py-6 text-center text-gray-400 text-sm">Loading students…</div>
                      ) : !details?.students?.length ? (
                        <div className="px-8 py-6 text-center text-gray-400 text-sm">No students in this group.</div>
                      ) : (
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {details.students.map(s => (
                            <div key={s.id || s.studentId} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/80">
                              <div className="w-8 h-8 rounded-full bg-[#3C0078]/5 border border-[#3C0078]/10 flex items-center justify-center text-[#3C0078] font-black text-xs shrink-0">
                                {(s.firstName || s.student?.firstName)?.[0]}
                                {(s.lastName || s.student?.lastName)?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">
                                  {s.firstName || s.student?.firstName} {s.lastName || s.student?.lastName}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{s.email || s.student?.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
