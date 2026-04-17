import React from "react";
import { useLocation } from "react-router-dom";
import { motion, LayoutGroup } from "framer-motion";
import { SpeedometerLow, Book, Calendar, PieChart2 } from "@solar-icons/react";

import NavItem from "./UI/navItem";

// Framer Motion variants for the staggered entrance animation
// The navbar fades in and slides down, then each nav item staggers in
const navbarVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// Container variant – staggers its children (the nav items) one after another
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

// Individual nav item entrance animation
const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// Top navigation bar – floating pill centred at the top of the viewport
// Contains icon-based links for the main pages of the app
export default function Menu() {
  // Each item maps to a route defined in App.jsx
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <SpeedometerLow weight="Outline" size={24} color="currentColor" /> },
    { label: "Courses", href: "/courses", icon: <Book weight="Outline" size={24} color="currentColor" /> },
    { label: "Calendar", href: "/calendar", icon: <Calendar weight="Outline" size={24} color="currentColor" /> },
    { label: "Analytics", href: "/analytics", icon: <PieChart2 weight="Outline" size={24} color="currentColor" /> },
  ];

  const location = useLocation();

  return (
    <motion.div
      className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed top-4 left-1/2 -translate-x-1/2 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="navbar-center flex">
        <LayoutGroup>
          <motion.ul className="menu menu-horizontal p-0 m-0" variants={listVariants}>
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                variants={itemVariants}
                isActive={
                  item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href)
                }
              />
            ))}
          </motion.ul>
        </LayoutGroup>
      </div>
    </motion.div>
  );
}