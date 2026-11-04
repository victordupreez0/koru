import { MdAccessTime } from "react-icons/md";
import { motion } from "framer-motion";
import Badge from "./Badge";
import Button from "./Button";

export default function TimelineEventCompressed({
  title = "Contact Session",
  lecturer = "Laudette Sass",
  duration = "15min",
  location = "Online",
  timeRange = "12:30 - 12:45",
  isPast = false,
  onManageAttendance = null,
  onCheckIn = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex-1 pb-5 transition-opacity duration-300 ${isPast ? "opacity-50" : "opacity-100"}`}
    >
      <p className="mb-2.5 ml-0.5 text-koru-label font-normal tabular-nums text-koru-on-surface-variant">{timeRange}</p>

      <div className={`rounded-koru-md px-5 py-4 transition-shadow duration-200 ease-koru-out ${isPast ? "bg-koru-surface-container" : "bg-koru-surface-container-lowest shadow-koru-card ring-1 ring-inset ring-koru-outline-faint hover:shadow-koru-card-hover"}`}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="font-display text-base font-medium leading-tight text-koru-on-surface">{title}</h3>
            <p className="mt-0.5 text-koru-caption text-koru-on-surface-variant">Lecturer – {lecturer}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={isPast ? "neutral" : "primary"}>{location}</Badge>
            <Badge variant={isPast ? "neutral" : "info"}>
              <MdAccessTime className="h-3.5 w-3.5" aria-hidden="true" />
              {duration}
            </Badge>
          </div>
        </div>

        {/* Attendance actions */}
        {!isPast && (onManageAttendance || onCheckIn) && (
          <div className="mt-3 border-t border-koru-outline-faint pt-3">
            {onManageAttendance && (
              <Button
                variant="tonal"
                size="sm"
                fullWidth
                onClick={e => { e.stopPropagation(); onManageAttendance(); }}
              >
                Manage attendance
              </Button>
            )}
            {onCheckIn && (
              <Button
                variant="tonal"
                size="sm"
                fullWidth
                onClick={e => { e.stopPropagation(); onCheckIn(); }}
              >
                Check in now
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
