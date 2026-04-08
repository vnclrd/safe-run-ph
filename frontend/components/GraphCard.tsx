"use client";
import { useEffect, useState } from "react"; 
import { Droplets, CloudRain, Sun } from "lucide-react"; 

interface GraphCardProps {
  weather: any;
  loading: boolean;
  status: { label: string; bgColor: string; textColor: string };
}

export default function GraphCard({
  weather,
  loading,
  status,
}: GraphCardProps) {
  //  1. Updated state to include "uv"
  const [graphType, setGraphType] = useState<"humidity" | "precip" | "uv">("humidity"); 

  //  2. Updated interval to cycle through three graphs every 10 seconds
  useEffect(() => { 
    const interval = setInterval(() => { 
      setGraphType((prev) => { 
        if (prev === "humidity") return "precip"; 
        if (prev === "precip") return "uv"; 
        return "humidity"; 
      }); 
    }, 5000); 
    return () => clearInterval(interval); 
  }, []); 

  const currentHour = new Date().getHours();
  const startIndex = weather?.hourly?.findIndex(
    (h: any) => new Date(h.time * 1000).getHours() === currentHour
  );

  const hourlyDataRaw = (weather?.hourly && startIndex !== -1 && startIndex !== undefined)
    ? weather.hourly.slice(startIndex, startIndex + 5)
    : (weather?.hourly?.slice(0, 5) || []);

  const hourlyData = hourlyDataRaw.map((data: any, i: number) => {
    if (i === 0) {
      return {
        ...data,
        humidity: weather?.humidity ?? data.humidity,
        precip: weather?.precip ?? data.precip,
        uvIndex: weather?.uvIndex ?? data.uvIndex  //  Syncing current UV index
      };
    }
    return data;
  });

  const getCurvePath = (isArea: boolean = false) => {
    if (hourlyData.length === 0) return "";

    const width = 300;
    const height = 160;
    const paddingTop = 10;
    const paddingBottom = 10;
    const usableHeight = height - paddingTop - paddingBottom;
    const spacing = hourlyData.length > 1 ? width / (hourlyData.length - 1) : 0;

    const points = hourlyData.map((data: any, i: number) => {
      //  logic to switch metric values and max scales
      let val = data.humidity; 
      let maxVal = 100; 

      if (graphType === "precip") { 
        val = data.precip; 
        maxVal = Math.max(5, ...hourlyData.map((d: any) => d.precip)); 
      } else if (graphType === "uv") { 
        val = data.uvIndex; 
        maxVal = 11; //  UV Index uses a standard scale of 0-11+ 
      } 

      return {
        x: i * spacing,
        y: paddingTop + (1 - Math.min(val / maxVal, 1)) * usableHeight,  //  Added clamp to prevent line-break 
      };
    });

    const command = (point: { x: number, y: number }, i: number, a: any[]) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const smoothing = 0.15;
      const prev = a[i - 1];
      const next = a[i + 1] || point;
      const prevPrev = a[i - 2] || prev;
      const cp1x = prev.x + (point.x - prevPrev.x) * smoothing;
      const cp1y = prev.y + (point.y - prevPrev.y) * smoothing;
      const cp2x = point.x - (next.x - prev.x) * smoothing;
      const cp2y = point.y - (next.y - prev.y) * smoothing;
      return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    };

    const d = points.map((p: { x: number; y: number }, i: number, a: { x: number; y: number }[]) => command(p, i, a)).join(" ");
    return isArea ? `${d} L 300,160 L 0,160 Z` : d;
  };

  if (loading) {
    return (
      <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />
    );
  }

  return (
    <div
      className={`w-full h-75 p-6 sm:p-8 rounded-[2rem] ${status.bgColor} bg-opacity-90 bg-gradient-to-b from-white/10 to-transparent text-white shadow-xl relative overflow-hidden transition-all duration-700`}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/*  Header with dynamic icons for all 3 types */}
        <div className="flex items-center gap-1.5 opacity-80 transition-all duration-500"> 
          {graphType === "humidity" && <Droplets size={12} strokeWidth={3} />} 
          {graphType === "precip" && <CloudRain size={12} strokeWidth={3} />} 
          {graphType === "uv" && <Sun size={12} strokeWidth={3} />} 
          <p className="text-[10px] font-black uppercase tracking-[0.2em]"> 
            {graphType === "humidity" && "Humidity Forecast"} 
            {graphType === "precip" && "Precipitation Forecast"} 
            {graphType === "uv" && "UV Index Forecast"} 
          </p> 
        </div> 

        <div className="flex-grow flex flex-col justify-end">
          <div className="relative h-40 w-full p-2">
            <svg viewBox="0 0 300 160" className="w-full h-full drop-shadow-lg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="300" height="160" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" rx="8" />
              
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((val, i) => (
                <line key={`h-${i}`} x1="0" y1={160 - (val / 100) * 160} x2="300" y2={160 - (val / 100) * 160} stroke="white" strokeOpacity={val === 50 ? 0.3 : 0.1} strokeWidth="1" strokeDasharray="4 4" />
              ))}
              {hourlyData.map((_: any, i: number) => {
                const x = i * (300 / (hourlyData.length - 1));
                return <line key={`v-${i}`} x1={x} y1="0" x2={x} y2="160" stroke="white" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 4" />;
              })}

              <path d={getCurvePath(true)} fill="url(#areaGrad)" className="transition-all duration-1000 ease-in-out" /> 
              <path d={getCurvePath(false)} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 transition-all duration-1000 ease-in-out" /> 
            </svg>
          </div>

          <div className="flex justify-between mt-4 px-1">
            {hourlyData.map((data: any, i: number) => (
              <div key={i} className="flex flex-col items-center">
                <p className="text-[10px] font-black italic transition-all duration-500"> 
                  {/*  Dynamic Labels for values */}
                  {graphType === "humidity" && `${data.humidity}%`} 
                  {graphType === "precip" && `${data.precip}mm`} 
                  {graphType === "uv" && `UV ${data.uvIndex}`} 
                </p> 
                <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">
                  {new Date(data.time * 1000).toLocaleTimeString([], { hour: "numeric", hour12: true })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}