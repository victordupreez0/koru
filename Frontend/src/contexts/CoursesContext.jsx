import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getStudentCourses, getTeacherCourses } from "../services/courseService";

const CoursesContext = createContext();

export function useCourses() {
    return useContext(CoursesContext);
}

export function CoursesProvider({ children }) {
    const { user } = useAuth();
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize hidden courses out of localStorage, or default to empty
    const [hiddenCourseIds, setHiddenCourseIds] = useState(() => {
        try {
            const stored = localStorage.getItem("learnonline_hidden_courses");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        let mounted = true;
        async function fetchCourses() {
            if (!user?.userId || (user.role !== "student" && user.role !== "teacher")) {
                setLoading(false);
                setAllCourses([]);
                return;
            }

            try {
                setLoading(true);
                let mappedCourses = [];
                if (user.role === "student") {
                    const data = await getStudentCourses(user.userId);
                    mappedCourses = data.map(enrollment => ({
                        id: enrollment.course.id,
                        enrollmentId: enrollment.id,
                        subjectName: enrollment.course.subject.name,
                        label: enrollment.course.subject.code, // e.g. UX300
                        code: enrollment.course.subject.code.substring(0, 2), // e.g. UX
                        number: enrollment.course.subject.code.substring(2), // e.g. 300
                        term: enrollment.course.term,
                        description: enrollment.course.subject.description,
                        color: "#3C0078", // Default brand color for now
                        href: `/courses/${enrollment.course.id}`
                    }));
                } else if (user.role === "teacher") {
                    const data = await getTeacherCourses(user.userId);
                    mappedCourses = data.map(course => ({
                        id: course.id,
                        subjectName: course.subject.name,
                        label: course.subject.code, // e.g. UX300
                        code: course.subject.code.substring(0, 2), // e.g. UX
                        number: course.subject.code.substring(2), // e.g. 300
                        term: course.term,
                        description: course.subject.description,
                        color: "#FF8731", // Using a different default color or just a standard one
                        href: `/courses/${course.id}`
                    }));
                }

                if (mounted) setAllCourses(mappedCourses);
            } catch (err) {
                console.error("Failed to load courses for Context:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchCourses();
        return () => { mounted = false; };
    }, [user?.userId, user?.role]);

    // Derived state: calculate the visible courses mathematically
    const visibleCourses = allCourses.filter(course => !hiddenCourseIds.includes(course.id));

    // Expose a method to toggle the hidden state of a course
    const toggleCourseVisibility = (courseId) => {
        setHiddenCourseIds(prev => {
            let updatedList;
            if (prev.includes(courseId)) {
                // If it's already hidden, remove it from the hidden list (make visible)
                updatedList = prev.filter(id => id !== courseId);
            } else {
                // If it's visible, add it to the hidden list (make hidden)
                updatedList = [...prev, courseId];
            }
            
            // Persist locally so it remembers across refreshes
            localStorage.setItem("learnonline_hidden_courses", JSON.stringify(updatedList));
            return updatedList;
        });
    };

    const value = {
        allCourses,
        visibleCourses,
        loading,
        hiddenCourseIds,
        toggleCourseVisibility
    };

    return (
        <CoursesContext.Provider value={value}>
            {children}
        </CoursesContext.Provider>
    );
}
