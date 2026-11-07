import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * ModuleAccordion Component
 * 
 * A collapsible navigation list used in the Modules section.
 * Each section (Overview, Resources, Week 1, etc.) can be expanded to show sub-items.
 * Styled to match CourseSecondaryNav.
 */
function AccordionItem({ title, children, defaultOpen = false, onRemove, isTeacher }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="group">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-between py-2.5 px-4 text-left font-medium transition-all duration-200 rounded-koru-md mx-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${
            isOpen ? "text-koru-primary" : "text-koru-on-surface-variant hover:bg-koru-primary-subtle"
          }`}
        >
          <span className="flex items-center gap-2">
            {title}
          </span>
          {isOpen ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
        </button>
        {isTeacher && (
          <button
            onClick={onRemove}
            className="rounded-koru-sm p-2 text-koru-on-surface-variant opacity-0 transition-all hover:text-koru-error focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus group-hover:opacity-100"
            title="Remove Section"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="mt-1 mb-2">
          <ul className="flex flex-col gap-0.5">
            {children}
          </ul>
        </div>
      )}
    </div>
  );
}

function SubNavItem({ label, isActive, onClick, onRemove, isTeacher }) {
  return (
    <li
      className={`group flex items-center justify-between px-4 py-1.5 text-xs transition-colors mx-4 rounded-koru-sm cursor-pointer ${
        isActive 
          ? "bg-koru-primary text-koru-on-primary font-medium shadow-koru-xs"
          : "text-koru-on-surface-variant hover:text-koru-primary hover:bg-koru-primary-soft"
      }`}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      {isTeacher && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`rounded-koru-xs p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all ${
            isActive ? "text-koru-on-primary/70 hover:text-koru-on-primary" : "text-koru-on-surface-variant hover:text-koru-error"
          }`}
          title="Remove Item"
        >
          <X size={12} />
        </button>
      )}
    </li>
  );
}

const MODULE_ACCORDION_KEY = "module_accordion_items";

const DEFAULT_ITEMS = [
  { id: 1, title: "Overview", subItems: ["Semester Overview"], defaultOpen: true },
  { id: 2, title: "Resources", subItems: ["Open Window Library", "Academic Rules", "Study Guide", "Prescribed Reading"], defaultOpen: true },
  { id: 3, title: "Week 1", subItems: ["Practical", "Theory"], defaultOpen: true },
  { id: 4, title: "Week 2", subItems: [], defaultOpen: false },
  { id: 5, title: "Week 3", subItems: [], defaultOpen: false },
  { id: 6, title: "Week 4", subItems: [], defaultOpen: false },
];

export default function ModuleAccordion() {
  const { role } = useAuth();
  const isTeacher = role === "teacher";
  const [activeItem, setActiveItem] = useState("Semester Overview");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSubItemTo, setAddingSubItemTo] = useState(null); 
  const [newSubItemLabel, setNewSubItemLabel] = useState("");

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(MODULE_ACCORDION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem(MODULE_ACCORDION_KEY, JSON.stringify(items));
  }, [items]);

  const removeSection = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const removeSubItem = (sectionId, subItemName) => {
    setItems(items.map(item => {
      if (item.id === sectionId) {
        return { ...item, subItems: item.subItems.filter(s => s !== subItemName) };
      }
      return item;
    }));
  };

  const addSection = () => {
    if (newSectionTitle.trim()) {
      setItems([...items, { id: Date.now(), title: newSectionTitle, subItems: [], defaultOpen: true }]);
      setNewSectionTitle("");
      setIsAddingSection(false);
    }
  };

  const addSubItem = (sectionId) => {
    if (newSubItemLabel.trim()) {
      setItems(items.map(item => {
        if (item.id === sectionId) {
          return { ...item, subItems: [...item.subItems, newSubItemLabel], defaultOpen: true };
        }
        return item;
      }));
      setNewSubItemLabel("");
      setAddingSubItemTo(null);
    }
  };

  return (
    <div className="flex flex-col gap-1 overflow-hidden bg-koru-surface-container-lowest/50 shadow-koru-lg ring-1 ring-inset ring-koru-outline-faint rounded-koru-3xl min-w-[220px] max-h-[80vh] overflow-y-auto py-4 scrollbar-hide">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.title}
          defaultOpen={item.defaultOpen}
          isTeacher={isTeacher}
          onRemove={() => removeSection(item.id)}
        >
          {item.subItems.map((subItem) => (
            <SubNavItem
              key={subItem}
              label={subItem}
              isActive={activeItem === subItem}
              isTeacher={isTeacher}
              onClick={() => setActiveItem(subItem)}
              onRemove={() => removeSubItem(item.id, subItem)}
            />
          ))}
          {isTeacher && (
            <div className="px-4 py-1">
              {addingSubItemTo === item.id ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Item name..."
                    className="w-full rounded-koru-xs bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-variant px-3 py-1.5 text-koru-caption text-koru-on-surface outline-none focus:ring-2 focus:ring-koru-focus transition-colors"
                    value={newSubItemLabel}
                    onChange={(e) => setNewSubItemLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSubItem(item.id);
                      if (e.key === "Escape") setAddingSubItemTo(null);
                    }}
                  />
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => addSubItem(item.id)}
                      className="flex-1 py-1 bg-koru-primary text-koru-on-primary text-koru-caption font-medium uppercase tracking-widest rounded-koru-sm hover:bg-koru-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingSubItemTo(null)}
                      className="p-1 bg-koru-surface-container-high text-koru-on-surface-variant rounded-koru-sm hover:bg-koru-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSubItemTo(item.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-koru-outline-variant rounded-koru-sm text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant hover:border-koru-primary/30 hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all mb-1"
                >
                  <Plus size={10} /> Add Item
                </button>
              )}
            </div>
          )}
        </AccordionItem>
      ))}

      {isTeacher && (
        <div className="mt-4 px-4 border-t border-koru-outline-faint pt-4">
          {isAddingSection ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Section name..."
                className="w-full rounded-koru-xs bg-koru-surface-container-lowest ring-1 ring-inset ring-koru-outline-variant px-3 py-2 text-xs text-koru-on-surface outline-none focus:ring-2 focus:ring-koru-focus transition-colors"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSection();
                  if (e.key === "Escape") setIsAddingSection(false);
                }}
              />
              <div className="flex gap-1">
                <button
                  onClick={addSection}
                  className="flex-1 py-1.5 bg-koru-primary text-koru-on-primary text-koru-caption font-medium uppercase tracking-widest rounded-koru-sm hover:bg-koru-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingSection(false)}
                  className="p-1.5 bg-koru-surface-container-high text-koru-on-surface-variant rounded-koru-sm hover:bg-koru-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSection(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-koru-outline-variant rounded-koru-md text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant hover:border-koru-outline hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus transition-all"
            >
              <Plus size={14} /> Add Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}