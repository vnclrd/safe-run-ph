"use client";

// 1. Updated Props to include 'status'
interface WeatherForecastProps {
  weather: any;
  loading: boolean;
  status: { bgGradient: string; textColor: string; label: string };
}

const getWeatherIcon = (code: number, hour: number) => {
  const isNight = hour < 6 || hour >= 18;
  if (code === 0) return isNight ? "🌙" : "☀️";
  if (code <= 3) return isNight ? "🌔" : "⛅";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 95) return "⚡";
  return isNight ? "☁️" : "☁️";
};

export default function WeatherForecastCard({
  weather,
  loading,
  status,
}: WeatherForecastProps) {
  if (loading || !weather?.hourly) return null;

  const currentHour = new Date().getHours();
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // 🎨 Helper to get the "Slightly Darker" accent background based on status
  const getAccentBg = () => {
    switch (status.label) {
      case "DANGER":
        return "bg-red-950/80 border-red-500/40";
      case "CAUTION":
        return "bg-amber-950/80 border-amber-500/40";
      case "GOOD":
        return "bg-emerald-950/80 border-emerald-500/40";
      default:
        return "bg-black/20 border-white/10";
    }
  };

  const getInnerAccentBg = () => {
    switch (status.label) {
      case "DANGER": return "bg-black/40 border-red-900/20";
      case "CAUTION": return "bg-black/40 border-amber-900/20";
      case "GOOD": return "bg-black/40 border-emerald-900/20";
      default: return "bg-black/40 border-white/5";
    }
  };

  return (
    // Dynamic background color based on temperature
    <div
      className={`w-full ${getAccentBg()} backdrop-blur-xl border rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-700 p-5`}
    >
      <div className="flex flex-col items-center gap-1 mb-6 text-white text-center">
        <h3 className="text-[24px] font-black uppercase tracking-tight">
          Hourly Forecast
        </h3>
        <h3 className="text-[12px] opacity-50 font-medium uppercase tracking-widest">
          {todayDate}
        </h3>
      </div>

      <div className={`${getInnerAccentBg()} border flex overflow-x-auto gap-1.5 p-2 scrollbar-hide rounded-[1.5rem]`}>
        {weather.hourly.map((h: any, i: number) => {
          const isNow = h.time === currentHour;

          return (
            <div
              key={i}
              // ⚡ Now indicator uses a subtle version of the status text color
              className={`flex flex-col items-center min-w-[65px] py-3 rounded-2xl transition-all ${
                isNow ? `bg-white/10 ring-1 ring-white/30` : "hover:bg-white/5"
              }`}
            >
              <span
                className={`text-[10px] font-black uppercase tracking-tighter mb-2 ${isNow ? "text-white" : "text-white/60"}`}
              >
                {isNow
                  ? "Now"
                  : `${h.time % 12 || 12}${h.time >= 12 ? "PM" : "AM"}`}
              </span>

              <span className="text-xl mb-0.5">
                {getWeatherIcon(h.code, h.time)}
              </span>

              <span
                className={`text-[8px] font-bold mb-2 ${h.pop > 0 ? "text-sky-400" : "opacity-0"}`}
              >
                {h.pop}%
              </span>

              <span className="text-base font-black text-white">{h.temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
