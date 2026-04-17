import React from "react";
import { motion } from "framer-motion";
import SideNavItem from "./UI/sideNavItem";

// Dummy course data - easier for linking to backend later
const COURSES = [
    {
        id: 1,
        label: "DV300",
        href: "/courses/1",
        code: "DV",
        number: "300"
    },
    {
        id: 2,
        label: "UX300",
        href: "/courses/2",
        code: "UX",
        number: "300"
    },
    {
        id: 3,
        label: "VC300",
        href: "/courses/3",
        code: "VC",
        number: "300"
    },
];

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
        <a
            href={course.href}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 border-black transition-all duration-300 ${
                isActive 
                ? "bg-black text-white" 
                : "bg-transparent text-black hover:bg-gray-100"
            }`}
        >
            <span className="text-sm font-bold leading-none">{course.code}</span>
            <span className="text-[10px] font-medium leading-none mt-0.5">{course.number}</span>
        </a>
    </motion.li>
);

/**
 * CourseMenu Component
 * 
 * Far-left sidebar specifically for switching between different courses.
 * Renders squared-off avatars for each enrolled course with active states.
 */
export default function CourseMenu() {

    return (
        <motion.div
            className="navbar bg-base-100/50 backdrop-blur-sm text-gray-400 w-fit rounded-full shadow-sm fixed left-4 top-1/2 -translate-y-1/2 z-50 p-2"
            variants={navbarVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="navbar-center flex flex-col items-center">
                <motion.ul className="flex flex-col items-center p-0 m-0 gap-4" variants={listVariants}>
                    {COURSES.map((course) => (
                        <CourseItem 
                            key={course.id} 
                            course={course} 
                            isActive={course.id === 2} // Simulating UX300 as active for now
                        />
                    ))}
                </motion.ul>
            </div>
        </motion.div>
    );
}


