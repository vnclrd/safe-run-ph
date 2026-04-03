"use client";

// 1. Define the "Shape" of the data the card needs
interface WeatherForecastProps {
  weather: any; 
  loading: boolean;
}

// 2. Tell the function to expect these props
export default function WeatherForecastCard({ weather, loading }: WeatherForecastProps) {
  if (loading || !weather?.hourly) {
    return (
      <div className="w-full h-40 bg-black/10 backdrop-blur-xl rounded-[2rem] animate-pulse flex items-center justify-center">
        <p className="text-white/20 font-black uppercase text-xs tracking-widest">Loading Forecast...</p>
      </div>
    );
  }

  const currentHour = new Date().getHours();

  // Helper to map weather codes to icons
  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 95) return "⚡";
    return "☁️";
  };

  return (
    <div className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-700 p-6">
      <div className="flex items-center gap-2 mb-6 px-2 text-white/50">
        <span className="text-xs">🕒</span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Hourly Forecast</h3>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
        {weather.hourly.map((h: any, i: number) => {
          const isNow = h.time === currentHour;
          return (
            <div 
              key={i} 
              className={`flex flex-col items-center min-w-[70px] py-4 rounded-2xl transition-all ${
                isNow ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
              }`}
            >
              <span className="text-[11px] font-black text-white uppercase tracking-tighter mb-3">
                {isNow ? "Now" : `${h.time % 12 || 12}${h.time >= 12 ? 'PM' : 'AM'}`}
              </span>
              <span className="text-2xl mb-1">{getWeatherIcon(h.code)}</span>
              <span className={`text-[9px] font-bold mb-3 ${h.pop > 0 ? 'text-sky-400' : 'opacity-0'}`}>
                {h.pop}%
              </span>
              <span className="text-lg font-black text-white">{h.temp}°</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-widest px-2">
        <span>L:{weather.todayLo}°  H:{weather.todayHi}°</span>
        <span>Open-Meteo Data</span>
      </div>
    </div>
  );
}