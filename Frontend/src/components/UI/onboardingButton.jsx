import React from "react";
import { Link } from "react-router-dom";

const defaultRoutes = {
    student: "/student/login",
    teacher: "/teacher/login",
    admin: "/admin/login",
};

export default function OnboardingButton({ role, icon, to }) {
    const key = (role || "").toLowerCase();
    const destination = to || defaultRoutes[key] || "/";

    return (
        <Link
            to={destination}
            className="group flex aspect-square w-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/20 bg-[#3C0078acc] text-white shadow-xl backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-[#9BE9EA] hover:bg-[#9BE9EA] sm:w-[220px] md:w-[250px]"
        >
            <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white/10">
                <img
                    src={icon}
                    alt={`${role} icon`}
                    className="h-14 w-14 object-contain sm:h-17 sm:w-17"
                />
            </div>

            <span className="text-center text-sm font-semibold sm:text-base">
                {role}
            </span>
        </Link>
    );
}