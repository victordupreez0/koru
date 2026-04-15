import React from "react";
import { motion } from "framer-motion";
import SideNavItem from "./UI/sideNavItem";

// Dummy course data - easier for linking to backend later
const COURSES = [
    {
        id: 1,
        label: "DV300",
        href: "/courses/1",
        icon: (
            <div className="flex flex-col items-center justify-center bg-base-200 w-11 h-11 rounded-xl">
                <span className="text-sm font-bold -mb-1">DV</span>
                <span className="text-[10px] opacity-70">300</span>
            </div>
        )
    },
    {
        id: 2,
        label: "UX300",
        href: "/courses/2",
        icon: (
            <div className="flex flex-col items-center justify-center bg-base-200 w-15 h-11 ">
                <span className="text-sm font-bold -mb-1">UX</span>
                <span className="text-[10px] opacity-70">300</span>
            </div>
        )
    },
    {
        id: 3,
        label: "VC300",
        href: "/courses/3",
        icon: (
            <div className="flex flex-col items-center justify-center bg-base-200 w-11 h-11 rounded-xl">
                <span className="text-sm font-bold -mb-1">VC</span>
                <span className="text-[10px] opacity-70">300</span>
            </div>
        )
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

/**
 * CourseMenu Component
 * 
 * A vertical navigation bar that lists enrolled courses.
 * Uses a constant COURSES for easy backend data linking.
 * Each item is rendered as a squared-off icon with stacked text (Course Code over Year/Level).
 */
export default function CourseMenu() {

    return (
        <motion.div
            className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed left-4 top-1/2 -translate-y-1/2 z-50"
            variants={navbarVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="navbar-center flex flex-col items-center">
                <motion.ul className="menu menu-vertical p-1 m-0 gap-2" variants={listVariants}>
                    {COURSES.map((course) => (
                        <SideNavItem
                            key={course.id}
                            label={course.label}
                            href={course.href}
                            icon={course.icon}
                            variants={itemVariants}
                        />
                    ))}
                </motion.ul>
            </div>
        </motion.div>
    )


}
