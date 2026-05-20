import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCourses } from "../../contexts/CoursesContext";
import CourseMenu from "../../components/coursesMenu";
import CourseSecondaryNav from "../../components/courseSecondaryNav";
import SideMenu from "../../components/sideMenu";
import Menu from "../../components/menu";

import {
    CourseAnnouncementsView,
    CourseAssignmentsView,
    CourseAttendanceView,
    CourseGradesView,
    CourseHomeView,
    CourseModulesView,
    CourseNotesView,
} from "./teacherCoursesComponents";

/**
 * TeacherCourses Component
 * 
 * Main shell for the teacher's course view.
 * Refactored into modular sub-views located in ./teacherCoursesComponents/
 */
export default function TeacherCourses() {
    const location = useLocation();
    const navigate = useNavigate();
    const { visibleCourses, loading } = useCourses();

    // Check for hideNav in URL and persist it
    const hideNav = React.useMemo(() => {
        return new URLSearchParams(location.search).get("hideNav") === "true";
    }, [location.search]);

    // The route matches /courses/:courseId/:subpage 
    // E.g. pathParts = ["courses", "dfg897-...", "grades"]
    const pathParts = location.pathname.split('/').filter(Boolean);
    const activeCourseId = pathParts.length > 1 ? pathParts[1] : null;

    // React Router Guard: If the user navigates merely to /courses without specifying an ID, 
    // or if they are on a course but no specific sub-page is active, ensure we default to home.
    useEffect(() => {
        if (!loading && visibleCourses.length > 0) {
            const courseExistsInList = visibleCourses.find(c => c.id === activeCourseId);
            
            if (!activeCourseId || !courseExistsInList) {
                // Redirect to the first course's home if no valid course ID is present
                const targetPath = `/courses/${visibleCourses[0].id}${hideNav ? '?hideNav=true' : ''}`;
                navigate(targetPath, { replace: true });
            } else if (location.pathname === `/courses/${activeCourseId}` && !location.pathname.endsWith('/')) {
                // Ensure the path conceptually works for matching if needed, though usually just defining isHomePage is enough
            }
        }
    }, [loading, visibleCourses, activeCourseId, navigate, hideNav, location.pathname]);

    // Build the resolved standard course object
    const course = visibleCourses.find(c => c.id === activeCourseId) || visibleCourses[0] || null;
    const subject = course ? {
        name: course.subjectName,
        code: course.label,
        description: course.description
    } : null;
    
    // Normalize sub-path checks based on the end of the URL
    // We check for exact matches to the sub-routes to determine if we are NOT on home
    const path = location.pathname.toLowerCase();
    const coursePath = `/courses/${activeCourseId}`.toLowerCase();
    
    const isGradesPage = path.includes(`${coursePath}/grades`);
    const isAnnouncementsPage = path.includes(`${coursePath}/announcements`);
    const isAssignmentsPage = path.includes(`${coursePath}/assignments`);
    const isAttendancePage = path.includes(`${coursePath}/attendance`);
    const isModulesPage = path.includes(`${coursePath}/modules`);
    const isNotesPage = path.includes(`${coursePath}/notes`);
    
    // Home logic: Strictly defined as being on the base course URL exactly
    const isHomePage = path === coursePath || path === `${coursePath}/`;

    // Check if we are in a preview modal to optimize performance
    const isPreview = new URLSearchParams(window.location.search).get("viewAs") === "teacher";

    return (
        <div className={`flex h-screen overflow-hidden ${(isPreview || hideNav) ? 'bg-white' : ''} ${hideNav ? "" : "-ml-30 -mr-20 -mt-24"}`}>
            {!isPreview && !hideNav && (
                <>
                    {/* The global top menu */}
                    <Menu />
                    
                    {/* Leftmost Course Navigation Bar */}
                    <div className="w-16 shrink-0 flex flex-col h-full items-center">
                        <CourseMenu />

                        <div className="mt-auto">
                            <SideMenu />
                        </div>
                    </div>
                </>
            )}

      {/* Middle Section: Second Navigation Bar for course-internal links */}
      <div className="flex flex-col h-full py-1 justify-center">
        <CourseSecondaryNav activeCourseId={activeCourseId || (visibleCourses[0]?.id)} />
      </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${(isPreview || hideNav) ? 'pt-4' : 'pt-24'} overflow-y-auto`}>
            {isGradesPage ? (
                <CourseGradesView activeCourseId={activeCourseId} />
            ) : isAnnouncementsPage ? (
                <CourseAnnouncementsView activeCourseId={activeCourseId} />
            ) : isAssignmentsPage ? (
                <CourseAssignmentsView subject={subject} />
            ) : isAttendancePage ? (
                <CourseAttendanceView />
            ) : isModulesPage ? (
                <CourseModulesView />
            ) : isNotesPage ? (
                <CourseNotesView activeCourseId={activeCourseId} />
            ) : (
                <CourseHomeView subject={subject} course={course} loading={loading} />
            )}
            </div>
        </div>
    );
}
