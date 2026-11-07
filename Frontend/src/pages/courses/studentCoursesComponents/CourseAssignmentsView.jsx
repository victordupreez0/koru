import React from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "@solar-icons/react";
import { motion } from "framer-motion";
import { Badge, Button, Card, EmptyState, Skeleton } from "../../../components/UI";
import { getCourseAssignments } from "../../../services/assignmentService";
import { getStudentSubmissions } from "../../../services/submissionService";
import { getStudentGrades } from "../../../services/gradeService";
import { useAuth } from "../../../contexts/AuthContext";
import { staggerContainer, slideUp } from "./constants";

export default function CourseAssignmentsView({ subject, activeCourseId }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignments, setAssignments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const computeStatusInfo = (item, submission, grade) => {
        // Only show Graded status when grade has been released to the student
        if (grade && grade.isReleased) {
            return {
                status: 'Graded',
                variant: 'primary',
                rank: 5,
                isGraded: true,
                gradePercent: Math.round((grade.pointsEarned / item.maxPoints) * 100)
            };
        }
        if (submission) {
            return { status: 'Submitted', variant: 'success', rank: 4, isSubmitted: true };
        }
        if (item.isClosed) return { status: 'Closed', variant: 'neutral', rank: 3, isClosed: true };

        const now = new Date();
        const due = new Date(item.dueDate);
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);

        if (diffDays < 0) return { status: 'Late', variant: 'error', rank: 0 };
        if (diffDays <= 5) return { status: 'Due Soon', variant: 'warning', rank: 1 };
        return { status: 'Due', variant: 'info', rank: 2 };
    };

    React.useEffect(() => {
        let mounted = true;
        async function fetchData() {
            if (!activeCourseId || !user?.userId) return;
            try {
                setLoading(true);
                const [data, submissions, grades] = await Promise.all([
                    getCourseAssignments(activeCourseId),
                    getStudentSubmissions(user.userId),
                    getStudentGrades(user.userId)
                ]);

                // Cross-reference assignments with real submissions and grades
                const enriched = data.map(item => {
                    const sub = submissions.find(s => s.assignmentId === item.id);
                    const grade = sub ? grades.find(g => g.submissionId === sub.id) : null;
                    const info = computeStatusInfo(item, sub, grade);
                    return { ...item, ...info };
                }).sort((a, b) => a.rank - b.rank);

                if (mounted) setAssignments(enriched);
            } catch (err) {
                console.error("Failed bringing in assignments for course:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchData();
        return () => { mounted = false; };
    }, [activeCourseId, user?.userId]);

    return (
        <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="font-display text-koru-title text-koru-on-surface">Assignments</h1>
                </div>
            </motion.header>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} variant="outlined" tone="surface" padding="lg" className="flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <Skeleton variant="rect" className="h-6 flex-1" style={{ maxWidth: `${55 + (i * 13) % 30}%` }} />
                                    <Skeleton variant="text" className="w-16 mt-1 shrink-0" />
                                </div>
                                <div className="flex flex-col gap-2 mb-6">
                                    <Skeleton variant="text" className="w-full" />
                                    <Skeleton variant="text" className="w-4/5" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-koru-outline-faint">
                                <div className="flex justify-between items-center">
                                    <Skeleton variant="text" className="w-14" />
                                    <Skeleton variant="text" className="w-12" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <Skeleton variant="text" className="w-16" />
                                    <Skeleton variant="text" className="w-24" />
                                </div>
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : assignments.length === 0 ? (
                <EmptyState title="No active assignments for this module yet." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {assignments.map((item, index) => (
                        <motion.div key={item.id} variants={slideUp} className={`relative group flex flex-col ${item.isClosed || item.isSubmitted || item.isGraded ? 'opacity-60' : 'opacity-100'}`}>
                          <Card variant="interactive" tone={item.isClosed || item.isSubmitted || item.isGraded ? 'muted' : 'surface'} padding="lg" className="relative overflow-hidden flex flex-1 flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="font-display text-koru-heading text-koru-on-surface group-hover:text-koru-primary transition-colors leading-tight pr-4">{item.title}</h2>
                                    <Badge variant={item.variant} className="whitespace-nowrap shrink-0">{item.status}</Badge>
                                </div>
                                <p className="text-sm text-koru-on-surface-variant line-clamp-2 leading-relaxed mb-6">{item.description}</p>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-koru-outline-faint">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-koru-on-surface-variant uppercase font-medium tracking-widest">Weight:</span>
                                    <span className="text-koru-on-surface font-medium">{item.maxPoints} pts</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-koru-on-surface-variant uppercase font-medium tracking-widest">Due Date:</span>
                                    <span className="text-koru-on-surface font-medium">{new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                {item.isGraded && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-koru-on-surface-variant uppercase font-medium tracking-widest">Grade:</span>
                                        <span className="text-koru-primary font-medium">{item.gradePercent}%</span>
                                    </div>
                                )}
                                <Button
                                    fullWidth
                                    variant={item.isClosed || item.isSubmitted || item.isGraded ? 'tonal' : 'filled'}
                                    className="mt-2"
                                    onClick={() => navigate(`/courses/${activeCourseId}/assignments/${item.id}`)}
                                    startIcon={(!item.isClosed && !item.isSubmitted && !item.isGraded) ? <Upload size={16} /> : undefined}
                                >
                                    {item.isGraded ? "View Grade" : item.isClosed ? "View" : item.isSubmitted ? "View Submission" : "View & Submit"}
                                </Button>
                            </div>
                          </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
