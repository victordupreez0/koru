export default function TimelineNode({ isActive = false, isPast = false, isFirst = false, isLast = false }) {
  const lineColor = isPast ? "bg-gray-200" : "bg-gray-300";

  return (
    <div className="flex flex-col items-center w-6 shrink-0">
      {/* Top line */}
      {!isFirst ? (
        <div className={`w-[2px] flex-1 min-h-[20px] ${lineColor}`} />
      ) : (
        <div className="flex-1 min-h-[20px]" />
      )}

      {/* Dot */}
      <div
        className={`rounded-full shrink-0 transition-all duration-300 ${
          isActive
            ? "w-4 h-4 bg-[#3C0078] shadow-[0_0_0_4px_rgba(60,0,120,0.12)]"
            : isPast
            ? "w-3 h-3 bg-gray-300"
            : "w-3 h-3 border-2 border-gray-300 bg-white"
        }`}
      />

      {/* Bottom line */}
      {!isLast ? (
        <div className={`w-[2px] flex-1 min-h-[20px] ${lineColor}`} />
      ) : (
        <div className="flex-1 min-h-[20px]" />
      )}
    </div>
  );
}

