"use client";
import { useEffect, useRef, useState } from "react";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && weather?.hourly) {
      const timer = setTimeout(() => setIsVisible(true), 100);

      if (nowRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const target = nowRef.current;

        const scrollPos =
          target.offsetLeft -
          container.offsetWidth / 2 +
          target.offsetWidth / 2;

        container.scrollLeft = scrollPos;
      }
      return () => clearTimeout(timer);
    }
  }, [loading, weather]);

  const scrollByAmount = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (loading || !weather?.hourly) return null;

  const currentHour = new Date().getHours();
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getAccentBg = () => {
    switch (status.label) {
      case "DANGER":
        return "bg-red-950/80 border-red-500/40";
      case "CAUTION":
        return "bg-amber-950/80 border-amber-500/40";
      case "GOOD":
        return "bg-emerald-950/80 border-emerald-500/40";
      case "CHILLY":
        return "bg-blue-950/80 border-blue-500/40";
      default:
        return "bg-black/20 border-white/10";
    }
  };

  const getInnerAccentBg = () => {
    switch (status.label) {
      case "DANGER":
        return "bg-black/40 border-red-900/20";
      case "CAUTION":
        return "bg-black/40 border-amber-900/20";
      case "GOOD":
        return "bg-black/40 border-emerald-900/20";
      case "CHILLY":
        return "bg-black/40 border-blue-900/20";
      default:
        return "bg-black/40 border-white/5";
    }
  };

  return (
    <div
      className={`w-full h-75 ${getAccentBg()} backdrop-blur-xl border rounded-[2rem] shadow-2xl overflow-hidden p-6 flex flex-col justify-center transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="flex flex-col items-center gap-1 mb-4 text-white text-center">
        <h3 className="text-[20px] sm:text-[24px] font-black uppercase tracking-tight leading-none">
          Hourly Temperature Forecast
        </h3>
        <h3 className="text-[10px] sm:text-[12px] opacity-50 font-medium uppercase tracking-widest mt-1">
          {todayDate}
        </h3>
      </div>

      <div className="relative group">
        <button
          onClick={() => scrollByAmount("left")}
          className="absolute left-0 top-0 bottom-0 w-16 z-20 cursor-pointer"
          aria-label="Scroll Left"
        />

        <button
          onClick={() => scrollByAmount("right")}
          className="absolute right-0 top-0 bottom-0 w-16 z-20 cursor-pointer"
          aria-label="Scroll Right"
        />

        <div
          ref={scrollRef}
          className={`${getInnerAccentBg()} border flex overflow-x-auto gap-1.5 p-2 scrollbar-hide rounded-[1.5rem] relative`}
        >
          {weather.hourly.map((h: any, i: number) => {
            const isNow = h.time === currentHour;

            return (
              <div
                key={i}
                ref={isNow ? nowRef : null}
                className={`flex flex-col items-center min-w-[65px] py-3 rounded-2xl transition-all ${
                  isNow
                    ? `bg-white/10 ring-1 ring-white/30`
                    : "hover:bg-white/5"
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter mb-2 ${isNow ? status.textColor : "text-white/60"}`}
                >
                  {isNow
                    ? "Now"
                    : `${h.time % 12 || 12}${h.time >= 12 ? "PM" : "AM"}`}
                </span>

                <span className="text-2xl mt-1">
                  {getWeatherIcon(h.code, h.time)}
                </span>

                <span
                  className={`text-[8px] font-bold ${h.pop > 0 ? "text-sky-400" : "opacity-0"}`}
                >
                  {h.pop}%
                </span>

                <span className="text-base font-black text-white">
                  {h.temp}°
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
