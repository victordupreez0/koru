import React, { useState } from "react";
import { Alert, Avatar, Badge, Card, Modal } from "./UI";

const getTimestamp = (record) => {
    if (!record.date) return 0;
    const dateStr = record.date.split("T")[0];
    let timeStr = "00:00";
    if (record.time) {
        const matches = record.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (matches) {
            let hours = parseInt(matches[1], 10);
            const minutes = matches[2];
            const ampm = matches[3];
            
            if (ampm) {
                if (ampm.toUpperCase() === "PM" && hours < 12) {
                    hours += 12;
                } else if (ampm.toUpperCase() === "AM" && hours === 12) {
                    hours = 0;
                }
            }
            timeStr = `${String(hours).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        }
    }
    return new Date(`${dateStr}T${timeStr}:00`).getTime();
};

export default function StudentAttendanceDetailModal({
    isOpen,
    onClose,
    student,
    records = [],
    onUpdateStatus
}) {
    const [updatingRecordId, setUpdatingRecordId] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen || !student) return null;

    // Filter records for this student and sort descending by date and time (most recent first)
    const studentRecords = records
        .filter(r => r.studentId === student.id)
        .sort((a, b) => getTimestamp(b) - getTimestamp(a));

    // Calculate statistics
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === "Present").length;
    const late = studentRecords.filter(r => r.status === "Late").length;
    const absent = studentRecords.filter(r => r.status === "Absent").length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const handleStatusChange = async (recordId, newStatus) => {
        setUpdatingRecordId(recordId);
        setError(null);
        try {
            await onUpdateStatus(recordId, newStatus);
        } catch (err) {
            setError(err.message || "Failed to update record status.");
        } finally {
            setUpdatingRecordId(null);
        }
    };


    const STATUS_OPTIONS = [
        { label: "Present", activeClass: "bg-koru-success-soft text-koru-success" },
        { label: "Late", activeClass: "bg-koru-warning-soft text-koru-warning" },
        { label: "Absent", activeClass: "bg-koru-error-container text-koru-on-error-container" },
    ];

    return (
        <Modal
            open
            onClose={onClose}
            title={student.name}
            description={student.email}
            size="lg"
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar user={student} name={student.name} size="lg" />
                    <p className="text-sm text-koru-on-surface-variant">Attendance overview</p>
                </div>

                {/* Stats Summary Panel */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card tone="muted" padding="sm" radius="lg" className="text-center">
                        <span className="text-koru-caption uppercase tracking-wider text-koru-on-surface-variant block mb-1">Presence Rate</span>
                        <span className={`font-display text-koru-title ${
                            rate > 85 ? "text-koru-success" :
                            rate > 70 ? "text-koru-warning" : "text-koru-error"
                        }`}>{rate}%</span>
                    </Card>
                    <Card tone="muted" padding="sm" radius="lg" className="text-center">
                        <span className="text-koru-caption uppercase tracking-wider text-koru-on-surface-variant block mb-1">Present</span>
                        <span className="font-display text-koru-title text-koru-success">{present}</span>
                    </Card>
                    <Card tone="muted" padding="sm" radius="lg" className="text-center">
                        <span className="text-koru-caption uppercase tracking-wider text-koru-on-surface-variant block mb-1">Late</span>
                        <span className="font-display text-koru-title text-koru-warning">{late}</span>
                    </Card>
                    <Card tone="muted" padding="sm" radius="lg" className="text-center">
                        <span className="text-koru-caption uppercase tracking-wider text-koru-on-surface-variant block mb-1">Absent</span>
                        <span className="font-display text-koru-title text-koru-error">{absent}</span>
                    </Card>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                {/* List Body */}
                <div>
                    <h3 className="text-koru-caption font-medium uppercase tracking-[0.15em] text-koru-on-surface-variant mb-4">
                        Attendance History ({total} {total === 1 ? "entry" : "entries"})
                    </h3>

                    {studentRecords.length === 0 ? (
                        <div className="text-center py-12 text-koru-on-surface-variant text-sm">
                            No attendance records recorded for this student.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {studentRecords.map(record => {
                                const isUpdating = updatingRecordId === record.id;

                                return (
                                    <Card
                                        key={record.id}
                                        variant="outlined"
                                        tone="surface"
                                        padding="sm"
                                        radius="lg"
                                        className="flex items-center justify-between"
                                    >
                                        {/* Date and Session Type */}
                                        <div className="flex-1 min-w-0 pr-4">
                                            <span className="text-sm font-medium text-koru-on-surface block truncate">
                                                {formatDate(record.date)}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="neutral">
                                                    {record.sessionType || "Lecture"}
                                                </Badge>
                                                {record.time && (
                                                    <span className="text-xs text-koru-on-surface-variant">
                                                        {record.time}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Switcher */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-1.5 bg-koru-surface-container p-1 rounded-koru-md">
                                                {STATUS_OPTIONS.map(opt => {
                                                    const isActive = record.status === opt.label;
                                                    return (
                                                        <button
                                                            key={opt.label}
                                                            type="button"
                                                            disabled={isUpdating}
                                                            aria-pressed={isActive}
                                                            onClick={() => handleStatusChange(record.id, opt.label)}
                                                            className={`px-3 py-1.5 rounded-koru-sm text-koru-caption font-medium uppercase tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus disabled:opacity-50 ${
                                                                isActive
                                                                    ? opt.activeClass
                                                                    : "text-koru-on-surface-variant hover:bg-koru-surface-container-highest"
                                                            }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
