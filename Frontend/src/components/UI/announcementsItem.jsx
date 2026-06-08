import { MdPersonOutline } from "react-icons/md";

// Single announcement row inside the Course Glance card
// Displays the announcement title, a truncated preview of the message, and the time it was posted
export default function AnnouncementsItem({
  title = "Prescribed Reading",
  message = "Hi everyone, a quick reminder...",
  time = "11:23AM",
  isRead = true,
  color = "#3C0078",
  onClick
}) {
  return (
    <div 
      onClick={onClick}
      className="my-2 bg-white shadow-sm rounded-xl w-full flex flex-row items-center px-3 py-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer border border-gray-100/50 relative overflow-hidden"
    >
      {/* Avatar circle using default brand color theme */}
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#3C007815", color: "#3C0078" }}
      >
        <MdPersonOutline className="w-5 h-5" />
      </div>

      {/* Title and message preview */}
      <div className="flex flex-col justify-center flex-1 ml-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className={`text-sm leading-tight truncate ${!isRead ? "font-bold text-black" : "font-semibold text-gray-700"}`}>
            {title}
          </h3>
          {!isRead && (
            <span className="flex h-2 w-2 shrink-0 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#3C0078]"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3C0078]"></span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 pt-0.5 line-clamp-1 leading-normal">{message}</p>
      </div>

      {/* Timestamp */}
      <div className="ml-3 flex items-start shrink-0">
        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
}
