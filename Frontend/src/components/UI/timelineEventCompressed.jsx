import { MdAccessTime } from "react-icons/md";
import { motion } from "framer-motion";

// Compressed event card – used for events that are NOT the next upcoming one
// Shows a compact single-row layout with the title, lecturer, location badge, and duration
// Fades out when the event is in the past
export default function TimelineEventCompressed({
  title = "Contact Session",
  lecturer = "Laudette Sass",
  duration = "15min",
  location = "Online",
  timeRange = "12:30 - 12:45",
  isPast = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex-1 pb-5 cursor-pointer transition-opacity duration-300 ${isPast ? "opacity-45" : "opacity-100"}`}
    >
      {/* Time range label above the card */}
      <p className={`text-sm font-medium mb-2.5 ml-0.5 ${isPast ? "text-gray-400 line-through" : "text-gray-500"}`}>{timeRange}</p>

      {/* Compact card with a subtle left accent bar */}
      <div className={`border rounded-2xl px-5 py-4 flex items-center justify-between transition-shadow duration-200 relative overflow-hidden ${isPast ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200 hover:shadow-md"}`}>
        {/* Thin left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 rounded-l-2xl" />

        {/* Title and lecturer */}
        <div className="flex-1 min-w-0 pl-3 pr-3">
          <h3 className="text-base font-semibold text-black leading-tight font-['Gabarito']">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Lecturer – {lecturer}</p>
        </div>

        {/* Location badge and duration pill */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPast ? "text-gray-400 bg-gray-100" : "text-[#3C0078] bg-[#3C0078]/8"}`}>
            {location}
          </span>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${isPast ? "bg-gray-100" : "bg-[#FF8731]/10"}`}>
            <MdAccessTime className={`w-3.5 h-3.5 ${isPast ? "text-gray-400" : "text-[#FF8731]"}`} />
            <span className={`text-xs font-semibold ${isPast ? "text-gray-400" : "text-[#FF8731]"}`}>{duration}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

