import { MdPersonOutline, MdAccessTime } from "react-icons/md";
import { motion } from "framer-motion";
import Badge from "./Badge";
import Button from "./Button";

export default function TimelineEventExpanded({
  title = "DV300 - Theory",
  subtitle = "Project Proposal Pitch",
  lecturer = "Tsungai Katsuro",
  duration = "60min",
  location = "Online",
  timeRange = "11:00 - 12:00",
  isPast = false,
  onManageAttendance = null,
  onCheckIn = null,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex-1 pb-5 transition-opacity duration-300 ${isPast ? "opacity-50" : "opacity-100"}`}
    >
      <p className={`mb-2.5 ml-0.5 text-koru-label tabular-nums ${isPast ? "text-koru-on-surface-variant line-through" : "text-koru-on-surface"}`}>
        {timeRange}
      </p>

      <div className={`overflow-hidden rounded-koru-md transition-shadow duration-200 ease-koru-out ${isPast ? "bg-koru-surface-container" : "bg-koru-primary-container hover:shadow-koru-card-hover"}`}>
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-koru-heading leading-tight text-koru-on-primary-container">{title}</h3>
              <p className="mt-1 text-sm text-koru-on-surface-variant">{subtitle}</p>
            </div>
            <Badge size="md" className={isPast ? "shrink-0" : "shrink-0 !bg-koru-surface-container-lowest !text-koru-primary"}>
              {location}
            </Badge>
          </div>

          <div className="flex items-center justify-between border-t border-koru-on-primary-container/10 pt-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isPast ? "bg-koru-surface-container-high" : "bg-koru-surface-container-lowest"}`}>
                <MdPersonOutline className={`h-5 w-5 ${isPast ? "text-koru-on-surface-variant" : "text-koru-primary"}`} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-koru-caption leading-tight text-koru-on-surface-variant">Lecturer</span>
                <span className="text-sm font-medium leading-tight text-koru-on-surface">{lecturer}</span>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 rounded-koru-pill px-3 py-1.5 ${isPast ? "bg-koru-surface-container-high" : "bg-koru-surface-container-lowest"}`}>
              <MdAccessTime className="h-4 w-4 text-koru-on-surface-variant" aria-hidden="true" />
              <span className="text-sm font-medium text-koru-on-surface">{duration}</span>
            </div>
          </div>

          {/* Attendance actions */}
          {!isPast && (onManageAttendance || onCheckIn) && (
            <div className="mt-3 border-t border-koru-on-primary-container/10 pt-3">
              {onManageAttendance && (
                <Button
                  fullWidth
                  onClick={e => { e.stopPropagation(); onManageAttendance(); }}
                >
                  Manage attendance
                </Button>
              )}
              {onCheckIn && (
                <Button
                  fullWidth
                  onClick={e => { e.stopPropagation(); onCheckIn(); }}
                >
                  Check in now
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
