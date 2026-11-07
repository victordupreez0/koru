import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCourseAssignments } from "../../../services/assignmentService";
import { getStudentSubmissions } from "../../../services/submissionService";
import { getStudentGrades } from "../../../services/gradeService";
import { useAuth } from "../../../contexts/AuthContext";
import { Badge, Card, Skeleton } from "../../../components/UI";
import { staggerContainer, slideUp } from "./constants";

export default function CourseGradesView({ subject, activeCourseId }) {
    const { user } = useAuth();
    const [gradesData, setGradesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avgGrade, setAvgGrade] = useState("-");

    useEffect(() => {
        let mounted = true;
        async function fetchGrades() {
            if (!activeCourseId || !user?.userId) return;
            try {
                setLoading(true);
                const [assignments, submissions, grades] = await Promise.all([
                    getCourseAssignments(activeCourseId),
                    getStudentSubmissions(user.userId),
                    getStudentGrades(user.userId)
                ]);

                let totalPoints = 0;
                let earnedPoints = 0;

                const mapped = assignments.map(a => {
                    const sub = submissions.find(s => s.assignmentId === a.id);
                    const grade = sub ? grades.find(g => g.submissionId === sub.id && g.isReleased) : null;
                    const pendingGrade = sub ? grades.find(g => g.submissionId === sub.id && !g.isReleased) : null;

                    let status = "Pending";
                    let gradeText = "-";
                    const weight = a.maxPoints ? `${a.maxPoints} pts` : "N/A";

                    if (grade) {
                        status = "Graded";
                        gradeText = `${Math.round((grade.pointsEarned / a.maxPoints) * 100)}%`;
                        totalPoints += a.maxPoints;
                        earnedPoints += grade.pointsEarned;
                    } else if (pendingGrade) {
                        status = "Pending Release";
                    } else if (sub) {
                        status = "Submitted";
                    } else if (new Date(a.dueDate) < new Date()) {
                        status = "Late";
                        gradeText = "0%";
                    }

                    return {
                        id: a.id,
                        name: a.title,
                        date: new Date(a.dueDate).toLocaleDateString(),
                        weight,
                        status,
                        grade: gradeText
                    };
                });

                if (mounted) {
                    setGradesData(mapped);
                    if (totalPoints > 0) {
                        setAvgGrade(`${((earnedPoints / totalPoints) * 100).toFixed(1)}%`);
                    } else {
                        setAvgGrade("-");
                    }
                }
            } catch (err) {
                console.error("Failed to load grades:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchGrades();
        return () => { mounted = false; };
    }, [activeCourseId, user?.userId]);

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6">
                <h1 className="font-display text-koru-title text-koru-on-surface">Grades</h1>
                <p className="text-koru-body text-koru-on-surface-variant mt-2">{subject?.code || ""} | Academic Performance Overview</p>
            </motion.header>
            <motion.div variants={slideUp}>
              <Card variant="outlined" tone="surface" padding="none" radius="2xl" className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-koru-outline-faint bg-koru-surface-container-low">
                            <th className="px-6 py-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">Assignment Name</th>
                            <th className="px-6 py-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">Points</th>
                            <th className="px-6 py-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">Status</th>
                            <th className="px-6 py-3 text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant text-right">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-koru-outline-faint">
                                        <td className="px-6 py-3.5">
                                            <Skeleton variant="rect" className="h-4 mb-1.5" width={`${55 + (i * 19) % 40}%`} />
                                            <Skeleton variant="text" className="w-20" />
                                        </td>
                                        <td className="px-6 py-3.5"><Skeleton variant="rect" className="h-4 w-14" /></td>
                                        <td className="px-6 py-3.5"><Skeleton variant="rect" className="h-5 w-20" /></td>
                                        <td className="px-6 py-3.5 text-right"><Skeleton variant="rect" className="h-4 w-10 ml-auto" /></td>
                                    </tr>
                                ))}
                            </>
                        ) : gradesData.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-6 text-koru-on-surface-variant">No grades found.</td></tr>
                        ) : (
                            gradesData.map((item) => (
                                <motion.tr key={item.id} variants={slideUp} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container-low transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div className="font-medium text-koru-on-surface text-sm">{item.name}</div>
                                        <div className="text-xs text-koru-on-surface-variant mt-0.5">{item.date}</div>
                                    </td>
                                    <td className="px-6 py-3.5 text-xs text-koru-on-surface-variant">{item.weight}</td>
                                    <td className="px-6 py-3.5">
                                        <Badge variant={item.status === "Graded" ? "success" : item.status === "Late" ? "error" : item.status === "Pending Release" ? "info" : "warning"}>{item.status}</Badge>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className="text-sm font-medium text-koru-on-surface">{item.grade}</span>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
              </Card>
            </motion.div>
            <motion.div variants={slideUp} className="mt-6 flex justify-end">
                <div className="bg-koru-primary text-koru-on-primary px-6 py-4 rounded-koru-2xl shadow-koru-md flex items-center gap-12">
                    <div className="flex flex-col">
                        <span className="text-koru-caption uppercase font-medium tracking-[0.2em] opacity-80">Current Average</span>
                        <span className="font-display text-koru-title">{avgGrade}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
