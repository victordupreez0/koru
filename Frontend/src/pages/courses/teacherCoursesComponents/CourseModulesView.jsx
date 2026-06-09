import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "@solar-icons/react";
import { Plus, ChevronDown, ChevronRight, Trash2, Loader, Download, X, Paperclip, FileText, ExternalLink, Link as LinkIcon, EyeOff } from "lucide-react";
import { getCourseModules, createModule, updateModule, deleteModule, createModuleItem, updateModuleItem, deleteModuleItem } from "../../../services/moduleService";

export function CourseModulesView({ activeCourseId }) {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    if (!activeCourseId) return;
    let mounted = true;
    setModulesLoading(true);
    getCourseModules(activeCourseId)
      .then(data => { if (mounted) setModules(data); })
      .catch(console.error)
      .finally(() => { if (mounted) setModulesLoading(false); });
    return () => { mounted = false; };
  }, [activeCourseId]);

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [createModuleError, setCreateModuleError] = useState("");

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemType, setNewItemType] = useState("document");
  const [isNewItemExternal, setIsNewItemExternal] = useState(true);

  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemModuleId, setEditingItemModuleId] = useState(null);
  const [editingItemLabel, setEditingItemLabel] = useState("");

  const toggleModule = (id) => {
    setModules(modules.map(mod => mod.id === id ? { ...mod, isOpen: !mod.isOpen } : mod));
  };

  const areAllCollapsed = modules.every(mod => !mod.isOpen);

  const toggleAll = () => {
    const targetState = areAllCollapsed;
    setModules(modules.map(mod => ({ ...mod, isOpen: targetState })));
  };


  const handleAddModule = async () => {
    if (!newModuleTitle.trim() || !activeCourseId) return;
    setIsCreatingModule(true);
    setCreateModuleError("");
    try {
      const created = await createModule({ courseId: activeCourseId, title: newModuleTitle, isPublished: true, isOpen: true });
      setModules(prev => [...prev, { ...created, items: created.items ?? [] }]);
      setNewModuleTitle("");
      setIsAddingModule(false);
    } catch (err) {
      console.error("Failed to create module:", err);
      setCreateModuleError(err.message || "Failed to create module. Please try again.");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const handleRenameModule = async (modId) => {
    if (!editingModuleTitle.trim()) return;
    const mod = modules.find(m => m.id === modId);
    if (!mod) return;
    setModules(prev => prev.map(m => m.id === modId ? { ...m, title: editingModuleTitle } : m));
    setEditingModuleId(null);
    setEditingModuleTitle("");
    try {
      await updateModule(modId, { ...mod, title: editingModuleTitle });
    } catch (err) {
      console.error("Failed to rename module:", err);
      setModules(prev => prev.map(m => m.id === modId ? { ...m, title: mod.title } : m));
    }
  };

  const handleDeleteModule = async (modId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this module section?")) return;
    setModules(prev => prev.filter(m => m.id !== modId));
    try {
      await deleteModule(modId);
    } catch (err) {
      console.error("Failed to delete module:", err);
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleToggleModulePublish = async (modId, e) => {
    e.stopPropagation();
    const mod = modules.find(m => m.id === modId);
    if (!mod) return;
    const next = !mod.isPublished;
    setModules(prev => prev.map(m => m.id === modId ? { ...m, isPublished: next } : m));
    try {
      await updateModule(modId, { ...mod, isPublished: next });
    } catch (err) {
      console.error("Failed to update module publish state:", err);
      setModules(prev => prev.map(m => m.id === modId ? { ...m, isPublished: mod.isPublished } : m));
    }
  };

  const handleAddItem = async (modId) => {
    if (!newItemLabel.trim()) return;
    try {
      const created = await createModuleItem({
        moduleId: modId,
        label: newItemLabel,
        type: newItemType,
        isPublished: true,
        isExternal: newItemType === "link" ? isNewItemExternal : false,
      });
      setModules(prev => prev.map(mod => {
        if (mod.id === modId) return { ...mod, items: [...(mod.items ?? []), created] };
        return mod;
      }));
      setNewItemLabel("");
      setAddingItemTo(null);
      if (created.type === "document") navigate(`/courses/${activeCourseId}/items/${created.id}`);
    } catch (err) {
      console.error("Failed to create module item:", err);
    }
  };

  const handleRenameItem = async (modId, itemId) => {
    if (!editingItemLabel.trim()) return;
    const mod = modules.find(m => m.id === modId);
    const item = mod?.items?.find(i => i.id === itemId);
    if (!item) return;
    setModules(prev => prev.map(m => {
      if (m.id === modId) return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, label: editingItemLabel } : i) };
      return m;
    }));
    setEditingItemId(null);
    setEditingItemModuleId(null);
    setEditingItemLabel("");
    try {
      await updateModuleItem(itemId, { ...item, label: editingItemLabel });
    } catch (err) {
      console.error("Failed to rename item:", err);
      setModules(prev => prev.map(m => {
        if (m.id === modId) return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, label: item.label } : i) };
        return m;
      }));
    }
  };

  const handleDeleteItem = async (modId, itemId) => {
    if (!confirm("Are you sure you want to remove this item?")) return;
    setModules(prev => prev.map(m => {
      if (m.id === modId) return { ...m, items: m.items.filter(i => i.id !== itemId) };
      return m;
    }));
    try {
      await deleteModuleItem(itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleToggleItemPublish = async (modId, itemId) => {
    const mod = modules.find(m => m.id === modId);
    const item = mod?.items?.find(i => i.id === itemId);
    if (!item) return;
    const next = !item.isPublished;
    setModules(prev => prev.map(m => {
      if (m.id === modId) return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, isPublished: next } : i) };
      return m;
    }));
    try {
      await updateModuleItem(itemId, { ...item, isPublished: next });
    } catch (err) {
      console.error("Failed to toggle item publish:", err);
      setModules(prev => prev.map(m => {
        if (m.id === modId) return { ...m, items: m.items.map(i => i.id === itemId ? { ...i, isPublished: item.isPublished } : i) };
        return m;
      }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 py-6 select-none">
      {modulesLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium px-1">
          <Loader size={13} className="animate-spin" />
          <span>Loading modules...</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 shrink-0 px-1">
        <h2 className="text-lg font-black tracking-tight text-gray-900">Course Modules Manager</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAddingModule(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#3C0078] hover:bg-[#2A0054] text-white rounded-xl transition-all cursor-pointer shadow-sm hover:shadow">
            <Plus size={14} /> <span>Add Module</span>
          </button>
          <button onClick={toggleAll} className="flex items-center justify-center px-4 py-2 text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer">
            {areAllCollapsed ? "Expand all" : "Collapse all"}
          </button>
        </div>
      </div>

      {isAddingModule && (
        <div className="border border-purple-200/50 bg-[#3C0078]/3 p-5 rounded-2xl flex flex-col gap-3">
          <h4 className="text-xs font-extrabold text-[#3C0078] uppercase tracking-wider">Create New Module Section</h4>
          <div className="flex gap-3">
            <input
              autoFocus
              type="text"
              placeholder="e.g. Week 2: Design Systems..."
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-[#3C0078]/40 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModule();
                if (e.key === "Escape") { setIsAddingModule(false); setCreateModuleError(""); }
              }}
            />
            <button onClick={handleAddModule} disabled={isCreatingModule} className="flex items-center gap-1.5 px-5 py-2 bg-[#3C0078] hover:bg-[#2A0054] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm">
              {isCreatingModule && <Loader size={12} className="animate-spin" />}
              {isCreatingModule ? "Creating..." : "Add Module"}
            </button>
            <button onClick={() => { setIsAddingModule(false); setCreateModuleError(""); }} disabled={isCreatingModule} className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 text-xs font-bold cursor-pointer disabled:opacity-60">
              Cancel
            </button>
          </div>
          {createModuleError && <p className="text-xs text-red-500 font-medium mt-1">{createModuleError}</p>}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {modules.map((mod) => (
          <div key={mod.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div onClick={() => toggleModule(mod.id)} className="flex items-center justify-between px-5 py-4 bg-gray-50/80 border-b border-gray-200 cursor-pointer select-none group">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span onClick={(e) => { e.stopPropagation(); toggleModule(mod.id); }} className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 p-1 hover:bg-gray-200 rounded-md">
                  {mod.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>

                {editingModuleId === mod.id ? (
                  <div className="flex-1 flex items-center gap-2 max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editingModuleTitle}
                      onChange={(e) => setEditingModuleTitle(e.target.value)}
                      className="flex-1 px-3 py-1 text-xs border border-purple-300 rounded-lg outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameModule(mod.id);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <button onClick={() => handleRenameModule(mod.id)} className="px-2.5 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer">Save</button>
                    <button onClick={() => setEditingModuleId(null)} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    {mod.prefix && <span className="text-sm font-extrabold text-gray-700 shrink-0">{mod.prefix}</span>}
                    <h3 className="text-xs font-black tracking-wider text-gray-700 uppercase truncate">{mod.title}</h3>
                    <span
                      onClick={(e) => { e.stopPropagation(); setEditingModuleId(mod.id); setEditingModuleTitle(mod.title); }}
                      className="text-[9px] text-[#3C0078] hover:underline font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0"
                    >
                      Rename
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div onClick={(e) => handleToggleModulePublish(mod.id, e)} title={mod.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"} className="flex items-center justify-center shrink-0 cursor-pointer">
                  {mod.isPublished ? <CheckCircle size={15} className="text-green-500 hover:scale-110 transition-transform" /> : <EyeOff size={15} className="text-gray-400 hover:scale-110 transition-transform" />}
                </div>
                <button onClick={() => setAddingItemTo(mod.id)} className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 text-[#3C0078] border border-purple-100 hover:bg-[#3C0078]/5 transition-all cursor-pointer">
                  <Plus size={11} /> <span>Add Item</span>
                </button>
                <button onClick={(e) => handleDeleteModule(mod.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-all cursor-pointer opacity-0 group-hover:opacity-100" title="Delete Module">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {addingItemTo === mod.id && (
              <div className="p-4 bg-purple-50/30 border-b border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-[#3C0078] uppercase tracking-wider">Add Module Item</h4>
                  <button onClick={() => setAddingItemTo(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"><X size={12} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Item title..."
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="md:col-span-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#3C0078]/40 transition-colors"
                  />
                  <select value={newItemType} onChange={(e) => setNewItemType(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer focus:border-[#3C0078]/40">
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="attachment">Attachment</option>
                  </select>
                </div>
                {newItemType === "link" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="isExternal" checked={isNewItemExternal} onChange={(e) => setIsNewItemExternal(e.target.checked)} className="rounded border-gray-300 text-[#3C0078] focus:ring-[#3C0078]" />
                    <label htmlFor="isExternal" className="text-[10px] font-bold text-gray-500 cursor-pointer">Open in New Window (External Link)</label>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => handleAddItem(mod.id)} className="px-4 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#2A0054] transition-all cursor-pointer">Add Item</button>
                  <button onClick={() => setAddingItemTo(null)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                </div>
              </div>
            )}

            {mod.isOpen && (
              <div className="flex flex-col">
                {mod.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 font-medium bg-gray-50/10">No items in this module section</div>
                ) : (
                  mod.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3.5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors group/item">
                      <div className="flex-1 flex items-center gap-3.5 min-w-0">
                        <span className="text-gray-400 shrink-0">
                          {item.type === "attachment" && <Paperclip size={14} />}
                          {item.type === "document" && <FileText size={14} />}
                          {item.type === "link" && <LinkIcon size={14} />}
                        </span>

                        {editingItemId === item.id && editingItemModuleId === mod.id ? (
                          <div className="flex items-center gap-2 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={editingItemLabel}
                              onChange={(e) => setEditingItemLabel(e.target.value)}
                              className="flex-1 px-3 py-1 text-xs border border-purple-300 rounded-lg outline-none font-medium"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameItem(mod.id, item.id);
                                if (e.key === "Escape") { setEditingItemId(null); setEditingItemModuleId(null); }
                              }}
                            />
                            <button onClick={() => handleRenameItem(mod.id, item.id)} className="px-2.5 py-1 bg-green-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer">Save</button>
                            <button onClick={() => { setEditingItemId(null); setEditingItemModuleId(null); }} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type === "link" ? (
                              <a href="#" onClick={(e) => { e.preventDefault(); alert(`Opening link: ${item.label}`); }} className="text-xs font-bold !text-blue-600 hover:underline flex items-center gap-1.5 min-w-0">
                                <span className="truncate">{item.label}</span>
                                {item.isExternal && <ExternalLink size={11} className="shrink-0" />}
                              </a>
                            ) : item.type === "document" ? (
                              <span className="text-xs font-bold text-gray-700 hover:text-[#3C0078] hover:underline truncate cursor-pointer" onClick={() => navigate(`/courses/${activeCourseId}/items/${item.id}`)}>
                                {item.label}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-gray-700 truncate cursor-pointer hover:text-gray-900" onClick={() => alert(`Downloading attachment: ${item.label}`)}>
                                {item.label}
                              </span>
                            )}
                            <span
                              onClick={() => { setEditingItemId(item.id); setEditingItemModuleId(mod.id); setEditingItemLabel(item.label); }}
                              className="text-[9px] text-[#3C0078] hover:underline font-bold opacity-0 group-hover/item:opacity-100 transition-opacity ml-1.5 cursor-pointer shrink-0"
                            >
                              Edit
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div onClick={() => handleToggleItemPublish(mod.id, item.id)} title={item.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"} className="flex items-center justify-center shrink-0 cursor-pointer">
                          {item.isPublished ? <CheckCircle size={15} className="text-green-500 hover:scale-110 transition-transform shadow-2xs" /> : <EyeOff size={15} className="text-gray-400 hover:scale-110 transition-transform" />}
                        </div>
                        <button onClick={() => handleDeleteItem(mod.id, item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-all opacity-0 group-hover/item:opacity-100 cursor-pointer shrink-0" title="Remove Item">
                          <X size={12} />
                        </button>
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
