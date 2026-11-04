import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3.5 bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint rounded-koru-xl shadow-koru-card hover:shadow-koru-card-hover transition-shadow motion-reduce:transition-none min-w-[170px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
      >
        <div className="flex-1 text-left">
          <span className="text-koru-caption text-koru-on-surface-variant uppercase tracking-wider block leading-none mb-1">{label}</span>
          <span className="text-koru-label font-medium text-koru-on-surface leading-none">{value}</span>
        </div>
        <ChevronDown size={14} className={`text-koru-on-surface-variant transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-full bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-faint rounded-koru-2xl shadow-koru-lg z-[110] overflow-hidden p-2"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-5 py-3 rounded-koru-lg text-koru-caption font-medium uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${value === opt ? "bg-koru-primary text-koru-on-primary" : "text-koru-on-surface-variant hover:bg-koru-surface-container hover:text-koru-primary"}`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
