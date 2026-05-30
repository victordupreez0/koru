import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    ChevronDown, 
    ChevronRight, 
    Paperclip, 
    FileText, 
    Link as LinkIcon, 
    ExternalLink,
    Download,
    Loader
} from "lucide-react";
import { getCourseModules } from "../../../services/moduleService";

export default function CourseModulesView({ activeCourseId }) {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    if (!activeCourseId) return;
    let mounted = true;
    setModulesLoading(true);
    getCourseModules(activeCourseId)
      .then(data => {
        if (mounted) {
          // Filter out unpublished modules and items for the student view
          const visibleModules = (data ?? [])
            .filter(mod => mod.isPublished)
            .map(mod => ({
              ...mod,
              isOpen: mod.isOpen ?? true,
              items: (mod.items ?? []).filter(item => item.isPublished)
            }));
          setModules(visibleModules);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setModulesLoading(false);
      });
    return () => { mounted = false; };
  }, [activeCourseId]);

  const toggleModule = (id) => {
    setModules(modules.map(mod => mod.id === id ? { ...mod, isOpen: !mod.isOpen } : mod));
  };

  const areAllCollapsed = modules.every(mod => !mod.isOpen);

  const toggleAll = () => {
    const targetState = areAllCollapsed;
    setModules(modules.map(mod => ({ ...mod, isOpen: targetState })));
  };

  const exportCourseContent = () => {
    alert("Exporting course content... Your download will begin shortly.");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 py-6 select-none">
      {/* Loading indicator */}
      {modulesLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium px-1">
          <Loader size={13} className="animate-spin" />
          <span>Loading modules...</span>
        </div>
      )}

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
              onClick={() => navigate(`/courses/${activeCourseId}/items/${mod.id}?viewAs=student`)}
              className="flex items-center gap-3 px-5 py-4 bg-gray-50/80 border-b border-gray-200 cursor-pointer select-none group"
            >
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleModule(mod.id);
                }}
                className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 p-1 hover:bg-gray-200 rounded-md"
              >
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

            {/* Nested items & layout content */}
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
                        ) : item.type === "document" ? (
                          <span 
                            className="text-xs font-bold text-gray-700 hover:text-[#3C0078] hover:underline truncate cursor-pointer"
                            onClick={() => navigate(`/courses/${activeCourseId}/items/${item.id}${window.location.search}`)}
                          >
                            {item.label}
                          </span>
                        ) : (
                          <span 
                            className="text-xs font-bold text-gray-700 truncate cursor-pointer hover:text-gray-900"
                            onClick={() => alert(`Downloading attachment: ${item.label}`)}
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
