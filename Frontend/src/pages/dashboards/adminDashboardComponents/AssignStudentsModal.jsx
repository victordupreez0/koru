import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Avatar, Modal } from "../../../components/UI";
import { SearchInput } from "./SearchInput";

export function AssignStudentsModal({ allStudents, currentStudentIds, courseTitle, onAssign, onClose }) {
  const [search, setSearch] = useState("");
  const unassigned = allStudents.filter(
    (s) => !currentStudentIds.includes(s.id) && s.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Modal
      open
      onClose={onClose}
      title="Assign Students"
      description={`Adding to ${courseTitle}`}
      size="sm"
    >
      <SearchInput value={search} onChange={setSearch} placeholder="Search students..." />
      <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto">
        {unassigned.length === 0 ? (
          <p className="py-6 text-center text-sm text-koru-on-surface-variant">No more students to assign.</p>
        ) : (
          unassigned.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onAssign(student.id)}
              className="flex w-full items-center gap-3 rounded-koru-md bg-koru-surface-container-lowest px-4 py-3 text-left transition-colors hover:bg-koru-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
            >
              <Avatar user={student} name={student.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-koru-on-surface">{student.name}</p>
                <p className="text-xs text-koru-on-surface-variant">{student.major}</p>
              </div>
              <Plus className="ml-auto h-4 w-4 text-koru-on-surface-variant" aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
