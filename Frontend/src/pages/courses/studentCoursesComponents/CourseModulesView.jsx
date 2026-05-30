import React, { useState } from "react";
import { 
    ChevronDown, 
    ChevronRight, 
    Paperclip, 
    FileText, 
    Link as LinkIcon, 
    ExternalLink,
    Download
} from "lucide-react";

export default function CourseModulesView() {
  const [modules, setModules] = useState([
    {
      id: 1,
      title: "Overview",
      isOpen: true,
      items: [
        { id: 101, label: "Study Guide 2026", type: "attachment" },
        { id: 102, label: "Semester Overview", type: "document" }
      ]
    },
    {
      id: 2,
      title: "Resources",
      isOpen: true,
      items: [
        { id: 201, label: "OW Library", type: "link", isExternal: true },
        { id: 202, label: "Academic Rules", type: "link", isExternal: true },
        { id: 203, label: "Contact Sessions", type: "document" }
      ]
    },
    {
      id: 3,
      title: "Week 1: Introduction & Briefing",
      isOpen: true,
      prefix: "①",
      items: [
        { id: 301, label: "Week 1 Theory", type: "document" },
        { id: 302, label: "Week 1 Practical", type: "document" }
      ]
    }
  ]);

  const toggleModule = (id) => {
    setModules(modules.map(mod => mod.id === id ? { ...mod, isOpen: !mod.isOpen } : mod));
  };

  const areAllCollapsed = modules.every(mod => !mod.isOpen);

  const toggleAll = () => {
    const targetState = areAllCollapsed; // if all are collapsed, we expand them all
    setModules(modules.map(mod => ({ ...mod, isOpen: targetState })));
  };

  const exportCourseContent = () => {
    alert("Exporting course content... Your download will begin shortly.");
  };

  return (
    <div className="w-full flex flex-col gap-6 py-6 select-none">
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        <button
          onClick={toggleAll}
          className="flex items-center justify-center px-4 py-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          {areAllCollapsed ? "Expand all" : "Collapse all"}
        </button>
        <button
          onClick={exportCourseContent}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <Download size={13} />
          <span>Export Course Content</span>
        </button>
      </div>

      {/* Modules list */}
      <div className="flex flex-col gap-5">
        {modules.map((mod) => (
          <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            {/* Header row */}
            <div 
              onClick={() => toggleModule(mod.id)}
              className="flex items-center gap-3 px-5 py-4 bg-gray-50/80 border-b border-gray-200 cursor-pointer select-none group"
            >
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0">
                {mod.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <div className="flex items-center gap-2">
                {mod.prefix && (
                  <span className="text-sm font-extrabold text-gray-700 shrink-0 select-none">
                    {mod.prefix}
                  </span>
                )}
                <h3 className="text-xs font-black tracking-wider text-gray-700 uppercase">
                  {mod.title}
                </h3>
              </div>
            </div>

            {/* Nested items */}
            {mod.isOpen && (
              <div className="flex flex-col">
                {mod.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 font-medium">
                    No items in this module section
                  </div>
                ) : (
                  mod.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between py-3.5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon based on type */}
                        <span className="text-gray-400 shrink-0">
                          {item.type === "attachment" && <Paperclip size={14} />}
                          {item.type === "document" && <FileText size={14} />}
                          {item.type === "link" && <LinkIcon size={14} />}
                        </span>

                        {/* Title link or standard text */}
                        {item.type === "link" ? (
                          <a 
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert(`Opening link: ${item.label}`); }}
                            className="text-xs font-bold !text-blue-600 hover:underline flex items-center gap-1.5 min-w-0"
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isExternal && <ExternalLink size={11} className="shrink-0" />}
                          </a>
                        ) : (
                          <span 
                            className="text-xs font-bold text-gray-700 truncate cursor-pointer hover:text-gray-900"
                            onClick={() => alert(`Viewing document: ${item.label}`)}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
