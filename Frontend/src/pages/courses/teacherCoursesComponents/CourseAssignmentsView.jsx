import React from "react";
import { Plus, X, Eye, EyeOff, Edit2, Trash2, Folder, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ASSIGNMENT_TYPES, 
    ASSIGNMENT_GROUPS_DATA, 
    GRADE_DISPLAY_OPTIONS, 
    SUBMISSION_TYPE_OPTIONS, 
    ASSIGN_TO_OPTIONS,
    staggerContainer,
    slideUp
} from "./constants";

function AssignmentTypeIcon({ type, size = 18 }) {
    const found = ASSIGNMENT_TYPES.find(t => t.id === type);
    if (!found) return null;
    const Icon = found.icon;
    return (
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${found.bg}`} title={found.label}>
            <Icon size={size} style={{ color: found.color }} />
        </span>
    );
}

function CreateAssignmentDrawer({ onClose, onSave, initialData }) {
    const isEditing = !!initialData;
    const [form, setForm] = React.useState({
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        type: initialData?.type ?? "online",
        points: initialData?.points ?? 100,
        gradeDisplay: initialData?.gradeDisplay ?? "Percentage",
        submissionType: initialData?.submissionType ?? "Online",
        assignedTo: initialData?.assignedTo ?? "Everyone",
        dueDate: initialData?.dueDate ?? "",
        availableFrom: initialData?.availableFrom ?? "",
        availableUntil: initialData?.availableUntil ?? "",
        published: initialData?.published ?? false,
        group: initialData?.group ?? "g1",
        id: initialData?.id ?? null,
        submissions: initialData?.submissions ?? 0,
        totalStudents: initialData?.totalStudents ?? 26,
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (publish) => {
        if (!form.title.trim()) return;
        const payload = { ...form, published: publish };
        if (!isEditing) payload.id = `a_${Date.now()}`;
        onSave(payload);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
                style={{ borderRadius: "40px 0 0 40px" }}
            >
                {/* Drawer Header */}
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit Assignment" : "Create Assignment"}</h2>
                        <p className="text-sm text-gray-400 mt-1">Fill in the details below</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <X size={22} />
                    </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">

                    {/* Assignment Type */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Assignment Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {ASSIGNMENT_TYPES.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleChange("type", t.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-center transition-all ${
                                            form.type === t.id
                                                ? "border-[#3C0078] bg-[#3C0078]/5"
                                                : "border-gray-100 hover:border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${t.bg}`}>
                                            <Icon size={18} style={{ color: t.color }} />
                                        </span>
                                        <span className={`text-[10px] font-bold leading-tight ${form.type === t.id ? "text-[#3C0078]" : "text-gray-500"}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Title</label>
                        <input
                            type="text"
                            placeholder="Assignment title..."
                            value={form.title}
                            onChange={e => handleChange("title", e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Instructions / Description</label>
                        <textarea
                            rows={4}
                            placeholder="Write the assignment instructions here..."
                            value={form.description}
                            onChange={e => handleChange("description", e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {/* Points & Grade Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Points</label>
                            <input
                                type="number"
                                min={0}
                                value={form.points}
                                onChange={e => handleChange("points", parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Grade Display</label>
                            <select
                                value={form.gradeDisplay}
                                onChange={e => handleChange("gradeDisplay", e.target.value)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all appearance-none"
                            >
                                {GRADE_DISPLAY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Submission Type & Assignees */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Submission Type</label>
                            <select
                                value={form.submissionType}
                                onChange={e => handleChange("submissionType", e.target.value)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all appearance-none"
                            >
                                {SUBMISSION_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assign To</label>
                            <select
                                value={form.assignedTo}
                                onChange={e => handleChange("assignedTo", e.target.value)}
                                className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all appearance-none"
                            >
                                {ASSIGN_TO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Assignment Group */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assignment Group</label>
                        <select
                            value={form.group}
                            onChange={e => handleChange("group", e.target.value)}
                            className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-transparent transition-all appearance-none"
                        >
                            {ASSIGNMENT_GROUPS_DATA.map(g => (
                                <option key={g.id} value={g.id}>{g.name} ({g.weight}%)</option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">Dates</label>
                        <div className="bg-gray-50 rounded-[28px] p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={form.dueDate}
                                    onChange={e => handleChange("dueDate", e.target.value)}
                                    className="w-full bg-white rounded-2xl px-5 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Available From</label>
                                    <input
                                        type="datetime-local"
                                        value={form.availableFrom}
                                        onChange={e => handleChange("availableFrom", e.target.value)}
                                        className="w-full bg-white rounded-2xl px-4 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Available Until</label>
                                    <input
                                        type="datetime-local"
                                        value={form.availableUntil}
                                        onChange={e => handleChange("availableUntil", e.target.value)}
                                        className="w-full bg-white rounded-2xl px-4 py-3 text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3C0078]/20 border border-gray-100 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="px-10 py-6 border-t border-gray-100 flex gap-3 shrink-0">
                    <button
                        onClick={() => handleSubmit(false)}
                        className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        {isEditing ? "Save as Draft" : "Save as Draft"}
                    </button>
                    <button
                        onClick={() => handleSubmit(true)}
                        className="flex-1 py-4 rounded-2xl bg-[#3C0078] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2A0054] transition-all shadow-lg shadow-[#3C0078]/20 flex items-center justify-center gap-2"
                    >
                        <Eye size={16} /> {isEditing ? "Save & Publish" : "Publish"}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function AssignmentGroupRow({ group, onTogglePublish, onDelete, onEdit }) {
    const [expanded, setExpanded] = React.useState(true);

    return (
        <motion.div variants={slideUp} className="mb-6">
            {/* Group Header */}
            <div
                className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-[24px] cursor-pointer hover:bg-gray-100 transition-colors mb-3"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 transition-transform" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>
                        <ChevronDown size={18} />
                    </span>
                    <span className="font-bold text-gray-900 text-base">{group.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {group.weight}% of grade
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {group.assignments.length} assignment{group.assignments.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Assignment Rows */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                    >
                        {group.assignments.map(item => {
                            const typeInfo = ASSIGNMENT_TYPES.find(t => t.id === item.type);
                            const Icon = typeInfo?.icon || Folder;
                            const submissionPct = item.totalStudents > 0
                                ? Math.round((item.submissions / item.totalStudents) * 100)
                                : 0;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className="bg-white border border-gray-100 rounded-[28px] px-7 py-5 flex items-center gap-5 hover:shadow-lg hover:border-[#3C0078]/10 transition-all group"
                                >
                                    {/* Type icon */}
                                    <span className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-2xl ${typeInfo?.bg || "bg-gray-100"}`}>
                                        <Icon size={18} style={{ color: typeInfo?.color || "#64748B" }} />
                                    </span>

                                    {/* Title + meta */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors truncate">
                                                {item.title}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                                {typeInfo?.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-5 mt-1.5 text-xs text-gray-400 flex-wrap">
                                            <span>{item.points} pts · {item.gradeDisplay}</span>
                                            <span>Assign to: {item.assignedTo}</span>
                                            {item.dueDate && (
                                                <span>Due: {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission progress */}
                                    <div className="shrink-0 flex flex-col items-end gap-1 min-w-[90px]">
                                        <span className="text-xs font-bold text-gray-700">{item.submissions}/{item.totalStudents} submitted</span>
                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3C0078] rounded-full transition-all"
                                                style={{ width: `${submissionPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Published toggle */}
                                    <button
                                        onClick={() => onTogglePublish(group.id, item.id)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                                            item.published
                                                ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
                                                : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                        }`}
                                        title={item.published ? "Click to unpublish" : "Click to publish"}
                                    >
                                        {item.published ? <Eye size={14} /> : <EyeOff size={14} />}
                                        {item.published ? "Published" : "Draft"}
                                    </button>

                                    {/* Edit */}
                                    <button
                                        onClick={() => onEdit(group.id, item.id)}
                                        className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-[#3C0078] hover:bg-[#3C0078]/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Edit assignment"
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => onDelete(group.id, item.id)}
                                        className="shrink-0 p-2 rounded-xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function CourseAssignmentsView({ subject }) {
    const [groups, setGroups] = React.useState(ASSIGNMENT_GROUPS_DATA);
    const [showDrawer, setShowDrawer] = React.useState(false);
    const [editingAssignment, setEditingAssignment] = React.useState(null);
    const [activeTypeFilter, setActiveTypeFilter] = React.useState("all");

    const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0);
    const totalAssignments = groups.reduce((sum, g) => sum + g.assignments.length, 0);
    const publishedCount = groups.reduce((sum, g) => sum + g.assignments.filter(a => a.published).length, 0);

    const handleTogglePublish = (groupId, assignmentId) => {
        setGroups(prev => prev.map(g =>
            g.id !== groupId ? g : {
                ...g,
                assignments: g.assignments.map(a =>
                    a.id !== assignmentId ? a : { ...a, published: !a.published }
                )
            }
        ));
    };

    const handleDelete = (groupId, assignmentId) => {
        setGroups(prev => prev.map(g =>
            g.id !== groupId ? g : {
                ...g,
                assignments: g.assignments.filter(a => a.id !== assignmentId)
            }
        ));
    };

    const handleEdit = (groupId, assignmentId) => {
        const group = groups.find(g => g.id === groupId);
        const assignment = group?.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            setEditingAssignment({ ...assignment, group: groupId });
            setShowDrawer(true);
        }
    };

    const handleSave = (savedAssignment) => {
        if (editingAssignment) {
            // Update existing
            setGroups(prev => prev.map(g => ({
                ...g,
                assignments: g.assignments.map(a =>
                    a.id !== savedAssignment.id ? a : { ...a, ...savedAssignment }
                )
            })));
        } else {
            // Add new
            setGroups(prev => prev.map(g =>
                g.id !== savedAssignment.group ? g : {
                    ...g,
                    assignments: [...g.assignments, savedAssignment]
                }
            ));
        }
        setEditingAssignment(null);
        setShowDrawer(false);
    };

    const filteredGroups = activeTypeFilter === "all"
        ? groups
        : groups.map(g => ({
            ...g,
            assignments: g.assignments.filter(a => a.type === activeTypeFilter)
        })).filter(g => g.assignments.length > 0);

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>

            {/* Header */}
            <motion.header variants={slideUp} className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-gray-500 mt-2">{subject?.code || "Module"} | Manage Assessments & Briefs</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={18} /> Archive
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowDrawer(true)}
                        className="bg-[#3C0078] text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#3C0078]/20"
                    >
                        <Plus size={18} /> Create Assignment
                    </motion.button>
                </div>
            </motion.header>

            {/* Summary Stats */}
            <motion.div variants={slideUp} className="grid grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Total Assignments", value: totalAssignments, accent: false },
                    { label: "Published", value: publishedCount, accent: true },
                    { label: "Drafts", value: totalAssignments - publishedCount, accent: false },
                    { label: "Total Weight", value: `${totalWeight}%`, accent: false },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-[28px] px-7 py-6 flex flex-col gap-1 ${stat.accent ? "bg-[#3C0078] text-white" : "bg-white border border-gray-100 shadow-sm"}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${stat.accent ? "text-white/60" : "text-gray-400"}`}>{stat.label}</span>
                        <span className={`text-4xl font-black italic ${stat.accent ? "text-white" : "text-gray-900"}`}>{stat.value}</span>
                    </div>
                ))}
            </motion.div>

            {/* Assignment Type Overview Cards */}
            <motion.div variants={slideUp} className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Assignment Types</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {ASSIGNMENT_TYPES.map(t => {
                        const Icon = t.icon;
                        const count = groups.reduce((sum, g) => sum + g.assignments.filter(a => a.type === t.id).length, 0);
                        const isActive = activeTypeFilter === t.id;
                        return (
                            <motion.button
                                key={t.id}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveTypeFilter(isActive ? "all" : t.id)}
                                className={`flex flex-col items-start gap-3 p-5 rounded-[24px] border-2 text-left transition-all ${
                                    isActive
                                        ? "border-[#3C0078] bg-[#3C0078]/5 shadow-md"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${t.bg}`}>
                                    <Icon size={20} style={{ color: t.color }} />
                                </span>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isActive ? "text-[#3C0078]" : "text-gray-500"}`}>
                                        {t.label}
                                    </p>
                                    <p className="text-2xl font-black italic text-gray-900 mt-1">{count}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* All filter pill */}
            {activeTypeFilter !== "all" && (
                <motion.div variants={slideUp} className="mb-6 flex items-center gap-3">
                    <span className="text-sm text-gray-500">Filtering by:</span>
                    <button
                        onClick={() => setActiveTypeFilter("all")}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3C0078]/10 text-[#3C0078] font-bold text-xs uppercase tracking-widest hover:bg-[#3C0078]/20 transition-all"
                    >
                        {ASSIGNMENT_TYPES.find(t => t.id === activeTypeFilter)?.label}
                        <X size={14} />
                    </button>
                </motion.div>
            )}

            {/* Assignment Groups */}
            <motion.div variants={slideUp}>
                <div className="mb-5">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Assignment Groups</h2>
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-gray-100 text-gray-400 font-medium">
                        No assignments match this filter.
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <AssignmentGroupRow
                            key={group.id}
                            group={group}
                            onTogglePublish={handleTogglePublish}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))
                )}
            </motion.div>

            {/* Create / Edit Assignment Drawer */}
            {showDrawer && (
                <CreateAssignmentDrawer
                    onClose={() => { setShowDrawer(false); setEditingAssignment(null); }}
                    onSave={handleSave}
                    initialData={editingAssignment}
                />
            )}
        </motion.div>
    );
}
