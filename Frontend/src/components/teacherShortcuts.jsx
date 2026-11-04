import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Link2 } from "lucide-react";
import { Button, Card, Input } from "./UI";

// ──────────────────────────────────────────────
// Teacher shortcut chips – quick links to tools / pages
// Data is stored locally for now; easy to swap with a backend later.
// ──────────────────────────────────────────────
const defaultShortcuts = [
  { id: 1, label: "Class 1 Grades", url: "#" },
  { id: 2, label: "Miro", url: "#" },
  { id: 3, label: "Assignment 1", url: "#" },
  { id: 4, label: "Figma", url: "#" },
  { id: 5, label: "Google Slides", url: "#" },
];

const chipVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

export default function TeacherShortcuts() {
  const [shortcuts, setShortcuts] = useState(defaultShortcuts);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function handleAdd() {
    if (!newLabel.trim()) return;
    setShortcuts((prev) => [
      ...prev,
      { id: Date.now(), label: newLabel.trim(), url: newUrl.trim() || "#" },
    ]);
    setNewLabel("");
    setNewUrl("");
    setIsAdding(false);
  }

  function handleRemove(id) {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <Card variant="outlined" tone="low" radius="lg" padding="sm" className="flex h-full w-full flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mt-5 mb-1">
        <h2 className="font-display text-koru-heading text-koru-on-surface">Shortcuts</h2>
        <Button
          variant="tonal"
          size="icon"
          onClick={() => setIsAdding(!isAdding)}
          aria-label="Add shortcut"
          aria-expanded={isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="mb-5 text-koru-label font-normal text-koru-on-surface-variant">Quick access links</p>

      {/* ── Add shortcut form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <Card tone="muted" padding="sm" className="flex flex-col gap-3">
              <Input
                size="sm"
                type="text"
                aria-label="Shortcut label"
                placeholder="Label (e.g. Rubric)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Input
                size="sm"
                type="text"
                aria-label="Shortcut URL"
                placeholder="URL (optional)"
                startIcon={<Link2 className="h-4 w-4" />}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="text" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAdd}>
                  Add
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chip Grid ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-black pr-1">
        <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {shortcuts.map((shortcut, i) => (
            <motion.a
              key={shortcut.id}
              href={shortcut.url}
              custom={i}
              variants={chipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className="group relative inline-flex cursor-pointer items-center gap-2 rounded-koru-pill bg-koru-surface-container-lowest px-5 py-2.5 text-koru-label !text-koru-on-surface shadow-koru-card ring-1 ring-inset ring-koru-outline-faint transition duration-300 ease-koru-out hover:bg-koru-primary/[0.04] hover:shadow-koru-card-hover hover:ring-koru-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
            >
              {shortcut.label}
              {/* Remove button – appears on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(shortcut.id);
                }}
                type="button"
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-koru-surface-container-highest text-xs text-koru-on-surface-variant opacity-0 transition-all duration-200 hover:bg-koru-error hover:text-koru-on-error group-hover:flex group-hover:opacity-100"
                aria-label={`Remove ${shortcut.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.a>
          ))}
        </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
