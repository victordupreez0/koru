import React, { useState } from "react";
import { motion } from "framer-motion";

export function AddLecturerForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 mb-3">
        <input
          type="text"
          placeholder="Lecturer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          autoFocus
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())} className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors">Save</button>
        </div>
      </div>
    </motion.div>
  );
}
