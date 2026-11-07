import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "@solar-icons/react";
import { Plus, ChevronDown, ChevronRight, Loader, X, Paperclip, FileText, ExternalLink, Link as LinkIcon, EyeOff, MoreVertical, Copy, Pencil, Trash2 } from "lucide-react";
import { Alert, Button, Card, Input, Modal, Select } from "../../../components/UI";
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

  // openMenu: null | { type: 'module'|'item', id, modId?, top, right }
  const [openMenu, setOpenMenu] = useState(null);
  // deleteConfirm: null | { type: 'module', modId } | { type: 'item', modId, itemId }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  function openModuleMenu(e, modId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu(prev =>
      prev?.type === "module" && prev.id === modId ? null : {
        type: "module",
        id: modId,
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      }
    );
  }

  function openItemMenu(e, modId, itemId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu(prev =>
      prev?.type === "item" && prev.id === itemId ? null : {
        type: "item",
        id: itemId,
        modId,
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      }
    );
  }

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

  const handleDeleteModule = async (modId) => {
    setModules(prev => prev.filter(m => m.id !== modId));
    setDeleteConfirm(null);
    try {
      await deleteModule(modId);
    } catch (err) {
      console.error("Failed to delete module:", err);
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleDuplicateModule = async (modId) => {
    const mod = modules.find(m => m.id === modId);
    if (!mod || !activeCourseId) return;
    try {
      const created = await createModule({
        courseId: activeCourseId,
        title: `${mod.title} (Copy)`,
        isPublished: false,
        isOpen: true,
      });
      const newMod = { ...created, items: [] };
      for (const item of (mod.items ?? [])) {
        const createdItem = await createModuleItem({
          moduleId: created.id,
          label: item.label,
          type: item.type,
          isPublished: false,
          isExternal: item.isExternal ?? false,
        });
        newMod.items.push(createdItem);
      }
      setModules(prev => [...prev, newMod]);
    } catch (err) {
      console.error("Failed to duplicate module:", err);
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
    setModules(prev => prev.map(m => {
      if (m.id === modId) return { ...m, items: m.items.filter(i => i.id !== itemId) };
      return m;
    }));
    setDeleteConfirm(null);
    try {
      await deleteModuleItem(itemId);
    } catch (err) {
      console.error("Failed to delete item:", err);
      getCourseModules(activeCourseId).then(setModules).catch(console.error);
    }
  };

  const handleDuplicateItem = async (modId, itemId) => {
    const mod = modules.find(m => m.id === modId);
    const item = mod?.items?.find(i => i.id === itemId);
    if (!item) return;
    try {
      const created = await createModuleItem({
        moduleId: modId,
        label: `${item.label} (Copy)`,
        type: item.type,
        isPublished: false,
        isExternal: item.isExternal ?? false,
      });
      setModules(prev => prev.map(m => {
        if (m.id === modId) return { ...m, items: [...m.items, created] };
        return m;
      }));
    } catch (err) {
      console.error("Failed to duplicate item:", err);
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

  const menuItemClass =
    "flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-koru-on-surface transition-colors hover:bg-koru-surface-container focus-visible:bg-koru-surface-container focus-visible:outline-none";

  return (
    <div className="w-full flex flex-col gap-6 py-6 select-none">
      <div className="flex items-center justify-between gap-3 shrink-0 px-1">
        <h2 className="font-display text-koru-heading text-koru-on-surface">Course Modules Manager</h2>
        <div className="flex items-center gap-3">
          <Button size="sm" startIcon={<Plus size={14} />} onClick={() => setIsAddingModule(true)}>
            Add Section
          </Button>
          <Button size="sm" variant="outlined" onClick={toggleAll}>
            {areAllCollapsed ? "Expand all" : "Collapse all"}
          </Button>
        </div>
      </div>

      {isAddingModule && (
        <Card tone="brand" radius="lg" className="flex flex-col gap-3">
          <h4 className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-primary-container">Create New Module Section</h4>
          <div className="flex gap-3">
            <Input
              autoFocus
              type="text"
              size="sm"
              placeholder="e.g. Week 2: Design Systems..."
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              containerClassName="flex-1"
              aria-label="New module section title"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddModule();
                if (e.key === "Escape") { setIsAddingModule(false); setCreateModuleError(""); }
              }}
            />
            <Button size="md" onClick={handleAddModule} disabled={isCreatingModule} loading={isCreatingModule}>
              {isCreatingModule ? "Creating..." : "Add Section"}
            </Button>
            <Button size="md" variant="outlined" onClick={() => { setIsAddingModule(false); setCreateModuleError(""); }} disabled={isCreatingModule}>
              Cancel
            </Button>
          </div>
          {createModuleError && <Alert variant="error">{createModuleError}</Alert>}
        </Card>
      )}

      <div className="flex flex-col gap-5">
        {modulesLoading ? (
          [3, 2, 4].map((itemCount, i) => (
            <Card key={i} variant="outlined" tone="surface" padding="none" className="overflow-hidden animate-pulse motion-reduce:animate-none">
              <div className="flex items-center justify-between px-5 py-4 bg-koru-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-koru-xs bg-koru-surface-container-highest" />
                  <div className="h-3 rounded-koru-pill bg-koru-surface-container-highest" style={{ width: `${90 + i * 45}px` }} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 rounded-koru-pill bg-koru-surface-container-high w-20" />
                  <div className="h-7 rounded-koru-pill bg-koru-surface-container-high w-6" />
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {Array.from({ length: itemCount }, (_, j) => (
                  <div key={j} className="flex items-center gap-3 py-1">
                    <div className="w-4 h-4 rounded-koru-xs bg-koru-surface-container-high shrink-0" />
                    <div className="h-3 rounded-koru-pill bg-koru-surface-container-high" style={{ width: `${110 + j * 55}px` }} />
                  </div>
                ))}
              </div>
            </Card>
          ))
        ) : modules.map((mod) => (
          <Card key={mod.id} variant="outlined" tone="surface" padding="none" className="overflow-hidden">
            <div onClick={() => toggleModule(mod.id)} className="flex items-center justify-between px-5 py-4 bg-koru-surface-container cursor-pointer select-none group">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span onClick={(e) => { e.stopPropagation(); toggleModule(mod.id); }} className="text-koru-on-surface-variant transition-colors shrink-0 p-1 hover:bg-koru-surface-container-highest rounded-koru-xs">
                  {mod.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>

                {editingModuleId === mod.id ? (
                  <div className="flex-1 flex items-center gap-2 max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <Input
                      autoFocus
                      type="text"
                      size="sm"
                      value={editingModuleTitle}
                      onChange={(e) => setEditingModuleTitle(e.target.value)}
                      containerClassName="flex-1"
                      aria-label="Module title"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameModule(mod.id);
                        if (e.key === "Escape") setEditingModuleId(null);
                      }}
                    />
                    <Button size="sm" onClick={() => handleRenameModule(mod.id)}>Save</Button>
                    <Button size="sm" variant="outlined" onClick={() => setEditingModuleId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    {mod.prefix && <span className="text-sm font-medium text-koru-on-surface shrink-0">{mod.prefix}</span>}
                    <h3 className="font-display text-koru-label uppercase tracking-wider text-koru-on-surface truncate">{mod.title}</h3>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div onClick={(e) => handleToggleModulePublish(mod.id, e)} title={mod.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"} className="flex items-center justify-center shrink-0 cursor-pointer">
                  {mod.isPublished ? <CheckCircle size={15} className="text-koru-success hover:scale-110 motion-reduce:hover:scale-100 transition-transform" /> : <EyeOff size={15} className="text-koru-on-surface-variant hover:scale-110 motion-reduce:hover:scale-100 transition-transform" />}
                </div>
                <Button size="sm" variant="tonal" startIcon={<Plus size={11} />} onClick={() => setAddingItemTo(mod.id)}>
                  Add Item
                </Button>
                <button
                  onClick={(e) => openModuleMenu(e, mod.id)}
                  className="p-1.5 text-koru-on-surface-variant hover:text-koru-on-surface rounded-koru-sm hover:bg-koru-surface-container-high transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                  title="More options"
                  aria-label="More options"
                >
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>

            {addingItemTo === mod.id && (
              <div className="p-4 bg-koru-primary-subtle flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-koru-caption font-medium text-koru-on-primary-container uppercase tracking-wider">Add Section Item</h4>
                  <button onClick={() => setAddingItemTo(null)} aria-label="Close" className="p-1 text-koru-on-surface-variant hover:bg-koru-surface-container-high rounded-koru-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"><X size={12} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    autoFocus
                    type="text"
                    size="sm"
                    placeholder="Item title..."
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    containerClassName="md:col-span-2"
                    aria-label="Item title"
                  />
                  <Select size="sm" value={newItemType} onChange={(e) => setNewItemType(e.target.value)} aria-label="Item type">
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                    <option value="attachment">Attachment</option>
                  </Select>
                </div>
                {newItemType === "link" && (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="isExternal" checked={isNewItemExternal} onChange={(e) => setIsNewItemExternal(e.target.checked)} className="rounded-koru-xs accent-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus" />
                    <label htmlFor="isExternal" className="text-koru-caption font-medium text-koru-on-surface-variant cursor-pointer">Open in New Window (External Link)</label>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" onClick={() => handleAddItem(mod.id)}>Add Item</Button>
                  <Button size="sm" variant="outlined" onClick={() => setAddingItemTo(null)}>Cancel</Button>
                </div>
              </div>
            )}

            {mod.isOpen && (
              <div className="flex flex-col">
                {mod.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-koru-on-surface-variant font-medium">No items in this module section</div>
                ) : (
                  mod.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3.5 px-6 border-b border-koru-outline-faint last:border-b-0 hover:bg-koru-surface-container-low transition-colors group/item">
                      <div className="flex-1 flex items-center gap-3.5 min-w-0">
                        <span className="text-koru-on-surface-variant shrink-0">
                          {item.type === "attachment" && <Paperclip size={14} />}
                          {item.type === "document" && <FileText size={14} />}
                          {item.type === "link" && <LinkIcon size={14} />}
                        </span>

                        {editingItemId === item.id && editingItemModuleId === mod.id ? (
                          <div className="flex items-center gap-2 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                            <Input
                              autoFocus
                              type="text"
                              size="sm"
                              value={editingItemLabel}
                              onChange={(e) => setEditingItemLabel(e.target.value)}
                              containerClassName="flex-1"
                              aria-label="Item title"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameItem(mod.id, item.id);
                                if (e.key === "Escape") { setEditingItemId(null); setEditingItemModuleId(null); }
                              }}
                            />
                            <Button size="sm" onClick={() => handleRenameItem(mod.id, item.id)}>Save</Button>
                            <Button size="sm" variant="outlined" onClick={() => { setEditingItemId(null); setEditingItemModuleId(null); }}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type === "link" ? (
                              <a href="#" onClick={(e) => { e.preventDefault(); alert(`Opening link: ${item.label}`); }} className="text-xs font-medium !text-koru-info hover:underline flex items-center gap-1.5 min-w-0">
                                <span className="truncate">{item.label}</span>
                                {item.isExternal && <ExternalLink size={11} className="shrink-0" />}
                              </a>
                            ) : item.type === "document" ? (
                              <span className="text-xs font-medium text-koru-on-surface hover:text-koru-primary hover:underline truncate cursor-pointer" onClick={() => navigate(`/courses/${activeCourseId}/items/${item.id}`)}>
                                {item.label}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-koru-on-surface truncate cursor-pointer hover:text-koru-primary" onClick={() => alert(`Downloading attachment: ${item.label}`)}>
                                {item.label}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div onClick={() => handleToggleItemPublish(mod.id, item.id)} title={item.isPublished ? "Published (click to unpublish)" : "Draft (click to publish)"} className="flex items-center justify-center shrink-0 cursor-pointer">
                          {item.isPublished ? <CheckCircle size={15} className="text-koru-success hover:scale-110 motion-reduce:hover:scale-100 transition-transform" /> : <EyeOff size={15} className="text-koru-on-surface-variant hover:scale-110 motion-reduce:hover:scale-100 transition-transform" />}
                        </div>
                        <button
                          onClick={(e) => openItemMenu(e, mod.id, item.id)}
                          className="p-1 text-koru-on-surface-variant hover:text-koru-on-surface rounded-koru-xs hover:bg-koru-surface-container-high transition-all opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                          title="More options"
                          aria-label="More options"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Single fixed-position dropdown — never clips */}
      {openMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div
            className="fixed z-50 bg-koru-surface-container-lowest rounded-koru-md shadow-koru-md py-1 min-w-[150px]"
            style={{ top: openMenu.top, right: openMenu.right }}
          >
            {openMenu.type === "module" ? (
              <>
                <button
                  onClick={() => {
                    const mod = modules.find(m => m.id === openMenu.id);
                    setEditingModuleId(openMenu.id);
                    setEditingModuleTitle(mod?.title || "");
                    setOpenMenu(null);
                  }}
                  className={menuItemClass}
                >
                  <Pencil size={13} className="text-koru-on-surface-variant" /> Rename
                </button>
                <button
                  onClick={() => { handleDuplicateModule(openMenu.id); setOpenMenu(null); }}
                  className={menuItemClass}
                >
                  <Copy size={13} className="text-koru-on-surface-variant" /> Duplicate
                </button>
                <div className="my-1 border-t border-koru-outline-variant" />
                <button
                  onClick={() => { setDeleteConfirm({ type: "module", modId: openMenu.id }); setOpenMenu(null); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-koru-error transition-colors hover:bg-koru-error-container focus-visible:bg-koru-error-container focus-visible:outline-none"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    const mod = modules.find(m => m.id === openMenu.modId);
                    const item = mod?.items?.find(i => i.id === openMenu.id);
                    setEditingItemId(openMenu.id);
                    setEditingItemModuleId(openMenu.modId);
                    setEditingItemLabel(item?.label || "");
                    setOpenMenu(null);
                  }}
                  className={menuItemClass}
                >
                  <Pencil size={13} className="text-koru-on-surface-variant" /> Rename
                </button>
                <button
                  onClick={() => { handleDuplicateItem(openMenu.modId, openMenu.id); setOpenMenu(null); }}
                  className={menuItemClass}
                >
                  <Copy size={13} className="text-koru-on-surface-variant" /> Duplicate
                </button>
                <div className="my-1 border-t border-koru-outline-variant" />
                <button
                  onClick={() => { setDeleteConfirm({ type: "item", modId: openMenu.modId, itemId: openMenu.id }); setOpenMenu(null); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-koru-error transition-colors hover:bg-koru-error-container focus-visible:bg-koru-error-container focus-visible:outline-none"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        size="sm"
        title={deleteConfirm?.type === "module" ? "Delete section?" : "Delete item?"}
        description={
          deleteConfirm?.type === "module"
            ? "This will permanently remove the section and all its items. This cannot be undone."
            : "This will permanently remove this item. This cannot be undone."
        }
        footer={
          <>
            <Button variant="text" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={() => {
                if (deleteConfirm.type === "module") handleDeleteModule(deleteConfirm.modId);
                else handleDeleteItem(deleteConfirm.modId, deleteConfirm.itemId);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
