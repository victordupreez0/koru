import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronRight,
    Paperclip,
    FileText,
    Link as LinkIcon,
    ExternalLink,
    Loader
} from "lucide-react";
import { Button, Card, EmptyState, Skeleton } from "../../../components/UI";
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

  return (
    <div className="w-full flex flex-col gap-6 py-6 select-none">
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-3 shrink-0">
        <Button variant="outlined" size="sm" onClick={toggleAll}>
          {areAllCollapsed ? "Expand all" : "Collapse all"}
        </Button>
      </div>

      {/* Modules list */}
      <div className="flex flex-col gap-5">
        {modulesLoading ? (
          [3, 2, 4].map((itemCount, i) => (
            <Card key={i} variant="outlined" tone="surface" padding="none" className="overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-koru-surface-container-low border-b border-koru-outline-faint">
                <Skeleton className="w-5 h-5 shrink-0" />
                <Skeleton variant="text" width={`${90 + i * 45}px`} />
              </div>
              <div className="p-5 flex flex-col gap-3">
                {Array.from({ length: itemCount }, (_, j) => (
                  <div key={j} className="flex items-center gap-3 py-1">
                    <Skeleton className="w-4 h-4 shrink-0" />
                    <Skeleton variant="text" width={`${110 + j * 55}px`} />
                  </div>
                ))}
              </div>
            </Card>
          ))
        ) : modules.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="No modules yet"
            description="Course content will appear here once modules are published."
          />
        ) : modules.map((mod) => (
          <Card key={mod.id} variant="outlined" tone="surface" padding="none" className="overflow-hidden">
            {/* Header row */}
            <div 
              onClick={() => toggleModule(mod.id)}
              className="flex items-center gap-3 px-5 py-4 bg-koru-surface-container-low border-b border-koru-outline-faint cursor-pointer select-none group"
            >
              <span 
                className="text-koru-on-surface-variant group-hover:text-koru-on-surface transition-colors shrink-0 p-1 hover:bg-koru-surface-container-highest rounded-koru-sm"
              >
                {mod.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
              <div className="flex items-center gap-2">
                {mod.prefix && (
                  <span className="text-sm font-medium text-koru-on-surface-variant shrink-0 select-none">
                    {mod.prefix}
                  </span>
                )}
                <h3 className="font-display text-koru-label tracking-wider text-koru-on-surface-variant uppercase">
                  {mod.title}
                </h3>
              </div>
            </div>

            {/* Nested items & layout content */}
            {mod.isOpen && (
              <div className="flex flex-col">
                {mod.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-koru-on-surface-variant font-medium">
                    No items in this module section
                  </div>
                ) : (
                  mod.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between py-3.5 px-6 border-b border-koru-outline-faint last:border-b-0 hover:bg-koru-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon based on type */}
                        <span className="text-koru-on-surface-variant shrink-0">
                          {item.type === "attachment" && <Paperclip size={14} />}
                          {item.type === "document" && <FileText size={14} />}
                          {item.type === "link" && <LinkIcon size={14} />}
                        </span>

                        {/* Title link or standard text */}
                        {item.type === "link" ? (
                          <a 
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert(`Opening link: ${item.label}`); }}
                            className="text-xs font-medium !text-koru-info hover:underline flex items-center gap-1.5 min-w-0"
                          >
                            <span className="truncate">{item.label}</span>
                            {item.isExternal && <ExternalLink size={11} className="shrink-0" />}
                          </a>
                        ) : item.type === "document" ? (
                          <span 
                            className="text-xs font-medium text-koru-on-surface hover:text-koru-primary hover:underline truncate cursor-pointer"
                            onClick={() => navigate(`/courses/${activeCourseId}/items/${item.id}${window.location.search}`)}
                          >
                            {item.label}
                          </span>
                        ) : (
                          <span 
                            className="text-xs font-medium text-koru-on-surface truncate cursor-pointer hover:text-koru-primary"
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
          </Card>
        ))}
      </div>
    </div>
  );
}
