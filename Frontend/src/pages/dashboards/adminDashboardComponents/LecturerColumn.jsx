import React, { useState } from "react";
import { Plus, X, Bell, Pencil, Trash2 } from "lucide-react";
import { ColumnCard } from "./ColumnCard";
import { SearchInput } from "./SearchInput";
import { Avatar, Button, Card } from "../../../components/UI";

export function LecturerColumn({
  lecturer,
  selectedCourseId,
  isAddingLecturer,
  setIsAddingLecturer,
  onOpenNotification,
  onEditLecturer,
  onDeleteLecturer,
}) {
  const [search, setSearch] = useState("");

  const visible =
    !lecturer ||
    !search.trim() ||
    lecturer.name.toLowerCase().includes(search.toLowerCase());

  return (
    <Card tone="low" radius="2xl" padding="sm" className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-koru-title text-koru-on-surface">Lecturer</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="tonal"
            size="icon"
            onClick={onOpenNotification}
            title="Send Notification"
            aria-label="Send Notification"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant={isAddingLecturer ? "tonal" : "outlined"}
            size="icon"
            onClick={() => setIsAddingLecturer(prev => !prev)}
            aria-label="Add lecturer"
          >
            {isAddingLecturer ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {!selectedCourseId ? (
          <p className="py-8 text-center text-sm text-koru-on-surface-variant">Select a course to view its lecturer.</p>
        ) : !lecturer ? (
          <p className="py-8 text-center text-sm text-koru-on-surface-variant">No lecturer assigned to this course.</p>
        ) : !visible ? (
          <p className="py-8 text-center text-sm text-koru-on-surface-variant">No match.</p>
        ) : (
          <ColumnCard isSelected>
            <Avatar user={lecturer} name={lecturer.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-koru-on-primary-container/70">Lecturer</p>
              <p className="truncate text-sm font-medium">{lecturer.name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onEditLecturer && (
                <Button
                  variant="text"
                  size="icon"
                  onClick={() => onEditLecturer(lecturer)}
                  title="Edit lecturer"
                  aria-label="Edit lecturer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDeleteLecturer && (
                <Button
                  variant="text"
                  size="icon"
                  onClick={() => onDeleteLecturer(lecturer)}
                  title="Delete lecturer"
                  aria-label="Delete lecturer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </ColumnCard>
        )}
      </div>
    </Card>
  );
}
