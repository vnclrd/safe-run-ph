"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

// Define the shape of the data returning from your Cloud Function
interface WeatherData {
  temp: number;
  heatIndex: number;
}

export default function WeatherBadge() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveWeather() {
      try {
        // 1. Reference the deployed 'getLiveWeather' function
        const getLiveWeather = httpsCallable(functions, "getLiveWeather");
        
        // 2. Call the function
        const result = await getLiveWeather();
        
        // 3. Cast the data (now contains both temp and heatIndex)
        const data = result.data as WeatherData;
        setWeather(data);
      } catch (err) {
        console.error("Cloud Function Error:", err);
        // Safe fallbacks for Metro Manila if the API fails
        setWeather({ temp: 31, heatIndex: 35 }); 
      } finally {
        setLoading(false);
      }
    }

    fetchLiveWeather();
  }, []);

  const getStatus = (index: number) => {
    if (index >= 41) return { 
      label: "DANGER", 
      color: "from-red-600 to-rose-700"
    };
    if (index >= 33) return { 
      label: "CAUTION", 
      color: "from-amber-400 to-orange-500" 
    };
    return { 
      label: "GOOD", 
      color: "from-emerald-500 to-teal-600"
    };
  };

  // Loading State
  if (loading) {
    return (
      <div className="w-80 h-75 rounded-[2rem] bg-slate-200 animate-pulse shadow-2xl" />
    );
  }

  // Fallback to default if weather is null
  const heatIndex = weather?.heatIndex ?? 35;
  const temp = weather?.temp ?? 31;
  const status = getStatus(heatIndex);

  return (
    <div className={`w-80 h-75 flex flex-col justify-between p-8 rounded-[2rem] text-white bg-gradient-to-br ${status.color} shadow-2xl relative overflow-hidden transition-all duration-700`}>
      <div className="relative z-10">
        
        {/* Header */}
        <p className="text-xs font-black opacity-70 uppercase tracking-[0.2em]">
          Metro Manila Heat Index
        </p>
        
        {/* Big Heat Index (Hero Number) */}
        <div className="mt-4 mb-2flex items-baseline">
          <h2 className="text-[125px] font-black tracking-tighter leading-none">
            {heatIndex}<span className="text-4xl ml-1">°C</span>
          </h2>
        </div>

        {/* Actual Temperature Subtext */}
        <p className="text-lg font-bold opacity-80 -mt-2 mb-6">
          Feels Like: <span className="font-black">{temp}°C</span>
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