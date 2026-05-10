import { MdPersonOutline } from "react-icons/md";

// Single announcement row inside the Course Glance card
// Displays the announcement title, a truncated preview of the message, and the time it was posted
// Props have sensible defaults for preview / placeholder purposes
export default function AnnouncementsItem({
  title = "Prescribed Reading",
  message = "Hi everyone, a quick reminder that the prescribed reading for this week is due before our next session. Please work through the assigned material so we can hit the ground running in class. This week's reading: Chapter 5 — Design Thinking in Practice Article: User-Centred Research Methods Supplementary notes (uploaded to Files) Deadline: Complete before your next scheduled class. We'll be discussing the reading directly — coming unprepared will affect your participation. If you have any questions about the material, post them in the Discussion board — I check it daily. See you in class.",
  time = "11:23AM"
}) {
  return (
    <div className="my-2 bg-white shadow-sm rounded-xl w-full flex flex-row items-start px-3 py-3 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      {/* Teal avatar circle with a person icon */}
      <div className="w-9 h-9  bg-teal-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <MdPersonOutline className="w-6 h-6 text-black/40" />
      </div>

      {/* Title and message preview */}
      <div className="flex flex-col justify-center flex-1 ml-3 min-w-0">
        <h3 className="text-sm font-semibold leading-tight text-black">{title}</h3>
        <p className="text-xs text-gray-500 pt-3 line-clamp-4 leading-tight">{message}</p>
      </div>

      {/* Timestamp */}
      <div className="ml-3 flex items-start">
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
}
