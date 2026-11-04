import React, { useState, useEffect } from "react";
import { Modal, Button, Card, Input, Select, Avatar, Skeleton, EmptyState } from "../../../components/UI";
import { 
  Plus, Users, Clock, Trash2, Calendar, 
  MapPin, Check, ChevronRight, UserPlus, Info
} from "lucide-react";
import { 
  getCourseCohorts, 
  getCourseStudents, 
  createClassGroup, 
  deleteClassGroup, 
  assignStudents, 
  getCohortDetails 
} from "../../../services/classGroupService";

export default function CohortManagerModal({ course, onClose }) {
  const [cohorts, setCohorts] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortSchedules, setCohortSchedules] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [newCohortName, setNewCohortName] = useState("");
  
  // Schedule Form State
  const [schedDay, setSchedDay] = useState("Monday");
  const [schedStart, setSchedStart] = useState("09:00");
  const [schedEnd, setSchedEnd] = useState("11:00");
  const [schedRoom, setSchedRoom] = useState("");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  useEffect(() => {
    if (course?.id) {
      loadData();
    }
  }, [course]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedCohorts = await getCourseCohorts(course.id);
      const fetchedStudents = await getCourseStudents(course.id);
      setCohorts(fetchedCohorts);
      setStudents(fetchedStudents);
      
      // Select first cohort if available
      if (fetchedCohorts.length > 0) {
        handleSelectCohort(fetchedCohorts[0].id);
      } else {
        setSelectedCohort(null);
        setCohortSchedules([]);
      }
    } catch (err) {
      console.error("Failed to load cohort data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCohort = async (cohortId) => {
    try {
      const details = await getCohortDetails(cohortId);
      setSelectedCohort(details);
      setCohortSchedules(details.schedules || []);
    } catch (err) {
      console.error("Failed to get cohort details:", err);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;
    try {
      await createClassGroup({
        name: newCohortName.trim(),
        courseId: course.id
      });
      setNewCohortName("");
      await loadData();
    } catch (err) {
      alert("Failed to create cohort: " + err.message);
    }
  };

  const handleDeleteCohort = async (cohortId) => {
    if (!window.confirm("Are you sure you want to delete this cohort? All timetabled slots associated with it will be removed.")) return;
    try {
      await deleteClassGroup(cohortId);
      await loadData();
    } catch (err) {
      alert("Failed to delete cohort: " + err.message);
    }
  };

  const handleAssignStudentCohort = async (studentId, targetCohortId) => {
    try {
      // Find all students currently in target cohort
      const currentTargetCohortStudents = students
        .filter(s => s.classGroupId === targetCohortId)
        .map(s => s.studentId);
      
      // If student is moving into target cohort, add them
      let newTargetList = [...currentTargetCohortStudents];
      if (targetCohortId && !newTargetList.includes(studentId)) {
        newTargetList.push(studentId);
      }

      // If student was in another cohort previously, we must also remove them from that cohort's backend list
      const previousCohortId = students.find(s => s.studentId === studentId)?.classGroupId;
      
      // Call update for previous cohort if any
      if (previousCohortId && previousCohortId !== targetCohortId) {
        const prevCohortStudents = students
          .filter(s => s.classGroupId === previousCohortId && s.studentId !== studentId)
          .map(s => s.studentId);
        await assignStudents(previousCohortId, prevCohortStudents);
      }

      // Call update for target cohort if target is a real cohort (not "Unassigned")
      if (targetCohortId) {
        await assignStudents(targetCohortId, newTargetList);
      }

      // Reload
      await loadData();
      if (selectedCohort && (selectedCohort.id === targetCohortId || selectedCohort.id === previousCohortId)) {
        await handleSelectCohort(selectedCohort.id);
      }
    } catch (err) {
      alert("Failed to assign student: " + err.message);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!selectedCohort) return;
    setIsAddingSchedule(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";
      
      const payload = {
        classGroupId: selectedCohort.id,
        courseId: course.id,
        room: schedRoom.trim() || "Virtual / Main Hall",
        dayOfWeek: schedDay,
        startTime: `${schedStart}:00`,
        endTime: `${schedEnd}:00`,
        isGenerated: false
      };

      const res = await fetch(`${API_BASE}/Class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to schedule slot");
      }

      setSchedRoom("");
      await handleSelectCohort(selectedCohort.id);
    } catch (err) {
      alert("Failed to add schedule: " + err.message);
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (classId) => {
    if (!window.confirm("Are you sure you want to remove this timetabled session?")) return;
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";
      const res = await fetch(`${API_BASE}/Class/${classId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete slot");
      await handleSelectCohort(selectedCohort.id);
    } catch (err) {
      alert("Failed to delete scheduled session: " + err.message);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={<>Class Cohorts & <span className="text-koru-primary">Schedules</span></>}
      description={`${course?.subject?.code ?? ""} Cohorts & Timetable`}
    >
      {isLoading ? (
        <div className="space-y-6" role="status" aria-label="Loading cohorts">
          <Card variant="outlined" tone="surface" padding="md" radius="xl" className="space-y-4">
            <Skeleton variant="text" className="w-32" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
          </Card>
          <Card variant="outlined" tone="surface" padding="md" radius="xl" className="space-y-4">
            <Skeleton variant="text" className="w-40" />
            {[1, 2].map(i => <Skeleton key={i} className="h-20" />)}
          </Card>
          <div className="space-y-3">
            <Skeleton variant="text" className="w-28" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton variant="text" style={{ width: `${50 + i * 8}%` }} />
                  <Skeleton variant="text" className="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Cohorts Picker */}
          <Card variant="outlined" tone="surface" padding="md" radius="xl" className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant flex items-center gap-2">
                <Users size={14} /> Active Cohorts ({cohorts.length})
              </h3>
              <form onSubmit={handleCreateCohort} className="flex gap-2 items-center">
                <Input
                  aria-label="New cohort name"
                  size="sm"
                  type="text"
                  placeholder="e.g. Group C"
                  value={newCohortName}
                  onChange={e => setNewCohortName(e.target.value)}
                />
                <Button type="submit" size="sm" variant="filled" startIcon={<Plus size={14} aria-hidden="true" />}>
                  Add
                </Button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cohorts.map((cohort) => {
                const isSelected = selectedCohort?.id === cohort.id;
                return (
                  <div 
                    key={cohort.id}
                    onClick={() => handleSelectCohort(cohort.id)}
                    className={`p-4 rounded-koru-lg cursor-pointer transition-colors motion-reduce:transition-none flex items-center justify-between group ${
                      isSelected 
                        ? "bg-koru-primary-container text-koru-on-primary-container ring-1 ring-inset ring-koru-primary" 
                        : "bg-koru-surface-container text-koru-on-surface hover:bg-koru-surface-container-high"
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="text-koru-label font-medium">{cohort.name}</h4>
                      <p className="text-koru-caption opacity-70 uppercase mt-0.5">
                        {cohort.studentCount || 0} Students
                      </p>
                    </div>
                    <Button
                      variant="text"
                      size="icon"
                      aria-label={`Delete cohort ${cohort.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCohort(cohort.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
              {cohorts.length === 0 && (
                <div className="col-span-full py-8 text-center text-koru-on-surface-variant text-koru-label italic">
                  No cohorts defined. Create one above to get started.
                </div>
              )}
            </div>
          </Card>

          {/* Schedules Editor */}
          {selectedCohort ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Scheduled Slots */}
              <Card variant="outlined" tone="surface" padding="md" radius="xl" className="md:col-span-7 flex flex-col">
                <h3 className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant flex items-center gap-2 mb-4">
                  <Calendar size={14} /> Timetable for {selectedCohort.name}
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                  {cohortSchedules.map((slot) => (
                    <div 
                      key={slot.id} 
                      className="p-3.5 bg-koru-surface-container rounded-koru-lg flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-koru-md bg-koru-surface-container-lowest flex flex-col items-center justify-center font-medium text-koru-caption text-koru-primary shadow-koru-xs">
                          {slot.dayOfWeek?.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-koru-label font-medium text-koru-on-surface flex items-center gap-1.5">
                            <Clock size={12} className="text-koru-on-surface-variant" />
                            {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                          </div>
                          <div className="text-koru-caption text-koru-on-surface-variant uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />
                            {slot.room || "Unassigned Room"}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="text"
                        size="icon"
                        aria-label="Remove session"
                        onClick={() => handleDeleteSchedule(slot.id)}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  ))}

                  {cohortSchedules.length === 0 && (
                    <EmptyState
                      size="sm"
                      icon={<Clock size={24} aria-hidden="true" />}
                      title="No sessions scheduled for this cohort"
                      description="Students in this group will not see any live class schedules until you add one."
                    />
                  )}
                </div>
              </Card>

              {/* Add Class Form */}
              <Card variant="outlined" tone="surface" padding="md" radius="xl" className="md:col-span-5 flex flex-col">
                <h3 className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant flex items-center gap-2 mb-4">
                  <Plus size={14} /> Schedule Session
                </h3>
                <form onSubmit={handleAddSchedule} className="space-y-4">
                  <Select
                    label="Day of Week"
                    size="sm"
                    value={schedDay}
                    onChange={e => setSchedDay(e.target.value)}
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Time"
                      size="sm"
                      type="time"
                      value={schedStart}
                      onChange={e => setSchedStart(e.target.value)}
                    />
                    <Input
                      label="End Time"
                      size="sm"
                      type="time"
                      value={schedEnd}
                      onChange={e => setSchedEnd(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Room Assignment"
                    size="sm"
                    type="text"
                    placeholder="e.g. Lab 208, Main Aud"
                    value={schedRoom}
                    onChange={e => setSchedRoom(e.target.value)}
                  />

                  <Button type="submit" variant="filled" fullWidth disabled={isAddingSchedule}>
                    {isAddingSchedule ? "Saving Slot..." : "Add to Timetable"}
                  </Button>
                </form>
              </Card>
            </div>
          ) : (
            <EmptyState
              icon={<Users size={24} aria-hidden="true" />}
              title="No Cohort Selected"
              description="Select a cohort from the list above to schedule slots and manage its timetable."
            />
          )}

          {/* Cohort Roster & Routing */}
          <div>
            <div className="pb-4 space-y-2">
              <h3 className="text-koru-caption font-medium uppercase tracking-wider text-koru-primary flex items-center gap-2">
                <UserPlus size={14} /> Course Enrollment Roster ({students.length})
              </h3>
              <p className="text-koru-caption text-koru-on-surface-variant leading-normal">
                All students actively registered in this course are listed below. Map them to a cohort group to route their schedules and assignment deadlines.
              </p>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <div 
                  key={student.studentId}
                  className="p-4 rounded-koru-lg bg-koru-surface-container flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar seed={student.studentId} name={student.studentName} size="sm" />
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-koru-label font-medium text-koru-on-surface">{student.studentName}</h4>
                      <p className="text-koru-caption text-koru-on-surface-variant truncate">{student.email}</p>
                    </div>
                  </div>

                  <div className="w-40 shrink-0">
                    <Select
                      aria-label={`Cohort for ${student.studentName}`}
                      size="sm"
                      value={student.classGroupId || ""}
                      onChange={(e) => handleAssignStudentCohort(student.studentId, e.target.value || null)}
                    >
                      <option value="">Unassigned</option>
                      {cohorts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              ))}

              {students.length === 0 && (
                <EmptyState
                  size="sm"
                  icon={<Info size={24} aria-hidden="true" />}
                  title="No students registered in this course"
                  description="Before mapping cohorts, make sure students are enrolled in this Course under Registry."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
