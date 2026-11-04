import { MdEventNote } from "react-icons/md";

export default function NextClassItem({ subject = "UX300", time = "09:00 - 13:00", room = "Room 101", date = "" }) {
  const subtitle = [date, time, room].filter(Boolean).join(" · ");
  return (
    <div className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 text-left shadow-koru-card ring-1 ring-inset ring-koru-outline-faint">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koru-accent-soft">
        <MdEventNote className="h-5 w-5 text-koru-accent" aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <h3 className="truncate text-koru-label text-koru-on-surface">{subject}</h3>
        <p className="truncate text-koru-caption text-koru-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  );
}
