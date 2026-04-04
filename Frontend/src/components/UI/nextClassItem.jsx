import { MdEventNote } from "react-icons/md";

export default function NextClassItem({ subject = "UX300", time = "09:00 - 13:00", room = "Room 101" }) {
  return (
    <div className="my-2 bg-white rounded-lg w-full h-12 flex flex-row items-center space-x-2">
      <div className="w-9 h-9 bg-[#FF8731] rounded-md ml-2 flex items-center justify-center">
        <MdEventNote className="w-6 h-6 text-white" />
      </div>
      <div className="ml-2 flex flex-col justify-center space-y-1 flex-1">
        <h3 className="text-sm">{subject}</h3>
        <h3 className="text-xs text-gray-500">{time} | {room}</h3>
      </div>
    </div>
  );
}
