"use client";
import React from "react";
import { Droplets, CloudRain, Sun, Wind } from "lucide-react";

interface MiniMetricCardProps {
  label: string;
  value: string | number;
  description: string;
  colorClass: string;
  icon: React.ElementType;
  progress?: number;
}

function MiniMetricCard({
  label,
  value,
  description,
  colorClass,
  icon: Icon,
  progress,
}: MiniMetricCardProps) {
  return (
    <div className="gap-2 flex flex-col justify-center items-center p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-700">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {Icon && <Icon size={12} strokeWidth={3} />}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </p>
      </div>

      <p
        className={`text-3xl sm:text-2xl font-black italic ${colorClass} leading-none`}
      >
        {value}
      </p>

      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-50">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${progress}%` }}
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
  uv: { desc: string; color: string; percent: number };
  wind: { desc: string; color: string };
}

export default function MetricGrid({
  weather,
  loading,
  humidity,
  precip,
  uv,
  wind,
}: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-75">
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
        description={loading ? "" : uv.desc}
        colorClass={loading ? "text-slate-400" : uv.color}
        progress={loading ? 0 : uv.percent}
      />
      <MiniMetricCard
        label="Wind Speed"
        icon={Wind}
        value={loading ? "---" : `${weather?.windSpeed || 0}km/h`}
        description={loading ? "" : wind.desc}
        colorClass={loading ? "text-slate-400" : wind.color}
      />
    </div>
  );
}
