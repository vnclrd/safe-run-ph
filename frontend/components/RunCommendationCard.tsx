"use client";

type TimeOfDay = "umaga" | "tanghali" | "hapon" | "gabi" | "madaling araw";
 
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 11) return "umaga";
  if (hour >= 11 && hour < 14) return "tanghali";
  if (hour >= 14 && hour < 18) return "hapon";
  if (hour >= 18 && hour < 24) return "gabi";
  return "madaling araw";
}

function applyTimeOfDay(message: string, timeOfDay: TimeOfDay): string {
  // Replace "today" and "ngayong araw" with the time-specific phrase
  return message
    .replace(/\btoday\b/g, `ngayong ${timeOfDay}`)
    .replace(/ngayong araw/g, `ngayong ${timeOfDay}`);
}

export default function RunCommendation({
  recommendation,
  loading,
  status,
  timeOfDay,
}: any) {
  const getMessageSize = (text: string) => {
    const length = text?.length || 0;
    if (length < 60) return "text-xl sm:text-2xl";
    if (length < 120) return "text-md sm:text-xl";
    if (length < 180) return "text-base sm:text-lg";
    return "text-sm sm:text-base";
  };

  const processedMessage =
    recommendation?.message && timeOfDay
      ? applyTimeOfDay(recommendation.message, timeOfDay)
      : recommendation?.message;

  if (loading) {
    return (
      <div className="w-full h-75 flex flex-col justify-between p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-slate-50/50 to-transparent -translate-x-full animate-shimmer" />
        <div className="relative z-10 space-y-6">
          <div className="h-2 w-24 bg-slate-100 rounded-full" />
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-slate-100 rounded-xl" />
            <div className="h-8 w-1/2 bg-slate-100 rounded-xl" />
          </div>
          <div className="space-y-3 py-4">
            <div className="h-4 w-full bg-slate-50 rounded-lg" />
            <div className="h-4 w-5/6 bg-slate-50 rounded-lg" />
          </div>
          <div className="h-2 w-32 bg-slate-100 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-75 flex flex-col p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-700">
      <div
        className={`relative z-10 flex flex-col h-full transition-all duration-1000 ease-out transform ${
          !recommendation
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        {/* 1. Top Label */}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left mb-2">
          RunCommendation
        </p>

        {/* 2. Middle Content */}
        <div className="flex-grow flex flex-col justify-center items-center sm:items-start space-y-2 sm:space-y-4 overflow-hidden">
          <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-none text-center sm:text-left 
            bg-gradient-to-r ${status.bgGradient} bg-clip-text text-transparent`}>
            {recommendation?.title}
          </h2>

          <p
            className={`
              ${getMessageSize(processedMessage)} 
              font-bold text-slate-600 leading-tight sm:leading-relaxed text-center sm:text-left
              line-clamp-4
            `}
          >
            {processedMessage}
          </p>
        </div>
      </div>

      {/* Progress Line */}
      <div
        className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r transition-opacity duration-1000 ease-out ${
          !recommendation ? "opacity-0" : "opacity-100"
        } ${status.bgGradient}`}
      />
    </div>
  );
}