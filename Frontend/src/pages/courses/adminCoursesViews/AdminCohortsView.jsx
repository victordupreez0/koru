import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Users, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import {
  getCourseCohorts,
  createClassGroup,
  deleteClassGroup,
  getCohortDetails,
} from "../../../services/classGroupService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";

export function AdminCohortsView({ courseId }) {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cohortDetails, setCohortDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await getCourseCohorts(courseId).catch(() => []);
      setCohorts(data || []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleExpand = async (cohortId) => {
    if (expandedId === cohortId) {
      setExpandedId(null);
      return;
    }
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

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSavingNew(true);
    try {
      await createClassGroup({ name: newName.trim(), courseId });
      setNewName("");
      setCreating(false);
      await load();
    } catch (err) {
      alert("Failed to create group: " + err.message);
    } finally {
      setSavingNew(false);
    }
  };

  const handleDelete = async (cohortId, name) => {
    if (!window.confirm(`Delete group "${name}"? Students will be unassigned from this group.`)) return;
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
      <motion.header variants={slideUp} className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Groups</h1>
          <p className="text-gray-500 mt-1 text-sm">{cohorts.length} {cohorts.length === 1 ? "group" : "groups"} for this course</p>
        </div>
        <button
          onClick={() => { setCreating(true); setNewName(""); }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-bold shadow-lg shadow-[#3C0078]/20 hover:bg-[#2a0055] transition-all"
        >
          <Plus size={16} /> New Group
        </button>
      </motion.header>

      {/* Create new cohort panel */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 bg-white rounded-3xl border border-[#3C0078]/10 shadow-sm p-5"
          >
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">New Group</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Group A"
                autoFocus
                className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3C0078]/10"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || savingNew}
                className="px-5 py-3 rounded-2xl bg-[#3C0078] text-white text-sm font-bold hover:bg-[#2a0055] disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Check size={15} /> {savingNew ? "Creating…" : "Create"}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="p-3 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cohort list */}
      <motion.div variants={slideUp} className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-12 text-center text-gray-400 text-sm">
            Loading groups…
          </div>
        ) : cohorts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-16 text-center">
            <div className="w-14 h-14 rounded-3xl bg-[#3C0078]/5 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-[#3C0078]/40" />
            </div>
            <p className="text-gray-500 font-semibold mb-1">No groups yet</p>
            <p className="text-xs text-gray-400">Create a group to organise students for this course.</p>
          </div>
        ) : (
          cohorts.map(cohort => {
            const isExpanded = expandedId === cohort.id;
            const details = cohortDetails[cohort.id];
            const isLoadingDetails = loadingDetails[cohort.id];
            const studentCount = details?.students?.length ?? cohort.studentCount ?? "—";

            return (
              <div
                key={cohort.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Cohort header */}
                <div className="flex items-center px-6 py-4 gap-4 group">
                  <button
                    onClick={() => handleExpand(cohort.id)}
                    className="w-9 h-9 rounded-2xl bg-gray-50 hover:bg-[#3C0078]/5 flex items-center justify-center text-gray-400 hover:text-[#3C0078] transition-all shrink-0"
                  >
                    {isExpanded
                      ? <ChevronDown size={16} />
                      : <ChevronRight size={16} />
                    }
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
                    {deletingId === cohort.id ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>

                {/* Expanded student list */}
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
