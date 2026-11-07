import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Check,
  Trash2,
  BookOpen,
  Clock,
  MapPin,
  Video,
  User,
  ExternalLink,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllEvents } from "../services/eventService";
import { getStudentAssignments } from "../services/assignmentService";
import { useAuth } from "../contexts/AuthContext";
import confetti from "canvas-confetti";
import { Badge, Button, Card, Input, Modal } from "./UI";

// Helper to find the Monday start of a week for a given date
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so Monday is first day (0) and Sunday is last day (6)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

// Format the date range like "May 18 – 24, 2026"
const formatWeekRange = (start) => {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const startYear = start.getFullYear();

  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
};

export default function WeeklyHorizontalTimeline({ onModalToggle }) {
  const { user } = useAuth();

  // Date State - tracks Monday of the currently selected week
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));

  // API and Custom Data states
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom LocalStorage-based events state (unified Todo + Meetings)
  const [customEvents, setCustomEvents] = useState(() => {
    const saved = localStorage.getItem(`learnonline_customevents_${user?.userId || 'guest'}`);
    if (saved) return JSON.parse(saved);

    // Migration: read old customTodos and convert them
    const oldTodos = localStorage.getItem(`learnonline_todos_${user?.userId || 'guest'}`);
    if (oldTodos) {
      try {
        const parsed = JSON.parse(oldTodos);
        return parsed.map(todo => ({
          ...todo,
          type: "todo",
          time: "",
          place: "",
          isOnline: false,
          meetingLink: ""
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modal creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDate, setCreateModalDate] = useState(null);

  // Form input states
  const [formType, setFormType] = useState("todo"); // "todo" or "meeting"
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formPlace, setFormPlace] = useState("");
  const [formIsOnline, setFormIsOnline] = useState(false);
  const [formMeetingLink, setFormMeetingLink] = useState("");

  // Modal details states
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Sync custom events to LocalStorage
  useEffect(() => {
    localStorage.setItem(`learnonline_customevents_${user?.userId || 'guest'}`, JSON.stringify(customEvents));
  }, [customEvents, user?.userId]);

  // Monitor open states of all modals and notify dashboard parent to trigger full backdrop blur/fade
  useEffect(() => {
    const isAnyOpen = !!selectedAssignment || !!selectedClass || isCreateModalOpen;
    if (onModalToggle) {
      onModalToggle(isAnyOpen);
    }
  }, [selectedAssignment, selectedClass, isCreateModalOpen, onModalToggle]);

  // Fetch events and assignments once on load
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [eventData, assignmentData] = await Promise.all([
          getAllEvents(),
          user?.userId ? getStudentAssignments(user.userId) : Promise.resolve([]),
        ]);

        if (mounted) {
          setEvents(Array.isArray(eventData) ? eventData : []);
          setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
        }
      } catch (err) {
        console.error("Failed fetching weekly timeline data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  // Compute the 7 dates of the selected week (Mon -> Sun)
  const daysOfWeek = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleResetToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  // Open creation modal
  const openCreateModal = (dayDate) => {
    setCreateModalDate(dayDate);
    setFormType("todo");
    setFormTitle("");
    setFormTime("09:00");
    setFormPlace("");
    setFormIsOnline(false);
    setFormMeetingLink("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Submit custom event form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newEvent = {
      id: `custom-event-${Date.now()}`,
      type: formType,
      title: formTitle.trim(),
      completed: false, // only applicable for todos
      date: createModalDate.toISOString(),
      time: formTime,
      place: formPlace.trim() || (formIsOnline ? "Online" : "TBA"),
      isOnline: formIsOnline,
      meetingLink: formIsOnline ? formMeetingLink.trim() : "",
    };

    setCustomEvents(prev => [...prev, newEvent]);
    closeCreateModal();

    // Play full confetti burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: formType === "todo" ? ["#3C0078", "#87CEFA"] : ["#FF8731", "#F472B6"]
    });
  };

  // Toggle custom todo status
  const handleToggleTodo = (id, event) => {
    event.stopPropagation(); // Avoid triggering details modal if any
    setCustomEvents(prev => prev.map(evt => {
      if (evt.id === id) {
        const nextState = !evt.completed;
        if (nextState) {
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.35 },
            colors: ["#87CEFA", "#3C0078", "#FF8731"]
          });
        }
        return { ...evt, completed: nextState };
      }
      return evt;
    }));
  };

  // Delete custom event (both todo and custom meeting)
  const handleDeleteEvent = (id, event) => {
    event.stopPropagation();
    setCustomEvents(prev => prev.filter(t => t.id !== id));
  };

  // Filter lists of items for a specific day
  const getDayItems = (dayDate) => {
    const dayStr = dayDate.toDateString();

    const dayAssignments = assignments.filter(a => {
      const due = new Date(a.dueDate);
      return due.toDateString() === dayStr;
    });

    const dayClasses = [
      // Backend events
      ...events.filter(e => {
        const start = new Date(e.startTime);
        const isSameDay = start.toDateString() === dayStr;
        const type = e.eventType?.toLowerCase() || "";
        const isClassOrMeeting = type === "class" || type === "lecture" || type === "practical" || e.title?.toLowerCase().includes("meeting");
        return isSameDay && isClassOrMeeting;
      }),
      // Custom events of type "meeting"
      ...customEvents.filter(e => {
        return e.type === "meeting" && new Date(e.date).toDateString() === dayStr;
      }).map(c => ({
        id: c.id,
        title: c.title,
        startTime: new Date(new Date(c.date).setHours(c.time ? parseInt(c.time.split(":")[0]) : 9, c.time ? parseInt(c.time.split(":")[1]) : 0)),
        endTime: new Date(new Date(c.date).setHours(c.time ? parseInt(c.time.split(":")[0]) + 1 : 10, c.time ? parseInt(c.time.split(":")[1]) : 0)),
        eventType: "Meeting",
        description: `${c.title}|${c.isOnline ? 'Online' : (c.place || 'TBA')}`,
        createdBy: "Custom Scheduled",
        meetingLink: c.meetingLink,
        isCustom: true
      }))
    ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const dayTodos = customEvents.filter(t => {
      return t.type === "todo" && new Date(t.date).toDateString() === dayStr;
    });

    return {
      assignments: dayAssignments,
      classes: dayClasses,
      todos: dayTodos
    };
  };

  // Count totals for current week summary badge
  const weekTotals = useMemo(() => {
    let assignmentsCount = 0;
    let classesCount = 0;

    daysOfWeek.forEach(day => {
      const { assignments: dayA, classes: dayC } = getDayItems(day);
      assignmentsCount += dayA.length;
      classesCount += dayC.length;
    });

    return { assignmentsCount, classesCount };
  }, [daysOfWeek, assignments, events, customEvents]);

  const isToday = (dayDate) => {
    return dayDate.toDateString() === new Date().toDateString();
  };

  const isPastEvent = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    // Set to start of day to compare dates
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  return (
    <div className="w-full flex flex-col relative h-[360px] select-none p-1 mt-15 mb-15">

      {/* ── HEADER NAVIGATION ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display text-koru-title text-koru-on-surface leading-none">Timeline</h2>
          </div>
        </div>

        {/* Date range switcher */}
        <div className="flex items-center gap-4 bg-koru-surface-container p-1.5 rounded-koru-lg">
          <button
            onClick={handlePrevWeek}
            className="w-8 h-8 rounded-koru-md flex items-center justify-center text-koru-on-surface-variant hover:bg-koru-surface-container-lowest hover:text-koru-primary active:scale-95 transition-all shadow-koru-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus motion-reduce:transition-none motion-reduce:active:scale-100"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-koru-label font-display text-koru-on-surface px-2 min-w-[200px] text-center">
            {formatWeekRange(currentWeekStart)}
          </span>

          <button
            onClick={handleNextWeek}
            className="w-8 h-8 rounded-koru-md flex items-center justify-center text-koru-on-surface-variant hover:bg-koru-surface-container-lowest hover:text-koru-primary active:scale-95 transition-all shadow-koru-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus motion-reduce:transition-none motion-reduce:active:scale-100"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action + stats */}
        {/* <div className="flex items-center gap-3">
          <button
            onClick={handleResetToToday}
            className="text-xs font-medium px-3 py-2 rounded-koru-pill bg-koru-primary hover:bg-koru-primary-hover text-koru-on-primary shadow-koru-sm active:scale-95 transition-all cursor-pointer"
          >
            Go to Today
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-koru-surface-container rounded-koru-md px-3 py-1.5 text-koru-caption font-medium text-koru-on-surface-variant">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-koru-primary" /> {weekTotals.assignmentsCount} Due</span>
            <span className="w-1.5 h-1.5 rounded-full bg-koru-outline-variant" />
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-koru-accent" /> {weekTotals.classesCount} Classes</span>
          </div>
        </div> */}
      </div>

      {/* ── TIMELINE WORKSPACE ── */}
      <div className="flex-1 relative grid grid-cols-7 gap-2 items-stretch min-h-0">

        {/* Continuous horizontal timeline line */}
        <div
          className="absolute left-[calc(100%/14)] right-[calc(100%/14)] h-[3px] rounded-full pointer-events-none bg-koru-outline-variant"
          style={{
            top: 'calc(50% - 1.5px)'
          }}
        />

        {daysOfWeek.map((dayDate, idx) => {
          const { assignments: dayA, classes: dayC, todos: dayT } = getDayItems(dayDate);
          const dayToday = isToday(dayDate);
          const hasItems = dayA.length > 0 || dayT.length > 0 || dayC.length > 0;
          const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short" });
          const dateNum = dayDate.getDate();

          return (
            <div key={idx} className="group flex flex-col items-center flex-1 min-w-0 relative overflow-hidden">

              {/* TOP AREA: Assignments & Todo Items (scrollable container) */}
              <div className="flex-1 w-full flex flex-col justify-end items-center gap-1.5 pb-2.5 min-h-0 overflow-y-auto scrollbar-hide">
                <AnimatePresence>
                  {/* Assignments */}
                  {dayA.map(assignment => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
                      className={`w-full max-w-[135px] h-10 truncate text-[0.8rem] font-medium py-1 px-1.5 rounded-koru-sm cursor-pointer transition-all flex items-center gap-1 text-left shrink-0 ${isPastEvent(assignment.dueDate) ? 'bg-koru-surface-container text-koru-on-surface-variant hover:bg-koru-surface-container-high' : 'bg-koru-primary-container text-koru-on-primary-container hover:bg-koru-primary-container/80'
                        }`}
                      title={`${assignment.course?.subject?.code || 'UX300'}: ${assignment.title}`}
                    >
                      <Award className={`w-3 h-3 shrink-0 ${isPastEvent(assignment.dueDate) ? 'text-koru-on-surface-variant' : 'text-koru-primary'}`} />
                      <span className="truncate">{assignment.course?.subject?.code || "UX"}: {assignment.title}</span>
                    </motion.div>
                  ))}

                  {/* Custom Todos */}
                  {dayT.map(todo => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={todo.id}
                      onClick={(e) => handleToggleTodo(todo.id, e)}
                      className={`group/todo w-full max-w-[135px] truncate text-[10px] py-1 px-1.5 rounded-koru-sm flex items-center justify-between cursor-pointer transition-all shadow-koru-xs text-left shrink-0 ${isPastEvent(todo.date) ? (
                        todo.completed
                          ? 'bg-koru-surface-container-low text-koru-on-surface-variant line-through'
                          : 'bg-koru-surface-container text-koru-on-surface-variant hover:bg-koru-surface-container-high font-medium'
                      ) : (
                        todo.completed
                          ? 'bg-koru-surface-container-low text-koru-on-surface-variant line-through'
                          : 'bg-koru-success-soft text-koru-success hover:bg-koru-success-soft/80 font-medium'
                      )
                        }`}
                      title={`${todo.title} ${todo.time ? `(${todo.time})` : ''}`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${todo.completed ? 'bg-koru-success border-koru-success text-koru-on-primary' : isPastEvent(todo.date) ? 'border-koru-outline bg-koru-surface-container-lowest' : 'border-koru-outline bg-koru-surface-container-lowest'
                          }`}>
                          {todo.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{todo.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteEvent(todo.id, e)}
                        className="opacity-0 group-hover/todo:opacity-100 text-koru-on-surface-variant hover:text-koru-error shrink-0 ml-1 transition-opacity"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* PLUS BUTTON TRIGGER FOR CREATION MODAL */}
                <button
                  onClick={() => openCreateModal(dayDate)}
                  className="w-5 h-5 rounded-full bg-koru-surface-container hover:bg-koru-primary-container hover:text-koru-primary text-koru-on-surface-variant flex items-center justify-center shrink-0 shadow-koru-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus active:scale-95 cursor-pointer mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100"
                  title="Create custom event"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CONNECTIVE TOP DOTTED LINE */}
              <div className={`w-[2px] h-4 border-l-2 transition-all opacity-0 group-hover:opacity-100 ${dayA.length > 0 || dayT.length > 0 ? 'border-koru-outline-variant' : 'border-koru-outline-faint'
                }`} />

              {/* ── TIMELINE AXIS DOT ── */}
              <div
                onClick={() => openCreateModal(dayDate)}
                className={`w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-koru-sm z-10 font-display ${dayToday
                  ? 'bg-koru-primary text-koru-on-primary ring-4 ring-koru-primary-container scale-105'
                  : hasItems
                    ? 'bg-koru-surface-container-lowest ring-2 ring-inset ring-koru-primary/40 text-koru-on-surface'
                    : 'bg-koru-surface-container-lowest text-koru-on-surface-variant hover:ring-2 hover:ring-inset hover:ring-koru-primary/40 hover:text-koru-primary'
                  }`}
                title={dayToday ? "Today (Click to add task)" : "Click to add task"}
              >
                <span className="text-[12px] font-medium leading-none">{dateNum}</span>
                <span className="text-[8px] uppercase tracking-wide leading-none mt-0.5 font-medium">{dayLabel}</span>
              </div>

              {/* CONNECTIVE BOTTOM DOTTED LINE */}
              <div className={`w-[2px] h-4 border-l-2 transition-all opacity-0 group-hover:opacity-100 ${dayC.length > 0 ? 'border-koru-outline-variant' : 'border-koru-outline-faint'
                }`} />

              {/* BOTTOM AREA: Classes & Meetings */}
              <div className="flex-1 w-full flex flex-col justify-start items-center gap-1.5 pt-2.5 min-h-0 overflow-y-auto scrollbar-hide">
                <AnimatePresence>
                  {dayC.map(cls => {
                    const start = new Date(cls.startTime);
                    const timeStr = cls.isCustom
                      ? (cls.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
                      : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

                    const room = cls.description?.includes("|") ? cls.description.split("|")[1] : "Room";
                    const isOnline = room.toLowerCase().includes("online");
                    const isPast = isPastEvent(cls.startTime);

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`group/meeting w-full max-w-[135px] text-left text-[0.8rem] p-1.5 rounded-koru-sm cursor-pointer transition-all flex flex-col gap-0.5 leading-tight shrink-0 relative ${isPast ? 'bg-koru-surface-container hover:bg-koru-surface-container-high' : (cls.isCustom ? 'bg-koru-accent-soft text-koru-accent-ink hover:bg-koru-accent-soft/70' : 'bg-koru-primary-container text-koru-on-primary-container hover:bg-koru-primary-container/80')
                          }`}
                        title={cls.title}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className={`font-medium truncate ${isPast ? 'text-koru-on-surface-variant' : ''}`}>{cls.title}</span>
                          {cls.isCustom && (
                            <button
                              onClick={(e) => handleDeleteEvent(cls.id, e)}
                              className="opacity-0 group-hover/meeting:opacity-100 text-koru-accent-ink hover:text-koru-error shrink-0 ml-1 transition-opacity"
                              title="Delete custom meeting"
                              aria-label="Delete custom meeting"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 text-[0.7rem] font-medium shrink-0 mt-0.5 ${isPast ? 'text-koru-outline' : 'text-koru-on-surface-variant'}`}>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {timeStr}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 shrink-0 truncate max-w-[50px]">
                            {isOnline ? <Video className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                            {room}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {dayC.length === 0 && (
                  <span className="text-[9px] font-medium text-koru-outline italic pt-1">Free day</span>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* ── MODAL: TASK/EVENT CREATOR MODAL ── */}
      <Modal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        size="sm"
        title="Create Custom Event"
        description={`Scheduled for: ${createModalDate?.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) ?? ""}`}
      >
        {/* Type Tabs */}
        <div className="flex bg-koru-surface-container p-1.5 rounded-koru-lg mb-5">
          <button
            type="button"
            onClick={() => setFormType("todo")}
            aria-pressed={formType === "todo"}
            className={`flex-1 py-2 text-xs font-medium rounded-koru-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${formType === "todo"
              ? "bg-koru-surface-container-lowest text-koru-primary shadow-koru-xs"
              : "text-koru-on-surface-variant hover:bg-koru-surface-container-high"
              }`}
          >
            📝 Task / Todo
          </button>
          <button
            type="button"
            onClick={() => setFormType("meeting")}
            aria-pressed={formType === "meeting"}
            className={`flex-1 py-2 text-xs font-medium rounded-koru-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus ${formType === "meeting"
              ? "bg-koru-surface-container-lowest text-koru-accent-ink shadow-koru-xs"
              : "text-koru-on-surface-variant hover:bg-koru-surface-container-high"
              }`}
          >
            👥 Class / Meeting
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            label={formType === "todo" ? "Task Title" : "Meeting / Class Title"}
            type="text"
            required
            placeholder={formType === "todo" ? "e.g., Finish Lit Review essay" : "e.g., Visual Semiotics Study Session"}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Time"
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
            />
            <Input
              label="Location / Room"
              type="text"
              disabled={formIsOnline}
              placeholder={formIsOnline ? "Online Session" : "e.g., Room 304"}
              value={formIsOnline ? "Online" : formPlace}
              onChange={(e) => setFormPlace(e.target.value)}
            />
          </div>

          {/* Online checkbox */}
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-koru-xs accent-koru-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
              checked={formIsOnline}
              onChange={(e) => {
                setFormIsOnline(e.target.checked);
                if (e.target.checked) setFormPlace("Online");
                else setFormPlace("");
              }}
            />
            <span className="text-koru-caption font-medium text-koru-on-surface-variant flex items-center gap-1 select-none">
              <Video className="w-3.5 h-3.5 text-koru-primary shrink-0" />
              This is an online/virtual session
            </span>
          </label>

          {/* Meeting URL */}
          <AnimatePresence>
            {formIsOnline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <Input
                    label="Meeting URL / Link"
                    type="url"
                    required={formIsOnline}
                    placeholder="https://teams.microsoft.com/l/meetup-join/..."
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-2 pt-4 mt-2">
            <Button type="button" variant="outlined" size="sm" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant={formType === "todo" ? "filled" : "accent"}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ASSIGNMENT DETAIL VIEW ── */}
      <Modal
        open={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        size="sm"
        ariaLabel="Assignment details"
      >
        {selectedAssignment && (
          <>
            <Badge variant="primary">
              {selectedAssignment.course?.subject?.code || "UX300"} Assignment
            </Badge>

            <h3 className="font-display text-koru-heading text-koru-on-surface mt-4 leading-snug">
              {selectedAssignment.title}
            </h3>

            <p className="text-xs font-medium text-koru-on-surface-variant mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Due: {new Date(selectedAssignment.dueDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>

            <Card tone="muted" padding="sm" radius="lg" className="my-5">
              <p className="text-xs font-medium text-koru-on-surface-variant uppercase tracking-wide">Description</p>
              <p className="text-sm text-koru-on-surface mt-1.5 leading-relaxed">
                {selectedAssignment.description || "No description provided."}
              </p>
            </Card>

            <div className="flex items-center justify-between pt-4 mt-6">
              <span className="text-xs font-medium text-koru-on-surface-variant flex items-center gap-1">
                Max Marks: <span className="text-koru-primary">{selectedAssignment.maxPoints || 100}</span>
              </span>

              <div className="flex gap-2">
                <Button variant="outlined" size="sm" onClick={() => setSelectedAssignment(null)}>
                  Close
                </Button>
                <a
                  href={`/courses/${selectedAssignment.courseId}/assignments/${selectedAssignment.id}`}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-koru-pill px-3 text-xs font-medium shadow-koru-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 bg-koru-primary text-koru-on-primary hover:bg-koru-primary-hover"
                >
                  Open Assignment <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ── MODAL: CLASS/MEETING DETAIL VIEW ── */}
      <Modal
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        size="sm"
        ariaLabel="Class details"
      >
        {selectedClass && (
          <>
            <Badge variant="accent" className="capitalize">
              {selectedClass.eventType || "Class"}
            </Badge>

            <h3 className="font-display text-koru-heading text-koru-on-surface mt-4 leading-snug">
              {selectedClass.title}
            </h3>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-koru-on-surface-variant text-xs font-medium">
                <Clock className="w-4 h-4 text-koru-accent shrink-0" />
                <span>
                  {selectedClass.isCustom ? (
                    `${selectedClass.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  ) : (
                    `${new Date(selectedClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({Math.round((new Date(selectedClass.endTime) - new Date(selectedClass.startTime)) / 60000)} mins)`
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-koru-on-surface-variant text-xs font-medium">
                {selectedClass.description?.includes("Online") || selectedClass.description?.toLowerCase().includes("virtual") || selectedClass.description?.toLowerCase().includes("teams") ? (
                  <Video className="w-4 h-4 text-koru-accent shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-koru-accent shrink-0" />
                )}
                <span>
                  Location: {selectedClass.description?.includes("|") ? selectedClass.description.split("|")[1] : "TBA"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-koru-on-surface-variant text-xs font-medium">
                <User className="w-4 h-4 text-koru-accent shrink-0" />
                <span>Lecturer: {selectedClass.createdBy || "Unspecified"}</span>
              </div>
            </div>

            <Card tone="muted" padding="sm" radius="lg" className="my-4 text-xs text-koru-on-surface-variant">
              {selectedClass.description?.includes("|") ? selectedClass.description.split("|")[0] : selectedClass.description || "Class session details."}
            </Card>

            <div className="flex justify-end gap-2 pt-4 mt-6">
              <Button variant="outlined" size="sm" onClick={() => setSelectedClass(null)}>
                Close
              </Button>
              {(selectedClass.meetingLink || selectedClass.description?.toLowerCase().includes("online")) && (
                <a
                  href={selectedClass.meetingLink || "https://teams.microsoft.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-koru-pill px-3 text-xs font-medium shadow-koru-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus focus-visible:ring-offset-2 bg-koru-accent text-koru-ink hover:bg-koru-accent-hover"
                >
                  Join Meeting <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}
