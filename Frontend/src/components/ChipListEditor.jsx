import React from "react";
import { Plus, Trash2 } from "lucide-react";

// Small immutable array helper
function updateList(list, index, value) {
  return list.map((item, i) => (i === index ? value : item));
}

export default function ChipListEditor({ title, items, onChange, placeholder }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <input
              value={item}
              onChange={(e) => onChange(updateList(items, index, e.target.value))}
              className="w-36 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Remove ${title} item`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <Plus size={14} /> Add item
      </button>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{placeholder}</p>
    </div>
  );
}
