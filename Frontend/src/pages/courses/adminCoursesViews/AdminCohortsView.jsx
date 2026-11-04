import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Users, ChevronDown, ChevronRight, Shuffle, AlertTriangle,
  Plus, BookOpen, Clock, User, MapPin, Calendar, Check, Pencil,
  AlertCircle, ExternalLink,
} from "lucide-react";
import {
  getCourseCohorts,
  createClassGroup,
  deleteClassGroup,
  getCohortDetails,
  assignStudents,
  getCourseStudents,
} from "../../../services/classGroupService";
import { enrollmentService, userService } from "../../../services/adminService";
import { classService } from "../../../services/classService";
import { getCourseEvents } from "../../../services/eventService";
import { getCourseLecturers } from "../../../services/courseService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, EmptyState, Input, Select, Skeleton, SkeletonText } from "../../../components/UI";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const QUICK_NAMES = ["Lecture", "Workshop", "Practical", "Tutorial"];
const DEFAULT_SLOT_FORM = { name: "", durationHours: "2", teacherId: "", room: "", dayOfWeek: "", startTime: "", endTime: "" };
const DEFAULT_MANUAL_FORM = { name: "", teacherId: "", room: "", dayOfWeek: "", startTime: "", endTime: "" };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// ── Quick-name chips + text input combo ────────────────────────────────────────
function NameField({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_NAMES.map(n => (
          <button
            key={n} type="button" onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`h-7 rounded-koru-sm px-2.5 text-[11px] font-medium transition-colors duration-150 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
              value === n
                ? "bg-koru-secondary-container text-koru-on-secondary-container"
                : "bg-koru-surface-container-high text-koru-on-surface-variant hover:bg-koru-primary/8 hover:text-koru-primary"
            }`}
          >{n}</button>
        ))}
      </div>
      <Input
        size="sm"
        type="text" placeholder="Custom name…" value={value}
        aria-label="Class name"
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Class slot card ────────────────────────────────────────────────────────────
function ClassSlotCard({ slot, onEdit, onDelete, deleting }) {
  const isScheduled = !!slot.startTime;

  return (
    <div className={`group rounded-koru-md border px-3 py-2.5 transition-colors ${
      isScheduled
        ? "bg-koru-success-soft/70 border-koru-success/20"
        : "bg-koru-surface-container-low/80 border-koru-outline-variant/80"
    }`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Top row: name + status badge */}
          <div className="flex flex-wrap items-center gap-1.5">
            {slot.name && (
              <Badge variant={isScheduled ? "success" : "neutral"}>
                {slot.name}
              </Badge>
            )}
            {/* Scheduled / Unscheduled status badge */}
            {isScheduled ? (
              <Badge variant="success" dot>
                Active
              </Badge>
            ) : (
              <Badge variant="warning">
                Unscheduled
              </Badge>
            )}
          </div>

          {/* Detail row */}
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {isScheduled ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-koru-success">
                <Calendar size={9} />
                {slot.dayOfWeek} · {formatTime(slot.startTime)}
                {slot.endTime && ` – ${formatTime(slot.endTime)}`}
              </span>
            ) : (
              <>
                {slot.durationHours && (
                  <span className="flex items-center gap-0.5 text-[10px] text-koru-on-surface-variant">
                    <Clock size={9} />{slot.durationHours}h
                  </span>
                )}
                {slot.dayOfWeek && (
                  <span className="flex items-center gap-0.5 text-[10px] text-koru-on-surface-variant">
                    <Calendar size={9} />Preferred: {slot.dayOfWeek}
                  </span>
                )}
              </>
            )}
            {slot.teacherName && (
              <span className="flex items-center gap-0.5 text-[10px] text-koru-on-surface-variant">
                <User size={9} />{slot.teacherName}
              </span>
            )}
            {slot.room && (
              <span className="flex items-center gap-0.5 text-[10px] text-koru-on-surface-variant">
                <MapPin size={9} />{slot.room}
              </span>
            )}
          </div>
        </div>

        {/* Actions — only render when handlers are provided */}
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            {onEdit && (
              <Button variant="text" size="icon" onClick={onEdit} aria-label={`Edit ${slot.name || "class slot"}`} className="!h-7 !w-7 !text-koru-on-surface-variant hover:!text-koru-primary">
                <Pencil size={12} />
              </Button>
            )}
            {onDelete && (
              <Button variant="text" size="icon" onClick={onDelete} disabled={deleting} aria-label={`Delete ${slot.name || "class slot"}`} className="!h-7 !w-7 !text-koru-outline hover:!bg-koru-error-container hover:!text-koru-error">
                {deleting ? <span className="text-[9px]">…</span> : <Trash2 size={12} />}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function detectSlotConflict(form, otherSlots, editingId) {
  if (!form.dayOfWeek || !form.startTime || !form.endTime) return null;
  const s = toMinutes(form.startTime);
  const e = toMinutes(form.endTime);
  if (s >= e) return "End time must be after start time.";
  for (const slot of otherSlots) {
    if (slot.id === editingId || slot.dayOfWeek !== form.dayOfWeek || !slot.startTime) continue;
    const os = toMinutes(slot.startTime.slice(0, 5));
    const oe = toMinutes((slot.endTime || slot.startTime).slice(0, 5));
    if (s < oe && os < e) {
      const conflictsWith = (form.teacherId && slot.teacherId === form.teacherId)
        ? "same lecturer"
        : (form.room && slot.room === form.room)
        ? "same room"
        : slot.classGroupId === form.classGroupId
        ? "same group"
        : null;
      if (conflictsWith) return `Conflicts with "${slot.name || "another class"}" (${conflictsWith}).`;
    }
  }
  return null;
}

// ── Slot form ──────────────────────────────────────────────────────────────────
function SlotForm({ form, setForm, teachers, onSave, onCancel, saving, otherSlots = [], editingId = null }) {
  const isScheduled = !!(form.startTime || form.endTime);
  const conflict = isScheduled ? detectSlotConflict(form, otherSlots, editingId) : null;

  return (
    <div className="space-y-2.5 rounded-koru-md bg-koru-surface-container-lowest p-3 shadow-koru-card ring-1 ring-inset ring-koru-primary/15">
      <NameField value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
      <div className="grid grid-cols-2 gap-2">
        {!isScheduled && (
          <div>
            <Input size="sm" label="Hours" type="number" min={0.5} max={8} step={0.5} value={form.durationHours}
              onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))}
             />
          </div>
        )}
        <div>
          <Input size="sm" label="Room" type="text" placeholder="e.g. Room 201" value={form.room}
            onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
           />
        </div>
        <div>
          <Select size="sm" label="Lecturer" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
            <option value="">No preference</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </Select>
        </div>
        <div className={isScheduled ? "col-span-2" : ""}>
          <Select size="sm" label="Day" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
            <option value="">Any day</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        {isScheduled && (
          <>
            <div>
              <Input size="sm" label="Start Time" type="time" value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
               />
            </div>
            <div>
              <Input size="sm" label="End Time" type="time" value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
               />
            </div>
          </>
        )}
      </div>
      {conflict && (
        <Alert variant="error">{conflict}</Alert>
      )}
      <div className="flex gap-2 pt-0.5">
        <Button size="sm" onClick={onSave} disabled={saving || !!conflict} startIcon={<Check size={12} />}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="text" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Classes section (right panel) ─────────────────────────────────────────────
function ClassesSection({ groupId, courseId, teachers, refreshKey, onChanged }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_SLOT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = groupId
        ? await classService.getByGroup(groupId)
        : await classService.getUnassignedByCourse(courseId);
      setSlots(data || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, courseId]);

  useEffect(() => { loadSlots(); }, [loadSlots, refreshKey]);

  const openAdd = () => { setEditingId(null); setForm(DEFAULT_SLOT_FORM); setAddOpen(true); };
  const openEdit = (slot) => {
    setAddOpen(false);
    setForm({
      name: slot.name || "",
      durationHours: slot.durationHours?.toString() || "2",
      teacherId: slot.teacherId || "",
      room: slot.room || "",
      dayOfWeek: slot.dayOfWeek || "",
      startTime: slot.startTime ? slot.startTime.slice(0, 5) : "",
      endTime: slot.endTime ? slot.endTime.slice(0, 5) : "",
    });
    setEditingId(slot.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name || null,
        durationHours: form.durationHours ? parseFloat(form.durationHours) : null,
        teacherId: form.teacherId || null,
        room: form.room || null,
        dayOfWeek: form.dayOfWeek || null,
        courseId,
        classGroupId: groupId || null,
        isGenerated: false,
      };
      if (editingId) {
        await classService.update(editingId, {
          ...payload, id: editingId,
          startTime: form.startTime ? form.startTime + ":00" : null,
          endTime: form.endTime ? form.endTime + ":00" : null,
        });
      } else {
        await classService.create(payload);
      }
      await loadSlots();
      onChanged?.();
      setAddOpen(false);
      setEditingId(null);
      setForm(DEFAULT_SLOT_FORM);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await classService.delete(id);
      setSlots(prev => prev.filter(s => s.id !== id));
      onChanged?.();
      if (editingId === id) setEditingId(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-koru-caption font-medium text-koru-on-surface-variant">
          Classes · {slots.length} per week
        </span>
        {!addOpen && !editingId && (
          <Button variant="tonal" size="sm" onClick={openAdd} startIcon={<Plus size={12} />}>
            Add slot
          </Button>
        )}
      </div>

      {addOpen && (
        <SlotForm form={form} setForm={setForm} teachers={teachers}
          onSave={handleSave}
          onCancel={() => { setAddOpen(false); setForm(DEFAULT_SLOT_FORM); }}
          saving={saving}
        />
      )}

      {loading ? (
        <SkeletonText lines={2} />
      ) : slots.length === 0 && !addOpen ? (
        <div className="flex items-center gap-2 rounded-koru-md border border-dashed border-koru-outline-variant bg-koru-surface-container-low px-3 py-2.5">
          <BookOpen size={13} className="shrink-0 text-koru-outline" />
          <span className="text-xs text-koru-on-surface-variant">No class slots yet.</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {slots.map(slot => (
            editingId === slot.id ? (
              <SlotForm key={slot.id} form={form} setForm={setForm} teachers={teachers}
                onSave={handleSave}
                onCancel={() => { setEditingId(null); setForm(DEFAULT_SLOT_FORM); }}
                saving={saving}
                otherSlots={slots}
                editingId={editingId}
              />
            ) : (
              <ClassSlotCard key={slot.id} slot={slot}
                onEdit={() => openEdit(slot)}
                onDelete={() => handleDelete(slot.id)}
                deleting={deletingId === slot.id}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Class Manually ─────────────────────────────────────────────────────────
function AddClassManuallySection({ groupId, courseId, teachers, onAdded }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_MANUAL_FORM);
  const [saving, setSaving] = useState(false);

  const canSave = form.dayOfWeek && form.startTime && form.endTime;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await classService.create({
        name: form.name || null,
        teacherId: form.teacherId || null,
        room: form.room || null,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime + ":00",
        endTime: form.endTime + ":00",
        courseId,
        classGroupId: groupId || null,
        isGenerated: false,
      });
      onAdded();
      setOpen(false);
      setForm(DEFAULT_MANUAL_FORM);
    } catch (err) {
      alert("Failed to add class: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-koru-outline-faint">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-koru-surface-container-low/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-koru-focus"
      >
        <Plus size={13} className="text-koru-on-surface-variant shrink-0" />
        <span className="text-xs font-medium text-koru-on-surface-variant">Add Class Manually</span>
        <span className="ml-auto">
          {open
            ? <ChevronDown size={13} className="text-koru-on-surface-variant" />
            : <ChevronRight size={13} className="text-koru-on-surface-variant" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {/* Conflict warning */}
              <Alert variant="warning">
                Manually scheduled classes may cause teacher conflicts.{" "}
                <button
                  type="button"
                  onClick={() => navigate("/calendar")}
                  className="inline-flex items-center gap-0.5 font-medium underline"
                >
                  Review on the calendar page <ExternalLink size={10} />
                </button>
              </Alert>

              <NameField value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Select size="sm" label="Lecturer" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                    <option value="">Select lecturer</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                  </Select>
                </div>
                <div>
                  <Input size="sm" label="Room" type="text" placeholder="e.g. Room 201" value={form.room}
                    onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                   />
                </div>
                <div>
                  <Select size="sm" label="Day" required value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                    <option value="">Select day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div>
                  <Input size="sm" label="Start" required type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                   />
                </div>
                <div>
                  <Input size="sm" label="End" required type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                   />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving || !canSave} startIcon={<Check size={12} />}>
                  {saving ? "Adding…" : "Add Class"}
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => { setOpen(false); setForm(DEFAULT_MANUAL_FORM); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AdminCohortsView ───────────────────────────────────────────────────────────
export function AdminCohortsView({ courseId, course }) {
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
  const [teachers, setTeachers] = useState([]);
  const [classRefreshKeys, setClassRefreshKeys] = useState({});
  const [unassignedClasses, setUnassignedClasses] = useState([]);
  const [unassignedEvents, setUnassignedEvents] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [unassignedExpanded, setUnassignedExpanded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [courseLecturers, setCourseLecturers] = useState([]);

  // All lecturers associated with this course; fall back to all teachers if not loaded yet
  const courseTeachers = useMemo(() => {
    if (courseLecturers.length > 0) return courseLecturers;
    if (!course?.teacherId || teachers.length === 0) return teachers;
    const filtered = teachers.filter(t => t.id === course.teacherId);
    return filtered.length > 0 ? filtered : teachers;
  }, [courseLecturers, course, teachers]);

  const bumpRefresh = (groupId) =>
    setClassRefreshKeys(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [cohortsData, allEnrollments, teacherList, courseStudentsData, unassignedClassesData, courseEventsData, lecturersData] = await Promise.all([
        getCourseCohorts(courseId).catch(() => []),
        enrollmentService.getAllEnrollments().catch(() => []),
        userService.getTeachers().catch(() => []),
        getCourseStudents(courseId).catch(() => []),
        classService.getUnassignedByCourse(courseId).catch(() => []),
        getCourseEvents(courseId).catch(() => []),
        getCourseLecturers(courseId).catch(() => []),
      ]);
      setCohorts(cohortsData || []);
      setTeachers(teacherList || []);
      setCourseLecturers(lecturersData || []);
      setUnassignedClasses(unassignedClassesData || []);
      const seen = new Set();
      setUnassignedEvents((courseEventsData || []).filter(e => {
        const t = e.eventType?.toLowerCase();
        if (t !== "class" && t !== "lecture" && t !== "workshop" && t !== "practical") return false;
        const start = e.startTime ? new Date(e.startTime) : null;
        const key = `${(e.title || "").toLowerCase()}|${start ? start.getDay() : "?"}|${start ? `${start.getHours()}:${start.getMinutes()}` : "?"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
      setUnassignedStudents((courseStudentsData || []).filter(s => !s.classGroupId));
      const ids = (allEnrollments || [])
        .filter(e => e.courseId === courseId || e.course?.id === courseId)
        .map(e => e.studentId || e.student?.id)
        .filter(Boolean);
      setEnrolledCount(ids.length);
      setEnrolledStudentIds(ids);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const groupCount = maxPerGroup > 0 ? Math.ceil(enrolledCount / maxPerGroup) : 0;

  const handleAutoAssign = async () => {
    if (enrolledCount === 0 || groupCount === 0) return;
    if (cohorts.length > 0 && !window.confirm(
      `This will delete ${cohorts.length} existing group${cohorts.length !== 1 ? "s" : ""} and reassign all ${enrolledCount} students into ${groupCount} new group${groupCount !== 1 ? "s" : ""}. Continue?`
    )) return;
    setAssigning(true);
    setAssignStep("Clearing existing groups…");
    try {
      for (const cohort of cohorts) await deleteClassGroup(cohort.id).catch(() => {});
      const shuffled = shuffle(enrolledStudentIds);
      for (let i = 0; i < groupCount; i++) {
        setAssignStep(`Creating Group ${i + 1} of ${groupCount}…`);
        const group = await createClassGroup({ name: `Group ${i + 1}`, courseId });
        const slice = shuffled.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
        if (slice.length > 0) await assignStudents(group.id, slice);
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

  const handleImportFromEvents = async () => {
    setImporting(true);
    try {
      const result = await classService.importFromEvents(courseId);
      await load();
      bumpRefresh("unassigned");
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.header variants={slideUp} className="mb-6">
        <h1 className="font-display text-koru-title text-koru-on-surface">Groups & Classes</h1>
        <p className="mt-1 text-koru-body text-koru-on-surface-variant">
          {cohorts.length} {cohorts.length === 1 ? "group" : "groups"} · {enrolledCount} enrolled students
        </p>
      </motion.header>

      {/* Auto-assign config */}
      <Card as={motion.div} variants={slideUp} variant="outlined" tone="low" padding="lg" className="mb-6">
        <h3 className="mb-4 font-display text-koru-heading text-koru-on-surface">Auto-Assign Configuration</h3>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <Input
              label="Max students per group"
              type="number" min={1} max={200} value={maxPerGroup}
              onChange={e => setMaxPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {enrolledCount > 0 && groupCount > 0 ? (
              <p className="text-sm font-semibold text-koru-on-surface-variant">
                <span className="text-koru-primary font-semibold">{enrolledCount}</span> →{" "}
                <span className="text-koru-primary font-semibold">{groupCount}</span> group{groupCount !== 1 ? "s" : ""} of ~<span className="text-koru-primary font-semibold">{maxPerGroup}</span>
              </p>
            ) : enrolledCount === 0 ? (
              <p className="text-sm text-koru-on-surface-variant">No enrolled students yet</p>
            ) : null}
            <Button
              size="lg"
              onClick={handleAutoAssign} disabled={assigning || enrolledCount === 0}
              startIcon={<Shuffle size={15} />}
            >
              {assigning ? assignStep || "Working…" : cohorts.length > 0 ? "Reassign Groups" : "Auto-Assign Groups"}
            </Button>
          </div>
        </div>
        {cohorts.length > 0 && !assigning && (
          <Alert variant="warning" className="mt-4">
            Reassigning will delete all current groups and redistribute students from scratch.
          </Alert>
        )}
      </Card>

      {/* Convert calendar events → class slots banner */}
      {unassignedEvents.length > 0 && (
        <motion.div variants={slideUp} className="mb-6 flex items-center justify-between gap-4 rounded-koru-md bg-koru-info-soft px-5 py-4">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="text-koru-info shrink-0 mt-0.5" />
            <div>
              <p className="mb-0.5 text-koru-label text-koru-info">
                {unassignedEvents.length} Calendar Event{unassignedEvents.length !== 1 ? "s" : ""} Found
              </p>
              <p className="text-xs text-koru-on-surface-variant">
                These class-type events can be converted to editable class slots. The calendar events will be removed.
              </p>
            </div>
          </div>
          <Button
            onClick={handleImportFromEvents}
            disabled={importing}
            className="shrink-0"
          >
            {importing ? "Converting…" : "Convert to Slots"}
          </Button>
        </motion.div>
      )}

      {/* Groups list */}
      <motion.div variants={slideUp} className="space-y-3">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-koru-lg" />)}
          </div>
        ) : cohorts.length === 0 && unassignedClasses.length === 0 && unassignedEvents.length === 0 && unassignedStudents.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No groups yet"
            description="Set a max per group above and click Auto-Assign to get started."
          />
        ) : (
          <>
          {/* ── Unassigned pseudo-group ── */}
          {(unassignedClasses.length > 0 || unassignedEvents.length > 0 || unassignedStudents.length > 0) && (
            <div className="overflow-hidden rounded-koru-lg border border-dashed border-koru-outline-variant bg-koru-surface-container-lowest/70">
              <div className="flex items-center px-6 py-4 gap-4">
                <Button
                  variant="text"
                  size="icon"
                  onClick={() => setUnassignedExpanded(v => !v)}
                  aria-expanded={unassignedExpanded}
                  aria-label={unassignedExpanded ? "Collapse unassigned" : "Expand unassigned"}
                  className="shrink-0 !text-koru-on-surface-variant"
                >
                  {unassignedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </Button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-koru-md bg-koru-surface-container-high">
                  <Users size={18} className="text-koru-on-surface-variant" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-koru-label text-koru-on-surface-variant">Unassigned</p>
                    <Badge>Pre-cohort</Badge>
                  </div>
                  <p className="text-xs text-koru-on-surface-variant mt-0.5">
                    {unassignedClasses.length + unassignedEvents.length} schedule slot{(unassignedClasses.length + unassignedEvents.length) !== 1 ? "s" : ""} · {unassignedStudents.length} student{unassignedStudents.length !== 1 ? "s" : ""} not in a group
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {unassignedExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-koru-outline-faint"
                  >
                    <div className="flex min-h-0 divide-x divide-koru-outline-faint">
                      {/* Left: unassigned students */}
                      <div className="flex-1 min-w-0 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-koru-outline-variant shrink-0" />
                          <span className="text-koru-caption font-medium text-koru-on-surface-variant">
                            Students · {unassignedStudents.length}
                          </span>
                        </div>
                        {unassignedStudents.length === 0 ? (
                          <p className="text-xs text-koru-on-surface-variant italic">All students are in groups.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                            {unassignedStudents.map(s => (
                              <div key={s.studentId} className="flex items-center gap-2 p-2 rounded-koru-md bg-koru-surface-container-low/80">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-koru-surface-container-high text-[10px] font-semibold text-koru-on-surface-variant">
                                  {s.studentName?.split(" ")[0]?.[0]}{s.studentName?.split(" ")[1]?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-koru-on-surface-variant truncate">{s.studentName}</p>
                                  <p className="text-[10px] text-koru-on-surface-variant truncate">{s.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Classes section + Add Manually (interactive, same as cohort groups) */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="px-5 py-4">
                          <ClassesSection
                            groupId={null}
                            courseId={courseId}
                            teachers={courseTeachers}
                            refreshKey={classRefreshKeys["unassigned"] || 0}
                            onChanged={load}
                          />
                        </div>
                        {unassignedEvents.length > 0 && (
                          <div className="px-5 pb-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-koru-info shrink-0" />
                              <span className="text-koru-caption font-medium text-koru-on-surface-variant">
                                Calendar Events · {unassignedEvents.length}
                              </span>
                            </div>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                              {unassignedEvents.map(evt => {
                                const start = evt.startTime ? new Date(evt.startTime) : null;
                                const end = evt.endTime ? new Date(evt.endTime) : null;
                                const dayName = start ? start.toLocaleDateString("en-US", { weekday: "long" }) : null;
                                const fmt = (d) => d ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` : null;
                                return (
                                  <div key={evt.id} className="flex items-start gap-2 rounded-koru-md bg-koru-info-soft/60 px-3 py-2">
                                    <Calendar size={12} className="text-koru-info shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-koru-caption font-medium text-koru-info truncate">{evt.title}</span>
                                        <Badge variant="info" className="shrink-0">Calendar Event</Badge>
                                      </div>
                                      {(dayName || fmt(start)) && (
                                        <p className="text-[10px] text-koru-info mt-0.5">
                                          {dayName}{fmt(start) ? ` · ${fmt(start)}${fmt(end) ? `–${fmt(end)}` : ""}` : ""}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <AddClassManuallySection
                          groupId={null}
                          courseId={courseId}
                          teachers={courseTeachers}
                          onAdded={() => { bumpRefresh("unassigned"); load(); }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Real cohort groups ── */}
          {cohorts.map(cohort => {
            const isExpanded = expandedId === cohort.id;
            const details = cohortDetails[cohort.id];
            const isLoadingDetails = loadingDetails[cohort.id];
            const studentCount = details?.students?.length ?? cohort.studentCount ?? "—";

            return (
              <Card key={cohort.id} variant="outlined" tone="low" padding="none" radius="lg" className="overflow-hidden">
                {/* Group header */}
                <div className="flex items-center px-6 py-4 gap-4 group">
                  <Button
                    variant="text"
                    size="icon"
                    onClick={() => handleExpand(cohort.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Collapse ${cohort.name}` : `Expand ${cohort.name}`}
                    className="shrink-0 !text-koru-on-surface-variant hover:!text-koru-primary"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </Button>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-koru-md bg-koru-primary-container/60">
                    <Users size={18} className="text-koru-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-koru-label text-koru-on-surface">{cohort.name}</p>
                    <p className="text-xs text-koru-on-surface-variant mt-0.5">
                      {typeof studentCount === "number" ? `${studentCount} student${studentCount !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="text"
                    size="icon"
                    onClick={() => handleDelete(cohort.id, cohort.name)}
                    disabled={deletingId === cohort.id}
                    aria-label={`Delete ${cohort.name}`}
                    className="!text-koru-outline opacity-0 hover:!bg-koru-error-container hover:!text-koru-error focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    {deletingId === cohort.id ? <span className="text-xs">…</span> : <Trash2 size={15} />}
                  </Button>
                </div>

                {/* Expanded panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-koru-outline-faint"
                    >
                      {isLoadingDetails ? (
                        <div className="px-8 py-6"><SkeletonText lines={3} /></div>
                      ) : (
                        <>
                          {/* ── Students LEFT · Classes + Add Manually RIGHT ── */}
                          <div className="flex min-h-0 divide-x divide-koru-outline-faint">
                            {/* Left: Students */}
                            <div className="flex-1 min-w-0 px-5 py-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-koru-outline-variant shrink-0" />
                                <span className="text-koru-caption font-medium text-koru-on-surface-variant">
                                  Students · {details?.students?.length ?? 0}
                                </span>
                              </div>
                              {!details?.students?.length ? (
                                <p className="text-xs text-koru-on-surface-variant italic">No students in this group.</p>
                              ) : (
                                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                  {details.students.map(s => (
                                    <div key={s.id || s.studentId} className="flex items-center gap-2 p-2 rounded-koru-md bg-koru-surface-container-low/80">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-koru-primary-container/60 text-[10px] font-semibold text-koru-on-primary-container">
                                        {(s.firstName || s.student?.firstName)?.[0]}
                                        {(s.lastName || s.student?.lastName)?.[0]}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-koru-on-surface truncate">
                                          {s.firstName || s.student?.firstName} {s.lastName || s.student?.lastName}
                                        </p>
                                        <p className="text-[10px] text-koru-on-surface-variant truncate">{s.email || s.student?.email}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Right: Classes section + Add Manually */}
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="px-5 py-4">
                                <ClassesSection
                                  groupId={cohort.id}
                                  courseId={courseId}
                                  teachers={courseTeachers}
                                  refreshKey={classRefreshKeys[cohort.id] || 0}
                                />
                              </div>
                              <AddClassManuallySection
                                groupId={cohort.id}
                                courseId={courseId}
                                teachers={courseTeachers}
                                onAdded={() => bumpRefresh(cohort.id)}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
