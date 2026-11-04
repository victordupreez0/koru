import { MdPersonOutline } from "react-icons/md";

export default function AnnouncementsItem({
  title = "Prescribed Reading",
  message = "Hi everyone, a quick reminder...",
  time = "11:23AM",
  isRead = true,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="my-2 flex min-h-14 w-full items-center gap-3 rounded-koru-md bg-koru-surface-container-lowest px-3 py-2.5 text-left shadow-koru-card ring-1 ring-inset ring-koru-outline-faint cursor-pointer transition duration-150 ease-koru-out hover:bg-koru-surface-container-low hover:shadow-koru-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koru-primary-container/60 text-koru-primary">
        <MdPersonOutline className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {!isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-koru-success" aria-label="Unread" />
          )}
          <h3 className={`truncate text-koru-label ${!isRead ? "text-koru-on-surface" : "text-koru-on-surface-variant"}`}>
            {title}
          </h3>
        </div>
        <p className="truncate text-koru-caption text-koru-on-surface-variant">{message}</p>
      </div>

      <div className="flex shrink-0 items-start self-start pt-0.5">
        <span className="whitespace-nowrap text-koru-caption tabular-nums text-koru-on-surface-variant">{time}</span>
      </div>
    </button>
  );
}
