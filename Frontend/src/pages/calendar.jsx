import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Service layer – all fetch calls to our backend
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/eventService";

// Modal component for creating / editing / deleting events
import EventModal from "../components/eventModal";

// Transform a backend Event into the shape FullCalendar expects
function toFCEvent(evt) {
  return {
    id: evt.id,
    title: evt.title || "Untitled Event",
    start: evt.startTime,
    end: evt.endTime,
    backgroundColor: evt.bgColor || "#3C0078",
    textColor: evt.textColor || "#ffffff",
    extendedProps: {
      description: evt.description || "",
      eventType: evt.eventType || "",
      createdBy: evt.createdBy || "",
      courseId: evt.courseId || "",
    },
  };
}

// Transform a FullCalendar event back to our backend shape
function toBackendEvent(fcEvent) {
  return {
    id: fcEvent.id || undefined,
    title: fcEvent.title,
    description: fcEvent.extendedProps?.description || "",
    eventType: fcEvent.extendedProps?.eventType || "",
    startTime: fcEvent.start,
    endTime: fcEvent.end,
    createdBy: fcEvent.extendedProps?.createdBy || "",
    courseId: fcEvent.extendedProps?.courseId || "",
    bgColor: fcEvent.backgroundColor || "#3C0078",
    textColor: fcEvent.textColor || "#ffffff",
  };
}

export default function CalendarPage() {
  // Reference to the FullCalendar instance
  const calendarRef = useRef(null);

  // Events fetched from the backend
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state – controls create / edit / view popup
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all events from the backend on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const raw = await getEvents();
        if (!cancelled) setEvents(raw.map(toFCEvent));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Clicking an empty date/time slot opens a "create" modal
  const handleDateSelect = useCallback((selectInfo) => {
    setSelectedEvent({
      title: "",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: "#3C0078",
      textColor: "#ffffff",
      extendedProps: { description: "", eventType: "", createdBy: "", courseId: "" },
    });
    setModalMode("create");
    setModalOpen(true);
    selectInfo.view.calendar.unselect(); // clear selection highlight
  }, []);

  // Clicking an existing event opens an "edit" modal
  const handleEventClick = useCallback((clickInfo) => {
    const ev = clickInfo.event;
    setSelectedEvent({
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      end: ev.endStr,
      backgroundColor: ev.backgroundColor,
      textColor: ev.textColor,
      extendedProps: { ...ev.extendedProps },
    });
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  // Drag-and-drop or resize: update the event's times on the backend
  const handleEventDrop = useCallback(async (info) => {
    const ev = info.event;
    try {
      await updateEvent(ev.id, toBackendEvent(ev));
    } catch {
      info.revert(); // snap back if the API call fails
    }
  }, []);

  // Save handler called from the modal (create or update)
  const handleSave = useCallback(async (formData) => {
    try {
      if (modalMode === "create") {
        const created = await createEvent(formData);
        setEvents((prev) => [...prev, toFCEvent(created)]);
      } else {
        await updateEvent(formData.id, formData);
        setEvents((prev) =>
          prev.map((e) => (e.id === formData.id ? toFCEvent(formData) : e))
        );
      }
      setModalOpen(false);
    } catch (err) {
      alert("Failed to save event: " + err.message);
    }
  }, [modalMode]);

  // Delete handler called from the modal
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setModalOpen(false);
    } catch (err) {
      alert("Failed to delete event: " + err.message);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-['Gabarito']">Calendar</h2>
      </div>

      {/* Loading / error states */}
      {loading && <p className="text-sm text-gray-400 mb-4">Loading events…</p>}
      {error && <p className="text-sm text-red-500 mb-4">Could not load events: {error}</p>}

      {/* FullCalendar inside a white card container */}
      <div className=" p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}           // allow drag-and-drop
          selectable={true}         // allow clicking empty slots
          selectMirror={true}       // ghost element while selecting
          dayMaxEvents={true}       // "+more" link when too many events
          weekends={true}
          firstDay={1}             // start weeks on Monday
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          height="auto"
        />
      </div>

      {/* Event modal – create / edit / delete */}
      {modalOpen && (
        <EventModal
          mode={modalMode}
          event={selectedEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
