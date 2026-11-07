import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Modal, Button, Badge, Card, Input, Select, Avatar } from "../../../components/UI";
import TeacherPerspectiveModal from "./TeacherPerspectiveModal";
import StudentPerspectiveModal from "./StudentPerspectiveModal";
import CohortManagerModal from "./CohortManagerModal";

const DEGREES = [
  "UX Design Degree",
  "Software Engineering Degree",
  "Visual Arts Degree",
  "Interaction Design Degree",
  "Design Leadership Degree"
];

const ordinal = (n) => (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th");

const LABEL = "text-koru-caption font-medium text-koru-on-surface-variant uppercase tracking-wider block";

export default function CourseDetailModal({ 
  course, 
  onClose, 
  isEditing, 
  setIsEditing, 
  editForm, 
  setEditForm, 
  teachers, 
  onSave, 
  onDelete 
}) {
  const [showTeacherPreview, setShowTeacherPreview] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const [showCohortManager, setShowCohortManager] = useState(false);

  if (!course) return null;

  const nested = showTeacherPreview || showStudentPreview || showCohortManager;
  const statusValue = isEditing ? editForm.status : course.status;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        ariaLabel={`Course details: ${course.subject?.name ?? "course"}`}
        size="xl"
        closeOnEscape={!nested}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Core Info & Main Meta */}
          <div className="md:w-2/5 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {isEditing ? (
                  <Input
                    aria-label="Course code"
                    size="sm"
                    value={editForm.subject.code}
                    onChange={(e) => setEditForm({...editForm, subject: {...editForm.subject, code: e.target.value}})}
                    className="uppercase tracking-wider"
                    containerClassName="max-w-[8rem]"
                  />
                ) : (
                  <Badge variant="primary">{course.subject.code}</Badge>
                )}
                <Badge variant={statusValue === "Active" ? "success" : "error"}>
                  {statusValue}
                </Badge>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    aria-label="Course name"
                    value={editForm.subject.name}
                    onChange={(e) => setEditForm({...editForm, subject: {...editForm.subject, name: e.target.value}})}
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="neutral">{editForm.year}{ordinal(editForm.year)} Year Registry</Badge>
                    <Badge variant="neutral">{editForm.term}</Badge>
                  </div>
                </div>
              ) : (
                <h2 className="font-display text-koru-title text-koru-on-surface">{course.subject.name}</h2>
              )}

              <Card tone="brand" padding="md" radius="xl" className="mt-8">
                {isEditing ? (
                  <Select
                    label="Degree Assignment"
                    value={editForm.degree}
                    onChange={(e) => setEditForm({...editForm, degree: e.target.value})}
                  >
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                ) : (
                  <>
                    <span className="text-koru-caption font-medium text-koru-on-primary-container uppercase tracking-wider block mb-2">Degree Assignment</span>
                    <p className="text-koru-label font-medium text-koru-on-surface uppercase tracking-wider">{course.degree}</p>
                  </>
                )}
                <p className="mt-3 text-koru-caption text-koru-on-primary-container/80 leading-relaxed italic">
                  * All students enrolled in this degree program will be automatically assigned to this module.
                </p>
              </Card>
            </div>

            <div className="space-y-4">
              <Card variant="outlined" tone="surface" padding="md" radius="xl">
                {isEditing ? (
                  <Select
                    label="Assigned Faculty"
                    value={editForm.teacherId}
                    onChange={(e) => {
                      setEditForm({...editForm, teacherId: e.target.value});
                    }}
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                  </Select>
                ) : (
                  <>
                    <span className={`${LABEL} mb-4`}>Assigned Faculty</span>
                    <div className="flex items-center gap-4 w-full">
                      {course?.teacher ? (
                        <Avatar user={course.teacher} size="md" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-koru-surface-container-high text-koru-on-surface-variant flex items-center justify-center font-display">?</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-koru-label font-medium text-koru-on-surface">
                          {course?.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : "No Teacher Assigned"}
                        </h4>
                        <p className="text-koru-caption text-koru-on-surface-variant truncate">{course?.teacher?.email || "N/A"}</p>
                      </div>
                    </div>
                  </>
                )}
              </Card>

              <Card variant="outlined" tone="surface" padding="md" radius="xl">
                <span className={`${LABEL} mb-1`}>Registry Status</span>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-koru-caption font-medium uppercase tracking-wider ${
                    (isEditing ? editForm?.status : course?.status) === "Active" ? "text-koru-success" : "text-koru-error"
                  }`}>
                    {isEditing ? editForm?.status : (course?.status || "Active")}
                  </span>
                  {isEditing && (
                    <button 
                      type="button"
                      role="switch"
                      aria-checked={editForm.status === "Active"}
                      aria-label="Toggle registry status"
                      onClick={() => setEditForm({...editForm, status: editForm.status === "Active" ? "Inactive" : "Active"})}
                      className={`w-12 h-6 rounded-koru-pill transition-colors motion-reduce:transition-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 ${editForm.status === "Active" ? "bg-koru-success" : "bg-koru-outline-variant"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-koru-surface-container-lowest rounded-full transition-all motion-reduce:transition-none ${editForm.status === "Active" ? "right-1" : "left-1"}`}></div>
                    </button>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column: Narrative & Actions */}
          <div className="md:w-3/5 flex flex-col justify-between gap-8">
            <div className="space-y-8">
              <div>
                {isEditing ? (
                  <>
                    <label htmlFor="course-description" className={`${LABEL} mb-4`}>Course Specification</label>
                    <textarea 
                      id="course-description"
                      value={editForm?.description || ""}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-6 py-6 rounded-koru-xs bg-koru-surface-container-lowest text-koru-body text-koru-on-surface leading-relaxed min-h-[250px] outline-none shadow-koru-xs focus:ring-1 focus:ring-inset focus:ring-koru-primary transition motion-reduce:transition-none placeholder:text-koru-on-surface-variant/70"
                      placeholder="Describe the course learning outcomes..."
                    />
                  </>
                ) : (
                  <>
                    <span className={`${LABEL} mb-4`}>Course Specification</span>
                    <p className="text-koru-body text-koru-on-surface-variant leading-relaxed max-w-prose">
                      {course?.description || course?.subject?.description || "No description available."}
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <Select
                      label="Academic Year"
                      value={editForm?.year || 1}
                      onChange={(e) => setEditForm({...editForm, year: parseInt(e.target.value)})}
                    >
                      {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}{ordinal(y)} Year</option>)}
                    </Select>
                    <Select
                      label="Active Semester"
                      value={editForm?.term || "Semester 1"}
                      onChange={(e) => setEditForm({...editForm, term: e.target.value})}
                    >
                      {["Semester 1", "Semester 2"].map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-koru-on-surface-variant bg-koru-surface-container px-5 py-4 rounded-koru-md">
                      <div className="w-2 h-2 rounded-full bg-koru-primary"></div>
                      <span className="text-koru-caption font-medium uppercase tracking-wider">{course?.year}{ordinal(course?.year)} Year Registry</span>
                    </div>
                    <div className="flex items-center gap-3 text-koru-on-surface-variant bg-koru-surface-container px-5 py-4 rounded-koru-md">
                      <div className="w-2 h-2 rounded-full bg-koru-primary"></div>
                      <span className="text-koru-caption font-medium uppercase tracking-wider">{course?.term}</span>
                    </div>
                  </>
                )}
              </div>

              {!isEditing && (
                <Card tone="brand" padding="md" radius="xl">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[12rem]">
                      <h4 className="font-display text-koru-label text-koru-on-primary-container uppercase tracking-wider mb-1">Perspective View</h4>
                      <p className="text-koru-caption text-koru-on-primary-container/80 leading-tight">Preview this course as it appears to different platform roles.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outlined" size="sm" onClick={() => setShowTeacherPreview(true)}>
                        Teacher View
                      </Button>
                      <Button variant="outlined" size="sm" onClick={() => setShowStudentPreview(true)}>
                        Student View
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {!isEditing && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-koru-xl bg-koru-primary text-koru-on-primary shadow-koru-md">
                  <div className="flex-1 min-w-[12rem]">
                    <h4 className="font-display text-koru-label uppercase tracking-wider mb-1">Cohorts & Schedules</h4>
                    <p className="text-koru-caption text-koru-on-primary/70 leading-tight">Manage student cohorts (Groups A/B) and weekly timetabled sessions.</p>
                  </div>
                  <Button variant="tonal" size="md" onClick={() => setShowCohortManager(true)}>
                    Manage Cohorts
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <Button variant="filled" size="lg" className="flex-[2]" onClick={onSave}>
                    Confirm Registry Update
                  </Button>
                  <Button variant="error" size="lg" className="flex-1" onClick={() => onDelete(editForm.id)}>
                    Delete Registry
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="filled" size="lg" className="flex-[2]" onClick={() => setIsEditing(true)}>
                    Modify system data
                  </Button>
                  <Button variant="outlined" size="lg" className="flex-1">
                    Archive
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {showTeacherPreview && (
          <TeacherPerspectiveModal 
            course={course} 
            onClose={() => setShowTeacherPreview(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStudentPreview && (
          <StudentPerspectiveModal 
            course={course} 
            onClose={() => setShowStudentPreview(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCohortManager && (
          <CohortManagerModal 
            course={course}
            onClose={() => setShowCohortManager(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
