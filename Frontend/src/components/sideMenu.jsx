import React from "react";
import { motion } from "framer-motion";
import { User, Settings } from "@solar-icons/react";
import SideNavItem from "./UI/sideNavItem";

// Framer Motion variants – the sidebar slides in from the left on load
const navbarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// Container variant – staggers its children (the side nav items)
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

// Individual side nav item entrance animation
const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

// Side navigation bar – floating pill fixed to the bottom-left corner
// Houses utility links like Profile and Settings
export default function SideMenu() {

  // Links shown in the side menu
  const footerItems = [
    { label: "Profile", href: "/dashboard", icon: <User weight="Outline" size={24} color="currentColor" /> },
    { label: "Settings", href: "/settings", icon: <Settings weight="Outline" size={24} color="currentColor" /> },
  ];

  return (
    <motion.div
      className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed bottom-4 left-4 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Vertical list of side navigation items */}
      <div className="navbar-center flex">
        <motion.ul className="menu menu-vertical p-1 m-0" variants={listVariants}>
          {footerItems.map((item) => (
            <SideNavItem key={item.label} {...item} variants={itemVariants} />
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}