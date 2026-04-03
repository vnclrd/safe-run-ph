"use client";

interface WeatherBadgeProps {
  weather: { temp: number; heatIndex: number } | null;
  loading: boolean;
  status: {
    label: string;
    bgGradient: string;
    textColor: string;
  };
}

export default function WeatherBadge({ weather, loading, status }: WeatherBadgeProps) {
  
  // Loading State
  if (loading) {
    return (
      <div className="w-80 h-75 rounded-[2rem] bg-slate-200 animate-pulse shadow-2xl" />
    );
  }

  // Fallback to default if weather is null
  const heatIndex = weather?.heatIndex ?? "N/A";
  const temp = weather?.temp ?? "N/A";

  return (
    <div className={`w-80 h-75 flex flex-col justify-between p-8 rounded-[2rem] text-white bg-gradient-to-br ${status.bgGradient} shadow-2xl relative overflow-hidden transition-all duration-700`}>
      <div className="relative z-10">
        
        {/* Header */}
        <p className="text-xs font-black opacity-70 uppercase tracking-[0.2em]">
          Metro Manila Heat Index
        </p>
        
        {/* Big Heat Index (Hero Number) */}
        <div className="mt-4 mb-2 flex items-baseline">
          <h2 className="text-[125px] font-black tracking-tighter leading-none">
            {heatIndex}<span className="text-4xl ml-1">°C</span>
          </h2>
        </div>

        {/* Actual Temperature Subtext */}
        <p className="text-lg font-bold opacity-80 -mt-2 mb-6">
          Actual: <span className="font-black">{temp}°C</span>
        </p>

        {/* Status Label */}
        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-fit px-5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
            {status.label}
          </span>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
    </div>
  );
}