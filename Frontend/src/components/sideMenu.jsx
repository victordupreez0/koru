import React from "react";
import { motion } from "framer-motion";
import {
  MdPerson,
  MdSettings,
} from "react-icons/md";
import NavItem from "./UI/navItem";

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

export default function SideMenu() {

  const footerItems = [
    { label: "Profile", href: "#profile", icon: <MdPerson className="h-6 w-6" aria-hidden="true" /> },
    { label: "Settings", href: "#settings", icon: <MdSettings className="h-6 w-6" aria-hidden="true" /> },
  ];

  return (
    <motion.div
      className="navbar bg-base-100 text-gray-400 w-fit rounded-full shadow-sm fixed bottom-4 left-4 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="navbar-center flex">
        <motion.ul className="menu menu-vertical" variants={listVariants}>
          {footerItems.map((item) => (
            <NavItem key={item.label} {...item} variants={itemVariants} />
          ))}
        </motion.ul>
      </div>
    </motion.div>
  );
}