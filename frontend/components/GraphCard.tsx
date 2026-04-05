"use client";
import { Droplets } from "lucide-react";

interface GraphCardProps {
  weather: any;
  loading: boolean;
  status: { label: string; bgColor: string; textColor: string };
}

export default function GraphCard({ weather, loading, status }: GraphCardProps) {
  // Extracting 5 hours of humidity data
  const hourlyData = weather?.hourly?.slice(0, 5) || [];
  
  // Helper to calculate SVG points for the humidity line
  const getPoints = () => {
    if (hourlyData.length === 0) return "";
    const width = 300;
    const height = 60;
    const padding = 20;
    
    return hourlyData.map((data: any, i: number) => {
      const x = (i * (width / (hourlyData.length - 1)));
      // Normalize humidity (0-100) to graph height
      const y = height - (data.humidity / 100) * height + padding;
      return `${x},${y}`;
    }).join(" ");
  };

  if (loading) {
    return (
      <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />
    );
  }

  return (
    <div
      className={`w-full h-75 p-6 sm:p-8 rounded-[2rem] ${status.bgColor} text-white shadow-xl relative overflow-hidden transition-all duration-700`}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-1.5 opacity-80 mb-6">
          <Droplets size={12} strokeWidth={3} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            Hourly Humidity
          </p>
        </div>

        <div className="flex-grow flex flex-col justify-end">
          <div className="relative h-32 w-full">
            <svg
              viewBox="0 0 300 100"
              className="w-full h-full drop-shadow-lg"
              preserveAspectRatio="none"
            >
              {/* Area Gradient Fill */}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d={`M 0,100 L ${getPoints()} L 300,100 Z`}
                fill="url(#areaGrad)"
                className="transition-all duration-1000"
              />

              {/* Line path */}
              <polyline
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPoints()}
                className="transition-all duration-1000 opacity-90"
              />
            </svg>
          </div>

          {/* Time Labels */}
          <div className="flex justify-between mt-4 px-1">
            {hourlyData.map((data: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-[10px] font-black italic">{data.humidity}%</p>
                <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">
                  {new Date(data.time * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}