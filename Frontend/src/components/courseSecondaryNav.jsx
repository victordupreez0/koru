import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Plus, X, Trash2 } from "lucide-react";

const INITIAL_NAV_ITEMS = [
    { label: "Home", pathSuffix: "", end: true },
    { label: "Announcements", pathSuffix: "/announcements" },
    { label: "Assignments", pathSuffix: "/assignments" },
    { label: "Modules", pathSuffix: "/modules" },
    { label: "Notes", pathSuffix: "/notes" },
    { label: "Grades", pathSuffix: "/grades" },
    { label: "Attendance", pathSuffix: "/attendance" },
];

/**
 * CourseSecondaryNav Component
 */
export default function CourseSecondaryNav({ activeCourseId }) {
    const { role } = useAuth();
    const isTeacher = role === "teacher";
    const [navItems, setNavItems] = useState(INITIAL_NAV_ITEMS);
    const [isAdding, setIsAdding] = useState(false);
    const [newItemLabel, setNewItemLabel] = useState("");

    // Generate the base link using the newly introduced ID
    const basePath = activeCourseId ? `/courses/${activeCourseId}` : "/courses";

    const addItem = () => {
        if (newItemLabel.trim()) {
            const suffix = `/${newItemLabel.toLowerCase().replace(/\s+/g, '-')}`;
            setNavItems([...navItems, { label: newItemLabel, pathSuffix: suffix }]);
            setNewItemLabel("");
            setIsAdding(false);
        }
    };

    const removeItem = (label) => {
        setNavItems(navItems.filter(item => item.label !== label));
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-44 py-8 flex flex-col gap-1 overflow-hidden"
        >
            <ul className="flex flex-col">
                <AnimatePresence>
                    {navItems.map((item, index) => (
                        <motion.li
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.05 }}
                            className="list-none group relative"
                        >
                            <NavLink
                                to={item.pathSuffix ? `${basePath}${item.pathSuffix}` : basePath}
                                end={item.end}
                                className={({ isActive }) => 
                                    `relative flex items-center gap-3 px-4 py-1.5 text-sm font-medium transition-all duration-200 border-l-2 ${
                                        isActive 
                                        ? "!text-[#3C0078] dark:!text-[#9BE9EA] border-[#3C0078] dark:border-[#9BE9EA] font-bold bg-[#3C0078]/5 dark:bg-[#9BE9EA]/10" 
                                        : "!text-gray-500 dark:!text-white/80 border-transparent hover:!text-[#3C0078] dark:hover:!text-[#9BE9EA] hover:bg-[#3C0078]/5 dark:hover:bg-[#9BE9EA]/10"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <div className="flex items-center w-full justify-between">
                                        <span className="truncate">{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            {isTeacher && item.label !== "Home" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeItem(item.label);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 
                                                    dark:text-white-500
                                                    hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeBall"
                                                    className="w-1.5 h-1.5 rounded-full bg-[#3C0078] dark:bg-[#9BE9EA]"
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 30
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </NavLink>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {isTeacher && (
                <div className="mt-4 px-4">
                    {isAdding ? (
                        <div className="flex flex-col gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Link name..."
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-black/10 dark:border-slate-600 rounded-lg px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-slate-400 transition-colors dark:text-slate-200 dark:placeholder-slate-500"
                                value={newItemLabel}
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addItem();
                                    if (e.key === "Escape") setIsAdding(false);
                                }}
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={addItem}
                                    className="flex-1 py-1.5 bg-[#3C0078] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#2A0054] transition-colors"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="p-1.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-black/10 dark:border-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:border-black/30 dark:hover:border-slate-400 hover:text-black dark:hover:text-slate-200 transition-all"
                        >
                            <Plus size={14} /> Add Link
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
