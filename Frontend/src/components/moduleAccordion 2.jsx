import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * ModuleAccordion Component
 * 
 * A collapsible navigation list used in the Modules section.
 * Each section (Overview, Resources, Week 1, etc.) can be expanded to show sub-items.
 */
function AccordionItem({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 px-2 text-left font-bold transition-colors hover:bg-gray-100"
      >
        <span className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="bg-gray-100/50">
          <ul className="flex flex-col">
            {children}
          </ul>
        </div>
      )}
    </div>
  );
}

function SubNavItem({ label, isActive, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`px-4 py-2 text-[13px] transition-colors hover:bg-gray-200 cursor-pointer ${isActive ? "bg-gray-200 font-bold border-l-4 border-black" : ""}`}
    >
      {label}
    </li>
  );
}

export default function ModuleAccordion() {
  const [activeItem, setActiveItem] = useState("Semester Overview");

  const items = [
    { title: "Overview", subItems: ["Semester Overview"], defaultOpen: true },
    { title: "Resources", subItems: ["Open Window Library", "Academic Rules", "Study Guide", "Prescribed Reading"], defaultOpen: true },
    { title: "Week 1", subItems: ["Practical", "Theory"], defaultOpen: true },
    { title: "Week 2", subItems: [], defaultOpen: false },
    { title: "Week 3", subItems: [], defaultOpen: false },
    { title: "Week 4", subItems: [], defaultOpen: false },
  ];

  return (
    <div className="w-48 flex flex-col border-t border-black">
      {items.map((section) => (
        <AccordionItem key={section.title} title={section.title} defaultOpen={section.defaultOpen}>
          {section.subItems.map((subItem) => (
            <SubNavItem
              key={subItem}
              label={subItem}
              isActive={activeItem === subItem}
              onClick={() => setActiveItem(subItem)}
            />
          ))}
        </AccordionItem>
      ))}
    </div>
  );
}
