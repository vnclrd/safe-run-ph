"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function WeatherBadge() {
  const [heatIndex, setHeatIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveWeather() {
      try {
        // 1. Reference the deployed 'getLiveWeather' function
        const getLiveWeather = httpsCallable(functions, "getLiveWeather");
        
        // 2. Call the function
        const result = await getLiveWeather();
        
        // 3. Cast and set the data
        const data = result.data as { heatIndex: number };
        setHeatIndex(data.heatIndex);
      } catch (err) {
        console.error("Cloud Function Error:", err);
        setHeatIndex(35); // Safe fallback for Metro Manila
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

  // Loading State (Prevents UI flicker)
  if (loading) {
    return (
      <div className="p-8 rounded-[3rem] bg-slate-200 animate-pulse h-[220px] w-full" />
    );
  }

  const status = getStatus(heatIndex || 35);

  return (
    <div className={`w-80 h-75 flex flex-col justify-between p-8 rounded-[2rem] text-white bg-gradient-to-br ${status.color} shadow-2xl relative overflow-hidden transition-all duration-700`}>
      <div className="relative z-10">

        <p className="text-xs font-black opacity-70 uppercase tracking-[0.2em]">
          Metro Manila Heat Index
        </p>
        
        <div className="flex items-baseline">
          <h2 className="text-[125px] font-black tracking-tighter">
            {heatIndex}<span className="text-4xl ml-1">°C</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-fit px-5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
            {status.label}
          </span>
        </div>
      </div>

      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
    </div>
  );
}