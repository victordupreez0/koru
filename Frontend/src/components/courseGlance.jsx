import CourseGlanceDisplay from "./courseGlanceDisplay";
import CourseGlanceSelect from "./UI/courseGlanceSelect";

export default function CourseGlance() {
    return (
        <>
        <div className="w-full">
        <div className="text-2xl mt-5 mb-2 ">
                <h2>Course Glance</h2>
            </div>
            <CourseGlanceSelect />
            <CourseGlanceDisplay />
        </div>
        </>
    );
}