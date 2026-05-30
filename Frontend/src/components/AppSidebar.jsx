import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Home,
  Book,
  Calendar,
  Stars,
  PieChart2,
  User,
  Settings,
  Eye,
  AddCircle,
} from "@solar-icons/react";
import { Menu as MenuIcon, X } from "lucide-react";
import { useCourses } from "../contexts/CoursesContext";
import { useAuth } from "../contexts/AuthContext";
import CourseManagerModal from "./courseManagerModal";

// ── Framer Motion Variants ──────────────────────────────────────────────────
const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const courseListVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const courseItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

// ── Sidebar Nav Item ────────────────────────────────────────────────────────
function SidebarNavItem({ label, href, icon, filledIcon, isActive, onClick }) {
  return (
    <motion.div variants={itemVariants}>
      <Link
        to={href}
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-0.5 w-full py-2 px-1 rounded-2xl transition-all duration-200 group select-none
          ${isActive
            ? "bg-[#3C0078] text-white shadow-lg shadow-[#3C0078]/25"
            : "text-gray-400 hover:text-[#3C0078] hover:bg-[#3C0078]/5"
          }`}
        aria-label={label}
      >
        <div className="flex items-center justify-center w-6 h-6">
          {isActive && filledIcon ? filledIcon : icon}
        </div>
        <span className="text-[9px] font-semibold leading-tight tracking-wide">{label}</span>
      </Link>
    </motion.div>
  );
}

// ── Course Avatar (inside sidebar) ──────────────────────────────────────────
function CourseAvatar({ course, isActive, onClick }) {
  return (
    <motion.div variants={courseItemVariants}>
      <Link
        to={course.href}
        onClick={onClick}
        style={{
          backgroundColor: isActive ? course.color : "transparent",
          borderColor: course.color,
          color: isActive ? "#FFFFFF" : course.color,
        }}
        className={`flex flex-col items-center justify-center w-11 h-11 rounded-full border-2 transition-all duration-300 ${
          isActive ? "shadow-md scale-105" : "hover:bg-gray-50 hover:scale-105"
        }`}
        title={course.subjectName}
      >
        <span className="text-[10px] font-bold leading-none">{course.code}</span>
        <span className="text-[8px] font-bold leading-none mt-0.5">{course.number}</span>
      </Link>
    </motion.div>
  );
}

// ── Main AppSidebar Component ───────────────────────────────────────────────
export default function AppSidebar() {
  const location = useLocation();
  const { role } = useAuth();
  const { visibleCourses } = useCourses();
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar in iframe mode or on public routes
  const isIframeMode = window.self !== window.top;
  const hideNav = new URLSearchParams(location.search).get("hideNav") === "true";
  const publicRoutes = ["/", "/student/login", "/teacher/login", "/admin/login"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isIframeMode || hideNav || isPublicRoute) return null;

  // Check if we're on a courses page to show course avatars
  const isOnCourses = location.pathname.startsWith("/courses");

  // Primary navigation items
  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: <Home weight="Outline" size={22} color="currentColor" />,
      filledIcon: <Home weight="Bold" size={22} color="currentColor" />,
    },
    {
      label: "Courses",
      href: "/courses",
      icon: <Book weight="Outline" size={22} color="currentColor" />,
      filledIcon: <Book weight="Bold" size={22} color="currentColor" />,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: <Calendar weight="Outline" size={22} color="currentColor" />,
      filledIcon: <Calendar weight="Bold" size={22} color="currentColor" />,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: <PieChart2 weight="Outline" size={22} color="currentColor" />,
      filledIcon: <PieChart2 weight="Bold" size={22} color="currentColor" />,
    },
    {
      label: "Assistant",
      href: "/teacherassistant",
      icon: <Stars weight="Outline" size={22} color="currentColor" />,
      filledIcon: <Stars weight="Bold" size={22} color="currentColor" />,
    },
  ];

  // Utility items (bottom)
  const utilityItems = [
    ...(role === "admin"
      ? []
      : [
          {
            label: "Profile",
            href: "/profile",
            icon: <User weight="Outline" size={22} color="currentColor" />,
            filledIcon: <User weight="Bold" size={22} color="currentColor" />,
          },
        ]),
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings weight="Outline" size={22} color="currentColor" />,
      filledIcon: <Settings weight="Bold" size={22} color="currentColor" />,
    },
  ];

  const isActive = (href) =>
    href === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(href);

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <motion.aside
      className={`fixed left-0 top-0 h-screen w-[76px] bg-white/80 backdrop-blur-xl border-r border-gray-200/50 z-50 flex flex-col
        ${mobileOpen ? "translate-x-0" : ""}
        max-md:shadow-2xl`}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Logo ── */}
      <div className="pt-5 pb-3 flex items-center justify-center">
        <Link to="/dashboard" className="group" aria-label="Home">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3C0078] to-[#7B2FBE] flex items-center justify-center shadow-lg shadow-[#3C0078]/20 group-hover:shadow-[#3C0078]/40 transition-shadow duration-300 overflow-hidden">
            <img
              src="/fav.png"
              alt="Learn Online"
              className="w-8 h-8 object-contain"
            />
          </div>
        </Link>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex-1 flex flex-col items-center gap-0.5 px-2 pt-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <LayoutGroup>
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.label}
              {...item}
              isActive={isActive(item.href)}
              onClick={closeMobile}
            />
          ))}
        </LayoutGroup>

        {/* ── Course Avatars (contextual, only on /courses/*) ── */}
        <AnimatePresence>
          {isOnCourses && visibleCourses.length > 0 && (
            <motion.div
              className="flex flex-col items-center gap-1.5 w-full py-2"
              variants={courseListVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Subtle divider */}
              <div className="w-8 h-px bg-gray-200 mb-1" />

              {visibleCourses.map((course) => (
                <CourseAvatar
                  key={course.id}
                  course={course}
                  isActive={
                    location.pathname.startsWith(course.href) ||
                    (location.pathname === "/courses" && visibleCourses[0].id === course.id)
                  }
                  onClick={closeMobile}
                />
              ))}

              {/* Teacher: Add course button */}
              {role === "teacher" && (
                <button
                  onClick={() => console.log("Add new course logic here")}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-green-500 hover:text-green-600 hover:bg-green-50 transition-all cursor-pointer"
                  title="Add New Course"
                >
                  <AddCircle size={20} />
                </button>
              )}

              {/* Manage courses button */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-[#3C0078] hover:bg-gray-100 transition-all cursor-pointer"
                title="Manage Enrolled Courses"
              >
                <Eye size={20} />
              </button>

              {/* Subtle divider */}
              <div className="w-8 h-px bg-gray-200 mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-gray-200/80" />

      {/* ── Utility Nav (Profile / Settings) ── */}
      <div className="py-3 flex flex-col items-center gap-0.5 px-2">
        {utilityItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            {...item}
            isActive={isActive(item.href)}
            onClick={closeMobile}
          />
        ))}
      </div>
    </motion.aside>
  );

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        className="fixed top-4 left-4 z-[60] md:hidden w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg flex items-center justify-center text-gray-600 hover:text-[#3C0078] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Desktop: always visible | Mobile: conditionally visible ── */}
      <div className={`max-md:${mobileOpen ? "block" : "hidden"} md:block`}>
        {sidebarContent}
      </div>

      {/* ── Course Manager Modal ── */}
      <CourseManagerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
