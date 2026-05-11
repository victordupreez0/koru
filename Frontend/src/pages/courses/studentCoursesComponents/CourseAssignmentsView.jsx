import React from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Upload } from "@solar-icons/react";
import { motion } from "framer-motion";
import { getCourseAssignments } from "../../../services/assignmentService";
import { staggerContainer, slideUp } from "./constants";

export default function CourseAssignmentsView({ subject, activeCourseId }) {
    const navigate = useNavigate();
    const [assignments, setAssignments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const computeStatusInfo = (item) => {
        // Hardcode "Usability Testing Report" to be "Submitted" for dev testing
        if (item.title === "Usability Testing Report" || item.title === "Literature Review Module") {
            return { status: 'Submitted', color: 'text-green-600', rank: 3, isSubmitted: true };
        }

        const now = new Date();
        const due = new Date(item.dueDate);
        const diffDays = (due - now) / (1000 * 60 * 60 * 24);
        
        // As actual submissions aren't wired, we compute entirely by date heuristic
        if (diffDays < -7) return { status: 'Closed', color: 'text-gray-400', rank: 4, isClosed: true };
        if (diffDays < 0) return { status: 'Late', color: 'text-red-600', rank: 0 };
        if (diffDays <= 5) return { status: 'Due Soon', color: 'text-orange-500', rank: 1 };
        return { status: 'Due', color: 'text-blue-500', rank: 2 };
    };

    React.useEffect(() => {
        let mounted = true;
        async function fetch() {
            if (!activeCourseId) return;
            try {
                setLoading(true);
                const data = await getCourseAssignments(activeCourseId);
                
                // Enqueue map & sort logic for the requested importance hierarchy
                const enriched = data.map(item => {
                    const info = computeStatusInfo(item);
                    return { ...item, ...info };
                }).sort((a, b) => a.rank - b.rank);

                if (mounted) setAssignments(enriched);
            } catch (err) {
                console.error("Failed bringing in assignments for course:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetch();
        return () => { mounted = false; };
    }, [activeCourseId]);

    return (
        <motion.div className="flex-1 p-8 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.header variants={slideUp} className="mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Assignments</h1>
                    <p className="text-gray-500 mt-2 text-lg">{subject?.code || "Pending"} | Assessments & Briefs</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                        <Folder size={20} /> Briefs Archive
                    </button>
                    {/* The global 'Submit Assignment' button was removed here as per instructions */}
                </div>
            </motion.header>
            
            {loading ? (
                <div className="text-gray-500 text-center py-20 font-medium">Loading remote course assignments...</div>
            ) : assignments.length === 0 ? (
                <div className="text-gray-500 text-center py-20 font-medium bg-gray-50 rounded-[40px] border border-gray-100">
                    No active assignments for this module yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {assignments.map((item, index) => (
                        <motion.div key={item.id} variants={slideUp} className={`bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${item.isClosed || item.isSubmitted ? 'opacity-60 bg-gray-50' : 'opacity-100'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-[#3C0078] transition-colors leading-tight pr-4">{item.title}</h2>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap mt-1 ${item.color}`}>{item.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">{item.description}</p>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 uppercase font-bold tracking-widest">Weight:</span>
                                    <span className="text-gray-900 font-bold">{item.maxPoints} pts</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 uppercase font-bold tracking-widest">Due Date:</span>
                                    <span className="text-gray-900 font-bold">{new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                                <button
                                    onClick={() => navigate(`/courses/${activeCourseId}/assignments/${item.id}`)}
                                    className={`w-full mt-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-sm ${item.isClosed || item.isSubmitted ? 'bg-gray-800 hover:bg-black' : 'bg-[#3C0078] hover:bg-[#2A0054]'}`}>
                                    {(!item.isClosed && !item.isSubmitted) && <Upload size={16} />}
                                    {item.isClosed ? "View" : item.isSubmitted ? "View Submission" : "View & Submit"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
