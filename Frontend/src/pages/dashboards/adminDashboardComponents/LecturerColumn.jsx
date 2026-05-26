import React from "react";
import { Plus, User, Bell } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ColumnCard } from "./ColumnCard";
import { SearchInput } from "./SearchInput";
import { AddLecturerForm } from "./AddLecturerForm";

export function LecturerColumn({
  lecturerSearch,
  setLecturerSearch,
  isAddingLecturer,
  setIsAddingLecturer,
  setIsAddingCourse,
  handleSaveLecturer,
  filteredLecturers,
  selectedLecturerId,
  handleSelectLecturer,
  onOpenAnalytics,
  onOpenNotification
}) {
  return (
    <div className="flex flex-col bg-white/80 border-1 border-gray-200 rounded-3xl drop-shadow-xl p-4 min-h-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-2xl font-bold font-['Gabarito']">Lecturers</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNotification}
            className="w-9 h-9 rounded-full bg-[#3C0078]/10 text-[#3C0078] border border-[#3C0078]/20 hover:bg-[#3C0078] hover:text-white flex items-center justify-center transition-all group"
            title="Send Notification"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setIsAddingLecturer(true); setIsAddingCourse(false); }}
            className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Add lecturer"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      <SearchInput value={lecturerSearch} onChange={setLecturerSearch} />

      <div className="mt-4 flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        <AnimatePresence>
          {isAddingLecturer && (
            <AddLecturerForm
              onSave={handleSaveLecturer}
              onCancel={() => setIsAddingLecturer(false)}
            />
          )}
        </AnimatePresence>

        {filteredLecturers.length === 0 && !isAddingLecturer ? (
          <p className="text-sm text-gray-400 text-center py-8">No lecturers found for this filter.</p>
        ) : (
          filteredLecturers.map((lecturer, idx) => (
            <div key={lecturer.id} className="flex items-stretch gap-0">
              {/* Timeline track */}
              <div className="flex flex-col items-center w-6 shrink-0">
                <div className={`w-px flex-1 ${idx === 0 ? "bg-transparent" : "bg-gray-300"}`} />
                <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${lecturer.id === selectedLecturerId ? "border-[#3C0078] bg-[#3C0078]" : "border-gray-300 bg-white"
                  }`} />
                <div className={`w-px flex-1 ${idx === filteredLecturers.length - 1 ? "bg-transparent" : "bg-gray-300"}`} />
              </div>

              {/* Card */}
              <ColumnCard
                isSelected={lecturer.id === selectedLecturerId}
                onClick={() => {
                   if (lecturer.id === selectedLecturerId) {
                      onOpenAnalytics(lecturer);
                   } else {
                      handleSelectLecturer(lecturer.id);
                   }
                }}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${lecturer.id === selectedLecturerId ? "bg-white/20" : "bg-gray-100"
                  }`}>
                  <User className={`w-4 h-4 ${lecturer.id === selectedLecturerId ? "text-white" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${lecturer.id === selectedLecturerId ? "text-white/70" : "text-gray-400"}`}>
                    Lecturer
                  </p>
                  <p className={`text-sm font-bold ${lecturer.id === selectedLecturerId ? "text-white" : "text-gray-800"}`}>
                    {lecturer.name}
                  </p>
                </div>
                {lecturer.id === selectedLecturerId && (
                   <div className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-black text-white uppercase tracking-tighter bg-white/10 px-2 py-1 rounded-md">View Stats</p>
                   </div>
                )}
              </ColumnCard>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
