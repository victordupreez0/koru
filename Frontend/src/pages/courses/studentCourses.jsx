import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCourses } from "../../contexts/CoursesContext";
import CourseMenu from "../../components/coursesMenu";
import CourseSecondaryNav from "../../components/courseSecondaryNav";
import SideMenu from "../../components/sideMenu";
import Menu from "../../components/menu";
import AssignmentDetail from "./assignmentDetail";

import {
    CourseAnnouncementsView,
    CourseAssignmentsView,
    CourseAttendanceView,
    CourseGradesView,
    CourseHomeView,
    CourseModulesView,
    CourseNotesView,
} from "./studentCoursesComponents";

/**
 * Courses Page Component
 *
 * Supports two main views based on current path:
 * 1. Home (/courses)
 * 2. Modules (/courses/modules)
 */
export default function StudentCourses() {
    const location = useLocation();
    const navigate = useNavigate();
    const { visibleCourses, loading } = useCourses();

    // The route matches /courses/:courseId/:subpage 
    // E.g. pathParts = ["courses", "dfg897-...", "grades"]
    const pathParts = location.pathname.split('/').filter(Boolean);
    const activeCourseId = pathParts.length > 1 ? pathParts[1] : null;

    // React Router Guard: If the user navigates merely to /courses without specifying an ID, 
    // we drop them smoothly into the first available course.
    useEffect(() => {
        if (!loading && visibleCourses.length > 0) {
            const courseExistsInList = visibleCourses.find(c => c.id === activeCourseId);
            if (!activeCourseId || !courseExistsInList) {
                navigate(`/courses/${visibleCourses[0].id}`, { replace: true });
            }
        }
    }, [loading, visibleCourses, activeCourseId, navigate]);

    // Build the resolved standard course object
    const course = visibleCourses.find(c => c.id === activeCourseId) || visibleCourses[0] || null;
    const subject = course ? {
        name: course.subjectName,
        code: course.label,
        description: course.description
    } : null;

    // Normalize sub-path checks based on the end of the URL
    const path = location.pathname;

    const isGradesPage = path.endsWith("/grades");
    const isAnnouncementsPage = path.endsWith("/announcements");
    const isAssignmentsPage = path.endsWith("/assignments");
    const isAttendancePage = path.endsWith("/attendance");
    const isModulesPage = path.endsWith("/modules");
    const isNotesPage = path.endsWith("/notes");


    // Home logic: If we are at /courses or /courses/:id NOT ending in a sub-path
    // Assignment detail: /courses/:courseId/assignments/:assignmentId
    const isAssignmentDetailPage = pathParts[2] === "assignments" && pathParts.length === 4;
    const activeAssignmentId = isAssignmentDetailPage ? pathParts[3] : null;

    const isHomePage = !isGradesPage && !isAnnouncementsPage && !isAssignmentsPage && !isAttendancePage && !isModulesPage && !isNotesPage && !isAssignmentDetailPage;

    return (
        <div className="flex overflow-hidden -ml-30 -mr-20 -mt-24" style={{ height: '100vh' }}>
            {/* The global top menu that was previously disappearing */}
            <Menu />

            {/* Leftmost Course Navigation Bar — CourseMenu is fixed, so this div is just a spacer */}
            <div className="w-16 shrink-0 flex flex-col h-full items-center">
                <CourseMenu />
                <SideMenu />
            </div>

            {/* Middle Section: Second Navigation Bar for course-internal links */}
            <div className="flex flex-col h-full py-1 justify-center">
                <CourseSecondaryNav activeCourseId={activeCourseId || (visibleCourses[0]?.id)} />
            </div>

            {/* Main Content Area — pt-24 clears the fixed top nav */}
            <div className="flex-1 flex flex-col pt-24 px-8 overflow-y-auto">
                {isAssignmentDetailPage ? (
                    <AssignmentDetail assignmentId={activeAssignmentId} activeCourseId={activeCourseId} />
                ) : isGradesPage ? (
                    <CourseGradesView subject={subject} activeCourseId={activeCourseId} />
                ) : isAnnouncementsPage ? (
                    <CourseAnnouncementsView activeCourseId={activeCourseId} />
                ) : isAssignmentsPage ? (
                    <CourseAssignmentsView subject={subject} activeCourseId={activeCourseId} />
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
