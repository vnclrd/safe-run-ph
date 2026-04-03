"use client";

export default function RunCommendation({
  recommendation,
  loading,
  status,
}: any) {
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
    <div className="w-full h-auto min-h-[18.75rem] md:h-75 flex flex-col p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-700">
      <div
        className={`relative z-10 flex flex-col h-full items-center sm:items-start text-center sm:text-left transition-all duration-1000 ease-out transform ${
          !recommendation ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <p className="w-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          RunCommendation
        </p>

        <div className="flex-grow flex flex-col justify-center items-center sm:items-start">
          <h2
            className={`text-4xl sm:text-5xl md:text-4xl font-black tracking-tight leading-tight mt-2 sm:mt-4 line-clamp-2 ${status.textColor}`}
          >
            {recommendation?.title}
          </h2>
          
          <p className="h-35 text-md sm:text-lg font-bold text-slate-600 leading-relaxed mt-6 sm:mt-6 md:mt-6 md:line-clamp-3">
            {recommendation?.message}
          </p>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r transition-opacity duration-1000 ease-out ${
          !recommendation ? "opacity-0" : "opacity-100"
        } ${status.bgGradient}`}
      />
    </div>
  );
}
