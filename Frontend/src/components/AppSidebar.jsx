import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import KoruLogo from "./UI/KoruLogo";
import {
  Home,
  Book,
  Calendar,
  Stars,
  PieChart2,
  Settings,
  Eye,
} from "@solar-icons/react";
import { Menu as MenuIcon, X } from "lucide-react";
import { useCourses } from "../contexts/CoursesContext";
import { useAuth } from "../contexts/AuthContext";
import CourseManagerModal from "./courseManagerModal";
import { Avatar, Button, EmptyState } from "./UI";

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

const secondarySidebarVariants = {
  hidden: { x: -280, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 32,
    },
  },
  exit: {
    x: -280,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 38,
    },
  },
};

const courseCardVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// ── Sidebar Nav Item ────────────────────────────────────────────────────────
function SidebarNavItem({
  label,
  href,
  icon,
  filledIcon,
  isActive,
  onClick,
  isButton = false,
  buttonRef,
  ariaExpanded,
}) {
  const content = (
    <>
      {isActive && (
        <motion.div
          layoutId="active-sidebar-pill"
          className="absolute inset-0 -z-10 rounded-koru-md bg-koru-primary shadow-koru-sm"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      )}
      <div className="flex items-center justify-center w-6 h-6 z-10 !text-inherit">
        {isActive && filledIcon ? filledIcon : icon}
      </div>
      <span className="z-10 mt-1 select-none text-[10px] font-medium leading-tight tracking-wide !text-inherit">{label}</span>
    </>
  );

  const baseClassName = `group relative flex w-full cursor-pointer select-none flex-col items-center justify-center rounded-koru-md px-1.5 py-3.5 transition-colors duration-200 ease-koru-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 focus-visible:ring-offset-koru-surface
    ${isActive
      ? "!text-koru-on-primary"
      : "!text-koru-on-surface-variant hover:bg-koru-primary/8 hover:!text-koru-primary"
    }`;

  return (
    <motion.div variants={itemVariants} className="w-full px-2 relative">
      {isButton ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={onClick}
          className={baseClassName}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={ariaExpanded}
        >
          {content}
        </button>
      ) : (
        <Link
          to={href}
          onClick={onClick}
          className={baseClassName}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          {content}
        </Link>
      )}
    </motion.div>
  );
}

// ── Main AppSidebar Component ───────────────────────────────────────────────
export default function AppSidebar() {
  const location = useLocation();
  const { role, user } = useAuth();
  const { visibleCourses } = useCourses();
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCourseNav, setShowCourseNav] = useState(false);

  const sidebarRef = useRef(null);
  const coursesButtonRef = useRef(null);

  // Close courses sidebar on click-outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showCourseNav &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        coursesButtonRef.current &&
        !coursesButtonRef.current.contains(event.target)
      ) {
        setShowCourseNav(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCourseNav]);

  // Hide sidebar in iframe mode or on public routes
  const isIframeMode = window.self !== window.top;
  const hideNav = new URLSearchParams(location.search).get("hideNav") === "true";
  const publicRoutes = ["/", "/student/login", "/teacher/login", "/admin/login"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isIframeMode || hideNav || isPublicRoute) return null;

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
            icon: <Avatar user={user} size="xs" />,
            filledIcon: <Avatar user={user} size="xs" className="ring-2 ring-koru-on-primary" />,
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

  const isActiveCourse = (courseId) => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const activeCourseId = pathParts.length > 1 ? pathParts[1] : null;
    return activeCourseId === courseId;
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <motion.aside
      className={`fixed z-50 flex flex-col items-center justify-between transition-all duration-300
        md:left-4 md:top-4 md:bottom-4 md:w-20 md:bg-koru-surface-container-lowest md:backdrop-blur-xl md:ring-1 md:ring-koru-outline-faint md:rounded-koru-lg md:shadow-koru-card md:py-5
        max-md:left-0 max-md:top-0 max-md:h-screen max-md:w-[76px] max-md:bg-koru-surface-container-lowest/95 max-md:backdrop-blur-2xl max-md:border-r max-md:border-koru-outline-faint max-md:py-3
        ${mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
        max-md:shadow-koru-lg`}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Logo ── */}
      <div className="pt-5 pb-3 flex items-center justify-center shrink-0">
        <Link
          to="/dashboard"
          className="group rounded-koru-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2"
          aria-label="Home"
        >
          <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <KoruLogo className="w-9 h-9" />
          </div>
        </Link>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex-1 flex flex-col items-center gap-1.5 w-full pt-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <LayoutGroup>
          {navItems.map((item) => {
            const isCourses = item.label === "Courses";
            return (
              <SidebarNavItem
                key={item.label}
                {...item}
                isActive={isActive(item.href)}
                isButton={isCourses}
                buttonRef={isCourses ? coursesButtonRef : undefined}
                ariaExpanded={isCourses ? showCourseNav : undefined}
                onClick={
                  isCourses
                    ? () => setShowCourseNav(!showCourseNav)
                    : () => {
                        setShowCourseNav(false);
                        closeMobile();
                      }
                }
              />
            );
          })}
        </LayoutGroup>
      </nav>

      {/* ── Divider ── */}
      <div className="my-1.5 h-px w-10 shrink-0 bg-koru-outline-variant/60" />

      {/* ── Utility Nav (Profile / Settings) ── */}
      <div className="py-2 flex flex-col items-center gap-1.5 w-full shrink-0">
        {utilityItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            {...item}
            isActive={isActive(item.href)}
            onClick={() => {
              setShowCourseNav(false);
              closeMobile();
            }}
          />
        ))}
      </div>
    </motion.aside>
  );

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        type="button"
        className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-koru-pill bg-koru-surface-container-lowest/90 text-koru-on-surface-variant shadow-koru-card ring-1 ring-koru-outline-faint backdrop-blur-xl transition-colors duration-150 ease-koru-out hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-koru-scrim backdrop-blur-sm md:hidden"
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

      {/* ── Secondary Collapsible Course Sidebar ── */}
      <AnimatePresence>
        {showCourseNav && (
          <motion.div
            ref={sidebarRef}
            variants={secondarySidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-40 flex flex-col pt-6 overflow-hidden transition-all duration-300
              md:left-[104px] md:top-4 md:bottom-4 md:w-72 md:bg-koru-surface-container-lowest md:backdrop-blur-2xl md:ring-1 md:ring-koru-outline-faint md:rounded-koru-lg md:shadow-koru-lg
              max-md:left-[76px] max-md:top-0 max-md:h-screen max-md:w-72 max-md:bg-koru-surface-container-lowest/95 max-md:backdrop-blur-2xl max-md:border-r max-md:border-koru-outline-faint max-md:shadow-koru-lg"
          >
            {/* Header */}
            <div className="flex flex-col gap-1 border-b border-koru-outline-faint px-5 pb-4">
              <h3 className="font-display text-koru-heading text-koru-on-surface">
                My Courses
              </h3>
              <p className="text-koru-caption text-koru-on-surface-variant">
                Select a course to view details
              </p>
            </div>

            {/* Scrollable Course Cards List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-hide">
              {visibleCourses.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={<Book weight="Outline" size={24} color="currentColor" />}
                  title="No courses enrolled"
                />
              ) : (
                visibleCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    variants={courseCardVariants}
                    className="w-full"
                  >
                    <Link
                      to={course.href}
                      onClick={() => {
                        setShowCourseNav(false);
                        closeMobile();
                      }}
                      aria-current={isActiveCourse(course.id) ? "page" : undefined}
                      className={`group flex select-none items-center gap-3 rounded-koru-lg p-3 transition-colors duration-200 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus
                        ${isActiveCourse(course.id)
                          ? "bg-koru-primary-container/60"
                          : "bg-transparent hover:bg-koru-surface-container"
                        }`}
                    >
                      {/* Dynamic Colored Badge */}
                      <div
                        style={{ backgroundColor: course.color }}
                        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-koru-md text-koru-on-primary shadow-koru-xs transition-transform duration-200 ease-koru-out group-hover:scale-105"
                      >
                        <span className="text-koru-caption font-medium leading-none">{course.code}</span>
                        <span className="text-[8px] font-medium leading-none mt-0.5">{course.number}</span>
                      </div>

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate text-koru-label text-koru-on-surface transition-colors group-hover:text-koru-primary">
                          {course.subjectName}
                        </h4>
                        <p className="mt-0.5 truncate text-koru-caption text-koru-on-surface-variant">
                          {course.description || `${course.code} ${course.number}`}
                        </p>
                      </div>

                      {/* Indicator dot */}
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors
                        ${isActiveCourse(course.id) ? "bg-koru-primary" : "bg-transparent group-hover:bg-koru-outline-variant"}`}
                      />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer / Actions */}
            <div className="flex flex-col gap-2 border-t border-koru-outline-faint bg-koru-surface-container-low p-4">
              <Button
                variant="tonal"
                fullWidth
                startIcon={<Eye size={16} />}
                onClick={() => {
                  setModalOpen(true);
                  setShowCourseNav(false);
                }}
              >
                Manage Courses
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Course Manager Modal ── */}
      <CourseManagerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
