import { MdEventNote } from "react-icons/md";

// Next Class row – shows the upcoming class session inside the Course Glance card
// Displays the subject code, time range, and room location
export default function NextClassItem({ subject = "UX300", time = "09:00 - 13:00", room = "Room 101" }) {
  return (
    <div className="my-2 bg-white rounded-xl shadow-sm w-full h-12 flex flex-row items-center space-x-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1">
      {/* Orange icon badge */}
      <div className="w-9 h-9 bg-orange-400 rounded-full ml-2 flex items-center justify-center ">
        <MdEventNote className="w-6 h-6 text-white" />
      </div>

      {/* Subject code and time/room details */}
      <div className="ml-2 flex flex-col justify-center space-y-1 flex-1">
        <h3 className="text-sm font-bold dark:text-slate-100">{subject}</h3>
        <h3 className="text-xs text-gray-500 dark:text-slate-400">{time} | {room}</h3>
      </div>
    </div>
  );
}
