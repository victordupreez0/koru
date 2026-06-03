import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useCourses } from "../contexts/CoursesContext";
import {
    Home,
    Megaphone,
    ClipboardList,
    Layers,
    Notebook,
    Award,
    CalendarCheck,
    FileText,
    Plus,
    X,
    Trash2,
} from "lucide-react";

const INITIAL_NAV_ITEMS = [
    { label: "Home", pathSuffix: "", end: true },
    { label: "Announcements", pathSuffix: "announcements" },
    { label: "Assignments", pathSuffix: "assignments" },
    { label: "Modules", pathSuffix: "modules" },
    { label: "Notes", pathSuffix: "notes" },
    { label: "Grades", pathSuffix: "grades" },
    { label: "Attendance", pathSuffix: "attendance" },
];

const ICON_MAP = {
    Home: Home,
    Announcements: Megaphone,
    Assignments: ClipboardList,
    Modules: Layers,
    Notes: Notebook,
    Grades: Award,
    Attendance: CalendarCheck,
};

function getIcon(label) {
    const IconComponent = ICON_MAP[label] || FileText;
    return <IconComponent size={15} />;
}

export default function CourseSecondaryNav({ activeCourseId, hideNav }) {
    const { role } = useAuth();
    const { visibleCourses } = useCourses();
    const isTeacher = role === "teacher";
    
    const [navItems, setNavItems] = useState(INITIAL_NAV_ITEMS);
    const [isPublished, setIsPublished] = useState(true);

    // Fetch active course details
    const course = visibleCourses.find(c => c.id === activeCourseId) || visibleCourses[0] || null;

    // Generate base link
    const queryAppend = hideNav ? "?hideNav=true" : "";

    const removeItem = (label) => {
        setNavItems(navItems.filter(item => item.label !== label));
    };

    if (hideNav) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col shrink-0 transition-all duration-300
              md:h-full md:w-64 md:bg-white/70 md:backdrop-blur-xl md:border md:border-white/20 md:rounded-[28px] md:shadow-lg md:overflow-hidden
              max-md:h-full max-md:w-64 max-md:bg-white/80 max-md:backdrop-blur-md max-md:border-r max-md:border-gray-200/50"
        >
            {/* Course Header Info */}
            {course && (
                <div className="px-6 pt-6 pb-5 border-b border-gray-100 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div 
                            style={{ backgroundColor: course.color }} 
                            className="px-2 py-0.5 rounded-lg text-white font-black text-[9px] uppercase tracking-wider shadow-sm"
                        >
                            {course.code}
                        </div>
                        <span className="text-[10px] font-extrabold text-gray-400 tracking-wider">
                            {course.code} {course.number}
                        </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 leading-snug mt-1 truncate" title={course.subjectName}>
                        {course.subjectName}
                    </h3>
                </div>
            )}

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto pt-4 pb-6 scrollbar-hide">
                <ul className="flex flex-col gap-0.5">
                    <AnimatePresence>
                        {navItems.map((item, index) => {
                            const showQuery = queryAppend && !item.pathSuffix.includes('?');
                            const toPath = item.pathSuffix 
                                ? `/courses/${activeCourseId}/${item.pathSuffix}${showQuery ? queryAppend : ""}`
                                : `/courses/${activeCourseId}${queryAppend}`;
                            
                            return (
                                <motion.li
                                    key={item.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="list-none group relative"
                                >
                                    <NavLink
                                        to={toPath}
                                        end={item.end}
                                        className={({ isActive }) =>
                                            `relative flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all duration-200 mx-3 my-0.5 rounded-xl group select-none cursor-pointer
                                            ${isActive
                                                ? "bg-[#3C0078]/5 text-[#3C0078]"
                                                : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Left Accent indicator dot */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeSecondaryLeftAccent"
                                                        className="absolute left-0 top-1/4 bottom-1/4 w-0.75 bg-[#3C0078] rounded-r-md shrink-0"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 300,
                                                            damping: 30
                                                        }}
                                                    />
                                                )}

                                                <span className={`transition-colors shrink-0 ${isActive ? "text-[#3C0078]" : "text-gray-400 group-hover:text-gray-600"}`}>
                                                    {getIcon(item.label)}
                                                </span>
                                                
                                                <span className="flex-1 truncate !text-inherit">{item.label}</span>
                                                
                                                {isTeacher && item.label !== "Home" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            removeItem(item.label);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all shrink-0 cursor-pointer"
                                                        title="Remove Link"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                                
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeSecondaryDot"
                                                        className="w-1.5 h-1.5 rounded-full bg-[#3C0078] shrink-0"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 300,
                                                            damping: 30
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>


            </div>

            {/* Teacher controls footer */}
            {isTeacher && (
                <div className="p-4 border-t border-gray-100 flex flex-col gap-3 bg-gray-50/50 shrink-0">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-gray-500">Course Status</span>
                        <button
                            onClick={() => setIsPublished(!isPublished)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs
                                ${isPublished 
                                    ? "bg-green-50 text-green-600 border border-green-200/50 hover:bg-green-100/50" 
                                    : "bg-amber-50 text-amber-600 border border-amber-200/50 hover:bg-amber-100/50"
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                            <span>{isPublished ? "Published" : "Draft"}</span>
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
