import React from "react";
import { motion } from "framer-motion";
import { SpeedometerLow, Book, Calendar, PieChart2 } from "@solar-icons/react";

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
    { label: "Home", href: "/", icon: <SpeedometerLow weight="Outline" size={24} color="currentColor" /> },
    { label: "Courses", href: "/courses", icon: <Book weight="Outline" size={24} color="currentColor" /> },
    { label: "Calendar", href: "/calendar", icon: <Calendar weight="Outline" size={24} color="currentColor" /> },
    { label: "Analytics", href: "/analytics", icon: <PieChart2 weight="Outline" size={24} color="currentColor" /> },
  ];

  return (
    <motion.div
      className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed top-4 left-1/2 -translate-x-1/2 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* <div className="navbar-start">
        <a className="py-2 px-3 mx-1 text-xl">Learn</a>
      </div> */}
      <div className="navbar-center flex">
        <motion.ul className="menu menu-horizontal p-0 m-0" variants={listVariants}>
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} variants={itemVariants} />
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}