import React, { useState } from "react";
import { motion } from "framer-motion";

export function AddLecturerForm({ onSave, onCancel }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const canSave = firstName.trim() && lastName.trim() && email.trim();

  const handleSave = () => {
    if (!canSave) return;
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
          />
        </div>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#3C0078] transition-colors"
        />
        <p className="text-xs text-gray-400">A temporary password will be generated and must be changed on first login.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!canSave} className="px-4 py-1.5 text-xs font-bold text-white bg-[#3C0078] rounded-lg hover:bg-[#2a0055] transition-colors disabled:opacity-40">Save</button>
        </div>
      </div>
    </motion.div>
  );
}
