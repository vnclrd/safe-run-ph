"use client";

interface TemperatureBadgeProps {
  weather: { temp: number; heatIndex: number } | null;
  loading: boolean;
  status: { label: string; bgGradient: string; textColor: string };
}

export default function TemperatureBadge({ weather, loading, status }: TemperatureBadgeProps) {
  if (loading) {
    return <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />;
  }

  return (
    <div className={`w-full h-75 p-8 rounded-[2rem] bg-gradient-to-br ${status.bgGradient} text-white shadow-xl relative overflow-hidden transition-all duration-700`}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
            Metro Manila Heat Index
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-8xl font-black tracking-tighter">
              {weather?.heatIndex}
            </span>
            <span className="text-4xl font-black opacity-80">°c</span>
          </div>
          <p className="text-sm font-bold opacity-90 mt-2">
            Feels Like: {weather?.temp}°c
          </p>
        </div>
        <div className="flex">
          <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20">
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}