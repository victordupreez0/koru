import React, { useState } from "react";
import { Plus, User, X, Bell } from "lucide-react";
import { ColumnCard } from "./ColumnCard";
import { SearchInput } from "./SearchInput";

export function LecturerColumn({
  lecturer,
  selectedCourseId,
  isAddingLecturer,
  setIsAddingLecturer,
  onOpenAnalytics,
  onOpenNotification,
}) {
  const [search, setSearch] = useState("");

  const visible =
    !lecturer ||
    !search.trim() ||
    lecturer.name.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="flex flex-col bg-white/70 border border-gray-100 rounded-3xl p-4 h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-2xl font-bold font-['Gabarito']">Lecturer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotification}
            className="w-9 h-9 rounded-full bg-[#3C0078]/10 text-[#3C0078] border border-[#3C0078]/20 hover:bg-[#3C0078] hover:text-white flex items-center justify-center transition-all"
            title="Send Notification"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddingLecturer(prev => !prev)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              isAddingLecturer
                ? "border-[#3C0078] bg-[#3C0078]/10 text-[#3C0078]"
                : "border-gray-200 hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Add lecturer"
          >
            {isAddingLecturer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} />

      <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {!selectedCourseId ? (
          <p className="text-sm text-gray-400 text-center py-8">Select a course to view its lecturer.</p>
        ) : !lecturer ? (
          <p className="text-sm text-gray-400 text-center py-8">No lecturer assigned to this course.</p>
        ) : !visible ? (
          <p className="text-sm text-gray-400 text-center py-8">No match.</p>
        ) : (
          <ColumnCard isSelected onClick={() => onOpenAnalytics(lecturer)}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/70">Lecturer</p>
              <p className="text-sm font-bold truncate text-white">{lecturer.name}</p>
            </div>
            <div className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <p className="text-[9px] font-black text-white uppercase tracking-tighter bg-white/10 px-2 py-1 rounded-md">
                View Stats
              </p>
            </div>
          </ColumnCard>
        )}
      </div>
    </div>
  );
}
