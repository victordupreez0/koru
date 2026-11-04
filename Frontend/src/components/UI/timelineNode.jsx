// Timeline node – the vertical track element between event cards
// Renders a connecting line above, a dot in the middle, and a connecting line below
// Visual state changes based on whether the event is active (next up), past, first, or last
export default function TimelineNode({ isActive = false, isPast = false, isFirst = false, isLast = false }) {
  // Past events get a lighter connecting line
  const lineColor = isPast ? "bg-koru-outline-faint" : "bg-koru-primary-container";

  return (
    <div className="flex w-6 shrink-0 flex-col items-center">
      {/* Top connecting line – hidden for the first event */}
      {!isFirst ? (
        <div className={`min-h-[20px] w-[2px] flex-1 ${lineColor}`} />
      ) : (
        <div className="min-h-[20px] flex-1" />
      )}

      {/* Centre dot – active = large primary, past = grey filled, future = outlined */}
      <div
        className={`shrink-0 rounded-full transition-all duration-300 ease-koru-out ${
          isActive
            ? "h-4 w-4 bg-koru-primary ring-4 ring-koru-primary/12"
            : isPast
            ? "h-3 w-3 bg-koru-outline-variant"
            : "h-3 w-3 border-2 border-koru-primary/40 bg-koru-surface-container-lowest"
        }`}
      />

      {/* Bottom connecting line – hidden for the last event */}
      {!isLast ? (
        <div className={`min-h-[20px] w-[2px] flex-1 ${lineColor}`} />
      ) : (
        <div className="min-h-[20px] flex-1" />
      )}
    </div>
  );
}
