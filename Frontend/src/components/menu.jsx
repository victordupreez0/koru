import React from "react";
import { motion } from "framer-motion";
import { MdDashboard, MdMenuBook, MdCalendarMonth, MdQueryStats } from "react-icons/md";
import NavItem from "./UI/navItem";

const navbarVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function Menu() {
  const navItems = [
    { label: "Home", href: "#home", icon: <MdDashboard className="h-6 w-6" aria-hidden="true" /> },
    { label: "Courses", href: "#courses", icon: <MdMenuBook className="h-6 w-6" aria-hidden="true" /> },
    { label: "Calendar", href: "#calendar", icon: <MdCalendarMonth className="h-6 w-6" aria-hidden="true" /> },
    { label: "Analytics", href: "#analytics", icon: <MdQueryStats className="h-6 w-6" aria-hidden="true" /> },
  ];

  return (
    <motion.div
      className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed top-4 left-1/2 -translate-x-1/2 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="navbar-start">
        <a className="py-2 px-3 mx-1 text-xl">Learn</a>
      </div>
      <div className="navbar-center flex">
        <motion.ul className="menu menu-horizontal px-1" variants={listVariants}>
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} variants={itemVariants} />
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}