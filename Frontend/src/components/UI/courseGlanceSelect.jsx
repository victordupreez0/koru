


const courses = [
    { code: "UX300", avatar: "UX", color: "btn-neutral" },
    { code: "DV300", avatar: "DV", color: "!bg-white" },
    { code: "VC300", avatar: "VC", color: "!bg-white" },
    { code: "PP300", avatar: "PP", color: "!bg-white" },
];

import { useState } from "react";

export default function CourseGlanceSelect() {
    const [active, setActive] = useState(courses[0].code);
    return (
        <div className="relative w-fit max-w-[350px] h-fit scrollbar-black">
            <div className="flex flex-row space-x-2 overflow-x-auto pr-8  pb-5 scrollbar-hide">
                {courses.map((course) => {
                    const isActive = active === course.code;
                    return (
                        <button
                            key={course.code}
                            className={`btn !rounded-full !border-transparent flex items-center !px-1 justify-between min-w-fit transition-colors duration-150 focus:outline-none focus:ring-0 active:outline-none active:ring-0
                                hover:shadow-md hover:!border-transparent
                                ${isActive ? "!bg-black !text-white" : "!bg-white !text-black"}`}
                            onClick={() => setActive(course.code)}
                        >
                            <span className="avatar avatar-placeholder">
                                <span className={`w-8 h-8 rounded-full flex items-center font-bold justify-center aspect-square overflow-hidden transition-colors duration-150
                                    ${isActive ? "bg-white text-black" : "bg-neutral text-neutral-content"}`}
                                >
                                    <span className="text-xs">{course.avatar}</span>
                                </span>
                            </span>
                            {course.code}
                        </button>
                    );
                })}
            </div>
            {/* Fade overlay */}
            <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-[#f5f5f5] to-transparent" />
        </div>
    );
}