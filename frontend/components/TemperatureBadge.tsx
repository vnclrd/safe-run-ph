"use client";

interface TemperatureBadgeProps {
  weather: { temp: number; heatIndex: number } | null;
  loading: boolean;
  status: { label: string; bgGradient: string; textColor: string };
}

export default function TemperatureBadge({
  weather,
  loading,
  status,
}: TemperatureBadgeProps) {
  if (loading) {
    return (
      <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />
    );
  }

  return (
    <div
      className={`w-full h-75 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br ${status.bgGradient} text-white shadow-xl relative overflow-hidden transition-all duration-700`}
    >
      <div className="relative z-10 flex flex-col justify-between h-full items-center sm:items-start text-center sm:text-left">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
            Temperature in Metro Manila
          </p>

          <div className="flex items-baseline gap-1 justify-center sm:justify-start">
            <span className="text-9xl sm:text-8xl md:text-9xl mt-6 sm:mt-0 md:mt-2 font-black tracking-tighter">
              {weather?.temp}
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black opacity-80">
              °C
            </span>
          </div>

          <p className="text-base sm:text-lg font-bold opacity-90 mt-0 md:mt-0">
            Heat Index: {weather?.heatIndex}°C
          </p>
        </div>




        <div className="flex justify-center sm:justify-start">
          <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20">
            {status.label}
          </span>
        </div>



      </div>
    </div>
  );
}
