"use client";
import { useState, useEffect } from "react";
import { Thermometer, MapPin, Clock2 } from "lucide-react";
import { getTimeOfDay } from "./RunCommendationCard";

interface TemperatureBadgeProps {
  weather: {
    temp: number;
    heatIndex: number;
    locationLabel: string;
  } | null;
  loading: boolean;
  status: { label: string; bgGradient: string; textColor: string };
  onTimeOfDayChange?: (timeOfDay: ReturnType<typeof getTimeOfDay>) => void;
}

export default function TemperatureBadge({
  weather,
  loading,
  status,
  onTimeOfDayChange,
}: TemperatureBadgeProps) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const formatTime = () => {
      return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    };

    const updateTime = () => {
      const now = new Date();
      setTime(formatTime());
      onTimeOfDayChange?.(getTimeOfDay(now.getHours()));
    };

    // Set initial time immediately on mount
    updateTime();

    // Update time every second
    const timer = setInterval(updateTime, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, [onTimeOfDayChange]);

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
          <div className="flex items-center gap-1.5 opacity-80 mb-1 justify-center sm:justify-start">
            <Thermometer size={12} strokeWidth={3} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Temperature
            </p>
          </div>

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

        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <div className="flex">
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20 whitespace-nowrap">
              <MapPin size={10} strokeWidth={3} />
              {weather?.locationLabel || "Metro Manila"}
            </span>
          </div>

          <div className="flex">
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20 whitespace-nowrap">
              <Clock2 size={10} strokeWidth={3} />
              {time || "--:--:-- --"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}