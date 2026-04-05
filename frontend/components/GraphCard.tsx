"use client";
import { Droplets } from "lucide-react";

interface GraphCardProps {
  weather: any;
  loading: boolean;
  status: { label: string; bgGradient: string; textColor: string };
}

export default function GraphCard({
  weather,
  loading,
  status,
}: GraphCardProps) {
  const hourlyData = weather?.hourly?.slice(0, 5) || [];

  const getPoints = () => {
    if (hourlyData.length === 0) return "";

    const width = 300;
    const height = 160;
    const paddingTop = 10;
    const paddingBottom = 10;

    const usableHeight = height - paddingTop - paddingBottom;

    const spacing = hourlyData.length > 1 ? width / (hourlyData.length - 1) : 0;

    return hourlyData
      .map((data: any, i: number) => {
        const x = i * spacing;
        const y = paddingTop + (1 - data.humidity / 100) * usableHeight;

        return `${x},${y}`;
      })
      .join(" ");
  };

  if (loading) {
    return (
      <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />
    );
  }

  return (
    <div
      className={`w-full h-75 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br ${status.bgGradient} text-white shadow-xl relative overflow-hidden transition-all duration-700`}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-1.5 opacity-80">
          <Droplets size={12} strokeWidth={3} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            Humidity Graph
          </p>
        </div>

        <div className="flex-grow flex flex-col justify-end">
          <div className="relative h-40 w-full p-2">
            <svg
              viewBox="0 0 300 160"
              className="w-full h-full drop-shadow-lg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Border */}
              <rect
                x="0"
                y="0"
                width="300"
                height="160"
                fill="none"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="2"
                rx="8"
              />

              {/* Horizontal Grid */}
              {[0, 25, 50, 75, 100].map((val, i) => {
                const y = 160 - (val / 100) * 160;
                return (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={y}
                    x2="300"
                    y2={y}
                    stroke="white"
                    strokeOpacity={val === 50 ? 0.25 : 0.1}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Vertical Grid */}
              {hourlyData.map((_: any, i: number) => {
                const spacing =
                  hourlyData.length > 1 ? 300 / (hourlyData.length - 1) : 0;

                const x = i * spacing;

                return (
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="160"
                    stroke="white"
                    strokeOpacity="0.1"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area */}
              <path
                d={`M 0,160 L ${getPoints()} L 300,160 Z`}
                fill="url(#areaGrad)"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPoints()}
                className="opacity-90"
              />
            </svg>
          </div>

          <div className="flex justify-between mt-4 px-1">
            {hourlyData.map((data: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-[10px] font-black italic">
                  {data.humidity}%
                </p>
                <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">
                  {new Date(data.time * 1000).toLocaleTimeString([], {
                    hour: "numeric",
                    hour12: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
