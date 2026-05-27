import React, { useState } from "react";
import { motion } from "framer-motion";

export function AddCourseForm({ lecturerName, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 mb-3">
        <input type="text" placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors" />
        <input type="text" placeholder="Course code (e.g. UX300)" value={code} onChange={(e) => setCode(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors" />
        <p className="text-xs text-gray-400">Lecturer: {lecturerName}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={() => title.trim() && code.trim() && onSave(title.trim(), code.trim())} className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors">Save</button>
        </div>
      </div>
    </motion.div>
  );
}
