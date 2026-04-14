import React from "react";
import CourseNavItem from "./courseNavItem";

const SECONDARY_NAV_ITEMS = [
    { label: "Home", href: "/courses" },
    { label: "Announcements", href: "/courses/announcements" },
    { label: "Assignments", href: "/courses/assignments" },
    { label: "Modules", href: "/courses/modules" },
    { label: "Grades", href: "/courses/grades" },
    { label: "Attendance", href: "/courses/attendance" },
];

/**
 * CourseSecondaryNav Component
 * 
 * Second-tier navigation bar specific to the currently selected course.
 * Includes items like Home, Announcements, Modules, etc.
 * Uses CourseNavItem to render links with active state indicators (black line).
 */
export default function CourseSecondaryNav() {
    return (
        <div className="w-48 py-8 flex flex-col gap-2">
            <ul className="flex flex-col">
                {SECONDARY_NAV_ITEMS.map((item) => (
                    <CourseNavItem 
                        key={item.label} 
                        label={item.label} 
                        href={item.href} 
                    />
                ))}
            </ul>
        </div>
    );
}
