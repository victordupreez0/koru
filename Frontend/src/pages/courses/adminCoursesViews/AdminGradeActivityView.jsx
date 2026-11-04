import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, ChevronUp, ChevronDown } from "lucide-react";
import { getCourseGrades } from "../../../services/gradeService";
import { staggerContainer, slideUp } from "../teacherCoursesComponents/constants";
import { Avatar, Badge, EmptyState, Skeleton } from "../../../components/UI";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function pct(points, max) {
  if (!max || max <= 0) return null;
  return Math.round((points / max) * 100);
}

function GradeChip({ points, maxPoints }) {
  const p = pct(points, maxPoints);
  if (p === null) return <span className="text-sm font-medium text-koru-on-surface-variant">{points ?? "—"}</span>;

  const variant = p >= 75 ? "success" : p >= 50 ? "warning" : "error";

  return (
    <Badge variant={variant} size="md">
      {points} / {maxPoints} <span className="opacity-60">({p}%)</span>
    </Badge>
  );
}

const SORT_OPTIONS = [
  { key: "gradedAt", label: "Date Graded" },
  { key: "studentName", label: "Student" },
  { key: "assignmentTitle", label: "Assignment" },
  { key: "pointsEarned", label: "Score" },
];

export function AdminGradeActivityView({ courseId }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("gradedAt");
  const [sortDir, setSortDir] = useState("desc");

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await getCourseGrades(courseId).catch(() => []);
      setGrades(data || []);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...grades].sort((a, b) => {
    let av, bv;
    switch (sortKey) {
      case "gradedAt":
        av = new Date(a.gradedAt || 0).getTime();
        bv = new Date(b.gradedAt || 0).getTime();
        break;
      case "studentName": {
        const an = a.submission?.student;
        const bn = b.submission?.student;
        av = an ? `${an.firstName} ${an.lastName}`.toLowerCase() : "";
        bv = bn ? `${bn.firstName} ${bn.lastName}`.toLowerCase() : "";
        break;
      }
      case "assignmentTitle":
        av = (a.submission?.assignment?.title || "").toLowerCase();
        bv = (b.submission?.assignment?.title || "").toLowerCase();
        break;
      case "pointsEarned":
        av = a.pointsEarned ?? 0;
        bv = b.pointsEarned ?? 0;
        break;
      default:
        return 0;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ k }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
    ) : null;

  return (
    <motion.div className="flex-1 overflow-y-auto" initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.header variants={slideUp} className="mb-6">
        <h1 className="font-display text-koru-title text-koru-on-surface">Grade Activity</h1>
        <p className="text-koru-on-surface-variant mt-1 text-sm">{grades.length} graded submissions</p>
      </motion.header>

      <motion.div variants={slideUp} className="bg-koru-surface-container-lowest rounded-koru-2xl ring-1 ring-inset ring-koru-outline-faint shadow-koru-card overflow-hidden">
        {loading ? (
          <div role="status" aria-label="Loading grades">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-koru-surface-container/50 border-b border-koru-outline-faint">
                  {["w-20", "w-16", "w-24", "w-16", "w-16", "w-16"].map((w, i) => (
                    <th key={i} className="px-6 py-4"><Skeleton variant="text" className={w} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-koru-outline-faint">
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-28" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Skeleton variant="circle" className="w-7 h-7 shrink-0" />
                        <Skeleton variant="text" className="h-4" style={{ width: `${65 + (i * 19) % 40}px` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton variant="text" className="h-4 mb-1" style={{ width: `${75 + (i * 13) % 50}px` }} />
                      <Skeleton variant="text" className="w-16" />
                    </td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-20" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="h-5 w-10" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<Award size={24} aria-hidden="true" />}
            title="No grades recorded yet"
            description="Grades will appear here once teachers start grading submissions."
          />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-koru-surface-container/50 border-b border-koru-outline-faint">
                {SORT_OPTIONS.map(opt => (
                  <th
                    key={opt.key}
                    onClick={() => handleSort(opt.key)}
                    className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant cursor-pointer hover:text-koru-on-surface transition-colors select-none"
                  >
                    <span className="flex items-center gap-1">
                      {opt.label} <SortIcon k={opt.key} />
                    </span>
                  </th>
                ))}
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Graded By</th>
                <th className="px-6 py-4 text-koru-caption font-medium uppercase tracking-widest text-koru-on-surface-variant">Released</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(grade => {
                const student = grade.submission?.student;
                const assignment = grade.submission?.assignment;
                const studentName = student
                  ? `${student.firstName} ${student.lastName}`
                  : "Unknown";

                return (
                  <tr key={grade.id} className="border-b border-koru-outline-faint last:border-0 hover:bg-koru-surface-container/40 transition-colors">
                    {/* Date */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-koru-on-surface-variant">{formatDate(grade.gradedAt)}</span>
                    </td>

                    {/* Student */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={student} seed={studentName} name={studentName} size={28} />
                        <span className="text-sm font-medium text-koru-on-surface truncate max-w-[140px]">
                          {studentName}
                        </span>
                      </div>
                    </td>

                    {/* Assignment */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-koru-on-surface-variant font-medium truncate max-w-[180px] block">
                        {assignment?.title || "—"}
                      </span>
                      {assignment?.type && (
                        <span className="text-koru-caption text-koru-on-surface-variant uppercase tracking-wider">{assignment.type}</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      <GradeChip
                        points={grade.pointsEarned}
                        maxPoints={assignment?.maxPoints || assignment?.totalPoints}
                      />
                    </td>

                    {/* Graded by */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-koru-on-surface-variant font-medium">{grade.gradedBy || "—"}</span>
                    </td>

                    {/* Released */}
                    <td className="px-6 py-4">
                      <Badge variant={grade.isReleased ? "success" : "neutral"}>
                        {grade.isReleased ? "Yes" : "No"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
