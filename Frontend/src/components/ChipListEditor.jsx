import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./UI";

// Small immutable array helper
function updateList(list, index, value) {
  return list.map((item, i) => (i === index ? value : item));
}

export default function ChipListEditor({ title, items, onChange, placeholder }) {
  return (
    <div>
      <p className="mb-2 text-koru-label text-koru-on-surface">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="inline-flex items-center gap-2 rounded-koru-pill bg-koru-surface-container-lowest px-3 py-1.5 text-sm shadow-koru-xs focus-within:ring-1 focus-within:ring-inset focus-within:ring-koru-primary"
          >
            <input
              value={item}
              onChange={(e) => onChange(updateList(items, index, e.target.value))}
              className="w-36 bg-transparent text-koru-on-surface outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="rounded-koru-pill text-koru-on-surface-variant transition hover:text-koru-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
              aria-label={`Remove ${title} item`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="tonal"
        size="sm"
        className="mt-2"
        startIcon={<Plus size={14} />}
        onClick={() => onChange([...items, ""])}
      >
        Add item
      </Button>
      <p className="mt-1 text-koru-caption text-koru-on-surface-variant">{placeholder}</p>
    </div>
  );
}
