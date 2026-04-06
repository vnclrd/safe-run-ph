"use client";
import React from "react";
import { Droplets, CloudRain, Sun, Wind } from "lucide-react";

interface MiniMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  description: string;
  colorClass: string;
  icon: React.ElementType;
  progress?: number;
  compact?: boolean;
}

function MiniMetricCard({
  label,
  value,
  subtitle,
  description,
  colorClass,
  icon: Icon,
  progress,
  compact,
}: MiniMetricCardProps) {

  const isHex = colorClass?.startsWith("#");

  return (
    <div
      className={`flex flex-col justify-center items-center p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-700 ${
        compact ? "gap-1" : "gap-2"
      }`}
    >
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {Icon && <Icon size={12} strokeWidth={3} />}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </p>
      </div>

      <div className="flex flex-col items-center leading-none">
        <p 
          className={`text-3xl sm:text-2xl font-black italic ${!isHex ? colorClass : ""}`}
          style={{ color: isHex ? colorClass : undefined }}
        >
          {value}
        </p>
        {subtitle && (
          <p 
            className={`text-[10px] font-black uppercase tracking-wider mt-1 opacity-80 ${!isHex ? colorClass : ""}`}
            style={{ color: isHex ? colorClass : undefined }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Render progress bar if a progress value is provided */}
      {progress !== undefined && (
        <div className="w-full h-1.5 min-h-[6px] bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-50 flex">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.max(0, Math.min(progress, 100))}%`,
              // 5-color sequence: Emerald -> Amber -> Orange -> Rose -> Violet
              backgroundImage: "linear-gradient(to right, #34d399, #fbbf24, #f97316, #f43f5e, #ff00ff )",
              // This magic line ensures the gradient is always the size of the 100% width parent
              backgroundSize: progress > 0 ? `${(100 / progress) * 100}% 100%` : "100% 100%",
              backgroundRepeat: "no-repeat"
            }}
          />
        </div>
      )}

      <p className="text-[10px] font-medium text-slate-400 mt-2 text-center leading-tight">
        {description}
      </p>
    </div>
  );
}

interface MetricGridProps {
  weather: any;
  loading: boolean;
  humidity: { desc: string; color: string };
  precip: { desc: string; color: string };
  currentUv: { desc: string; color: string; percent: number; status: string };
  wind: { desc: string; color: string };
}

export default function MetricGrid({
  weather,
  loading,
  humidity,
  precip,
  currentUv,
  wind,
}: MetricGridProps) {
  return (
    <div className="w-full h-75 grid grid-cols-2 grid-rows-2 gap-4">
      <MiniMetricCard
        label="Humidity"
        icon={CloudRain}
        value={loading ? "---" : `${weather?.humidity || 0}%`}
        description={loading ? "" : humidity.desc}
        colorClass={loading ? "text-slate-400" : humidity.color}
      />
      <MiniMetricCard
        label="Precipitation"
        icon={Droplets}
        value={loading ? "---" : `${weather?.precip || 0}mm`}
        description={loading ? "" : precip.desc}
        colorClass={loading ? "text-slate-400" : precip.color}
      />
      <MiniMetricCard
        label="UV Index"
        icon={Sun}
        value={loading ? "---" : weather?.uvIndex || 0}
        subtitle={loading ? "" : currentUv.status}
        description={loading ? "" : currentUv.desc}
        colorClass={loading ? "text-slate-400" : currentUv.color}
        progress={loading ? 0 : currentUv.percent}
        compact
      />
      <MiniMetricCard
        label="Wind Speed"
        icon={Wind}
        value={loading ? "---" : `${weather?.windSpeed || 0}km/h`}
        subtitle={
          loading
            ? ""
            : `${weather?.windDirectionDeg}° ${weather?.windDirection}`
        }
        description={loading ? "" : wind.desc}
        colorClass={loading ? "text-slate-400" : wind.color}
      />
    </div>
  );
}
