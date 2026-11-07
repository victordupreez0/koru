import React from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { SearchInput } from "./SearchInput";
import { Avatar, Button, Card } from "../../../components/UI";

function StudentCard({ student, onEdit, onDelete }) {
  return (
    <Card
      as={motion.div}
      variant="interactive"
      tone="surface"
      radius="2xl"
      padding="none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex w-full items-center gap-3 px-4 py-3.5 motion-reduce:transition-none"
    >
      <Avatar user={student} name={student.name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-koru-on-surface">{student.name}</p>
        <p className="truncate text-xs text-koru-on-surface-variant">{student.email || student.major || ""}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {onEdit && (
          <Button
            variant="text"
            size="icon"
            onClick={() => onEdit(student)}
            title="Edit student"
            aria-label="Edit student"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="text"
            size="icon"
            onClick={() => onDelete(student)}
            title="Remove student"
            aria-label="Remove student"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export function StudentColumn({
  showAddStudent,
  isAddingStudent,
  setIsAddingStudent,
  studentSearch,
  setStudentSearch,
  selectedCourseId,
  filteredStudents,
  cohorts = [],
  cohortStudentMap = {},
  onEditStudent,
  onDeleteStudent,
}) {
  const hasCohorts = cohorts.length > 0;

  const cohortGroups = React.useMemo(() => {
    if (!hasCohorts) return null;
    const groups = cohorts.map((c) => ({
      cohort: c,
      students: filteredStudents.filter((s) => cohortStudentMap[s.id] === c.id),
    }));
    const unassigned = filteredStudents.filter((s) => !cohortStudentMap[s.id]);
    return { groups, unassigned };
  }, [hasCohorts, cohorts, filteredStudents, cohortStudentMap]);

  return (
    <Card tone="low" radius="2xl" padding="sm" className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-koru-title text-koru-on-surface">Students</h2>
        {showAddStudent && (
          <Button
            variant={isAddingStudent ? "tonal" : "outlined"}
            size="icon"
            onClick={() => setIsAddingStudent(prev => !prev)}
            aria-label="Add student to course"
          >
            {isAddingStudent ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <SearchInput value={studentSearch} onChange={setStudentSearch} />

      <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {!selectedCourseId ? (
          <p className="text-sm text-koru-on-surface-variant text-center py-8">Select a course to view students.</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-sm text-koru-on-surface-variant text-center py-8">No students enrolled.</p>
        ) : hasCohorts ? (
          <>
            {cohortGroups.groups.map(({ cohort, students }) => (
              <div key={cohort.id}>
                <div className="flex items-center gap-2 px-1 py-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-koru-primary shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-widest text-koru-primary">
                    {cohort.name}
                  </span>
                  <span className="text-[10px] text-koru-on-surface-variant font-medium ml-auto">
                    {students.length} student{students.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {students.length === 0 ? (
                  <p className="text-xs text-koru-on-surface-variant px-3 pb-2 italic">No students assigned</p>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="mb-1.5">
                      <StudentCard student={student} onEdit={onEditStudent} onDelete={onDeleteStudent} />
                    </div>
                  ))
                )}
              </div>
            ))}

            {cohortGroups.unassigned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 py-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-koru-outline-variant shrink-0" />
                  <span className="text-[11px] font-medium uppercase tracking-widest text-koru-on-surface-variant">
                    Unassigned
                  </span>
                  <span className="text-[10px] text-koru-on-surface-variant font-medium ml-auto">
                    {cohortGroups.unassigned.length}
                  </span>
                </div>
                {cohortGroups.unassigned.map((student) => (
                  <div key={student.id} className="mb-1.5">
                    <StudentCard student={student} onEdit={onEditStudent} onDelete={onDeleteStudent} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} onEdit={onEditStudent} onDelete={onDeleteStudent} />
          ))
        )}
      </div>
    </Card>
  );
}
