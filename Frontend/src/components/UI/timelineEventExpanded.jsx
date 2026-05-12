import { MdPersonOutline, MdAccessTime } from "react-icons/md";
import { motion } from "framer-motion";

// Expanded event card – used for the NEXT upcoming event on the timeline
// Larger layout with a purple accent bar, subtitle, lecturer avatar row, and duration pill
// Fades out and turns grey when the event is in the past
export default function TimelineEventExpanded({
  title = "DV300 - Theory",
  subtitle = "Project Proposal Pitch",
  lecturer = "Tsungai Katsuro",
  duration = "60min",
  location = "Online",
  timeRange = "11:00 - 12:00",
  isPast = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex-1 pb-5 cursor-pointer transition-opacity duration-300 ${isPast ? "opacity-45" : "opacity-100"}`}
    >
      {/* Time range label above the card */}
      <p className={`text-sm font-semibold mb-2.5 ml-0.5 tracking-wide ${isPast ? "text-gray-400 dark:text-slate-600 line-through" : "text-gray-600 dark:text-slate-300"}`}>
        {timeRange}
      </p>

      {/* Main card container */}
      <div className={`border rounded-2xl overflow-hidden transition-shadow duration-200 ${isPast ? "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700" : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md"}`}>
        {/* Top accent bar – purple gradient for active, grey for past */}
        <div className={`h-1.5 w-full ${isPast ? "bg-gray-200 dark:bg-slate-700" : "bg-gradient-to-r from-[#3C0078] to-[#7B2FBE]"}`} />
      <div className={`rounded-2xl overflow-hidden transition-shadow duration-200 ${isPast ? "bg-gray-50" : "bg-purple-100  hover:shadow-md"}`}>

        <div className="p-5">
          {/* Header – title, subtitle, and location badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-black dark:text-slate-100 leading-tight font-['Gabarito']">
                {title}
              </h3>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${isPast ? "text-white-400 bg-gray-100" : "text-[#3C0078] bg-[#3C0078]/8"}`}>
              {location}
            </span>
          </div>

          {/* Spacer between header and footer */}
          <div className="h-3" />

          {/* Footer – lecturer info and duration pill */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
            {/* Lecturer avatar and name */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPast ? "bg-gray-100 dark:bg-slate-700" : "bg-[#3C0078]/10 dark:bg-[#9BE9EA]/10"}`}>
                <MdPersonOutline className={`w-5 h-5 ${isPast ? "text-gray-400 dark:text-slate-600" : "text-[#3C0078] dark:text-[#9BE9EA]"}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-black leading-tight uppercase tracking-wider font-medium">
                  Lecturer
                </span>
                <span className="text-sm font-semibold text-black dark:text-slate-100 leading-tight">
                  {lecturer}
                </span>
              </div>
            </div>

            {/* Duration pill with clock icon */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPast ? "bg-gray-100" : "bg-white"}`}>
              <MdAccessTime className={`w-4 h-4 ${isPast ? "text-gray-400" : "text-black"}`} />
              <span className={`text-sm font-semibold ${isPast ? "text-gray-400" : "text-black"}`}>{duration}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

