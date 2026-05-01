import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * ModuleAccordion Component
 * 
 * A collapsible navigation list used in the Modules section.
 * Each section (Overview, Resources, Week 1, etc.) can be expanded to show sub-items.
 */
function AccordionItem({ title, children, defaultOpen = false, onRemove, isTeacher }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black dark:border-slate-600 group">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between py-4 px-2 text-left font-bold transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-100"
        >
          <span className="flex items-center gap-2">
            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            {title}
          </span>
        </button>
        {isTeacher && (
          <button
            onClick={onRemove}
            className="p-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Remove Section"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {isOpen && (
        <div className="bg-gray-100/50 dark:bg-slate-800/50">
          <ul className="flex flex-col">
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
      className={`group flex items-center justify-between px-4 py-2 text-[13px] transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer ${isActive ? "bg-gray-200 dark:bg-slate-700 font-bold border-l-4 border-black dark:border-slate-400 dark:text-slate-100" : "dark:text-slate-300"}`}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      {isTeacher && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          title="Remove Item"
        >
          <X size={14} />
        </button>
      )}
    </li>
  );
}

export default function ModuleAccordion() {
  const { role } = useAuth();
  const isTeacher = role === "teacher";
  const [activeItem, setActiveItem] = useState("Semester Overview");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSubItemTo, setAddingSubItemTo] = useState(null); // Track which section is adding an item
  const [newSubItemLabel, setNewSubItemLabel] = useState("");

  const [items, setItems] = useState([
    { id: 1, title: "Overview", subItems: ["Semester Overview"], defaultOpen: true },
    { id: 2, title: "Resources", subItems: ["Open Window Library", "Academic Rules", "Study Guide", "Prescribed Reading"], defaultOpen: true },
    { id: 3, title: "Week 1", subItems: ["Practical", "Theory"], defaultOpen: true },
    { id: 4, title: "Week 2", subItems: [], defaultOpen: false },
    { id: 5, title: "Week 3", subItems: [], defaultOpen: false },
    { id: 6, title: "Week 4", subItems: [], defaultOpen: false },
  ]);

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

  const addSection = () => {
    if (newSectionTitle.trim()) {
      setItems([...items, {
        id: Date.now(),
        title: newSectionTitle,
        subItems: [],
        defaultOpen: true
      }]);
      setNewSectionTitle("");
      setIsAddingSection(false);
    }
  };

  return (
      <div className="w-56 flex flex-col border-t border-black dark:border-slate-600 select-none">
      {items.map((section) => (
        <AccordionItem 
          key={section.id} 
          title={section.title} 
          defaultOpen={section.defaultOpen}
          onRemove={() => removeSection(section.id)}
          isTeacher={isTeacher}
        >
          {section.subItems.map((subItem) => (
            <SubNavItem
              key={subItem}
              label={subItem}
              isActive={activeItem === subItem}
              onClick={() => setActiveItem(subItem)}
              onRemove={() => removeSubItem(section.id, subItem)}
              isTeacher={isTeacher}
            />
          ))}
          {isTeacher && (
              <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-800/30">
              {addingSubItemTo === section.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Item name..."
                    className="bg-white dark:bg-slate-700 border border-black/10 dark:border-slate-600 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-black dark:focus:border-slate-400 transition-colors dark:text-slate-200 dark:placeholder-slate-500"
                    value={newSubItemLabel}
                    onChange={(e) => setNewSubItemLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSubItem(section.id);
                      if (e.key === "Escape") setAddingSubItemTo(null);
                    }}
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => addSubItem(section.id)}
                      className="px-3 py-1 bg-[#3C0078] text-white text-[9px] font-bold uppercase tracking-widest rounded-md hover:bg-[#2A0054] transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingSubItemTo(null)}
                      className="px-2 py-1 bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSubItemTo(section.id)}
                  className="w-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#3C0078] hover:text-[#2A0054] transition-colors"
                >
                  <Plus size={12} /> Add Item
                </button>
              )}
            </div>
          )}
        </AccordionItem>
      ))}

      {isTeacher && (
        <div className="mt-4">
          {isAddingSection ? (
            <div className="flex flex-col gap-2 p-2">
              <input
                autoFocus
                type="text"
                placeholder="Section name..."
                className="bg-gray-50 dark:bg-slate-700 border border-black/10 dark:border-slate-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-slate-400 transition-colors dark:text-slate-200 dark:placeholder-slate-500"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSection()}
              />
              <div className="flex gap-1">
                <button
                  onClick={addSection}
                  className="flex-1 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAddingSection(false)}
                  className="px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSection(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-black/10 dark:border-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:border-black/30 dark:hover:border-slate-400 hover:text-black dark:hover:text-slate-200 transition-all"
            >
              <Plus size={16} /> Add Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}
