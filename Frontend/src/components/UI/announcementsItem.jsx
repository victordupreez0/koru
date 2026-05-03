import { MdPersonOutline } from "react-icons/md";

// Single announcement row inside the Course Glance card
// Displays the announcement title, a truncated preview of the message, and the time it was posted
// Props have sensible defaults for preview / placeholder purposes
export default function AnnouncementsItem({
  title = "Prescribed Reading",
  message = "Hi Class! Please remember to read the prescribed...",
  time = "11:23AM"
}) {
  return (
    <div className="my-2 bg-white dark:bg-slate-700 rounded-lg w-full h-12 flex flex-row items-center px-3 py-2 min-h-[56px] transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:bg-[#9BE9EA]/5 dark:hover:bg-[#9BE9EA]/10">
      {/* Teal avatar circle with a person icon */}
      <div className="w-8 h-8 bg-[#9BE9EA] rounded-full flex items-center justify-center">
        <MdPersonOutline className="w-6 h-6 text-black" />
      </div>

      {/* Title and message preview */}
      <div className="flex flex-col justify-center flex-1 ml-3 min-w-0">
        <h3 className="text-sm font-semibold leading-tight text-black dark:text-slate-100">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate leading-tight">{message}</p>
      </div>

      {/* Timestamp */}
      <div className="ml-3 flex items-start">
        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
}
