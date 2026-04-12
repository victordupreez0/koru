import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

// Course Glance widget – left column on the dashboard
// Shows a course selector at the top and a detail card below
// The detail card displays todo items, the next class, and announcements
export default function CourseGlance() {
    return (
        <>
        <div className="w-[350px]">
            {/* Section heading */}
            <div className="text-2xl mt-5 mb-2 ">
                <h2>Course Glance</h2>
            </div>

            {/* Animated pill buttons – tap to switch the active course */}
            <CourseGlanceSelect />

            {/* Detail card with todo, next class & announcements for the selected course */}
            <CourseGlanceDisplay />
        </div>
        </>
    );
}