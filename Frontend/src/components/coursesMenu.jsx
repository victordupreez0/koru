import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import SideNavItem from "./UI/sideNavItem";
import { useCourses } from "../contexts/CoursesContext";
import CourseManagerModal from "./courseManagerModal";
import { Eye, AddCircle } from "@solar-icons/react";
import { useAuth } from "../contexts/AuthContext";

// Framer Motion variants matching SideMenu.jsx
const navbarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -6 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const CourseItem = ({ course, isActive }) => (
    <motion.li variants={itemVariants} className="list-none">
        <Link
            to={course.href}
            style={{
                backgroundColor: isActive ? course.color : "transparent",
                borderColor: course.color,
                color: isActive ? "#FFFFFF" : course.color
            }}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 ${isActive
                ? "shadow-md"
                : "hover:bg-gray-50"
                }`}
        >
            <span className="text-sm font-bold opacity-100 leading-none">{course.code}</span>
            <span className="text-[10px] font-bold opacity-100 leading-none mt-0.5">{course.number}</span>
        </Link>
    </motion.li>
);

/**
 * CourseMenu Component
 * 
 * Far-left sidebar specifically for switching between different courses.
 * Renders squared-off avatars for each enrolled course with active states.
 */
export default function CourseMenu() {
    const location = useLocation();
    const { visibleCourses } = useCourses();
    const [modalOpen, setModalOpen] = useState(false);
    const { role } = useAuth();

    return (
        <>
            <motion.div
                className="navbar bg-white/80 backdrop-blur-md w-fit rounded-[40px] shadow-lg fixed left-4 top-1/2 -translate-y-1/2 z-40 p-2 py-2 border border-[#3C0078]/10"
                variants={navbarVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="navbar-center flex flex-col items-center gap-4">
                    <motion.ul className="flex flex-col items-center p-0 m-0 gap-2" variants={listVariants}>
                        {visibleCourses.length > 0 ? (
                            visibleCourses.map((course) => (
                                <CourseItem
                                    key={course.id}
                                    course={course}
                                    isActive={location.pathname.startsWith(course.href) || (location.pathname === "/courses" && visibleCourses[0].id === course.id)}
                                />
                            ))
                        ) : (
                            <li className="text-xs text-gray-400 font-bold p-2 text-center w-14">No Classes</li>
                        )}
                    </motion.ul>

                    {/* View all courses separator and trigger button */}
                    <div className="w-8 h-px bg-gray-200 mt-2 mb-1"></div>

                    {role === "teacher" && (
                        <button
                            onClick={() => console.log("Add new course logic here")}
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-green-500 hover:text-green-600 hover:bg-green-50 transition-all cursor-pointer mb-2"
                            title="Add New Course"
                        >
                            <AddCircle size={24} />
                        </button>
                    )}

                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-gray-400 hover:text-[#3C0078] hover:bg-gray-100 transition-all cursor-pointer"
                        title="Manage Enrolled Courses"
                    >
                        <Eye size={24} />
                    </button>
                </div>
            </motion.div>

            {/* Injected pop up modal for managing all courses locally */}
            <CourseManagerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}


