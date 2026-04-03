"use client";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import WeatherBadge from '@/components/WeatherBadge';

const MapPreview = dynamic(() => import('@/components/MapPreview'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-slate-200 animate-pulse rounded-[3rem]" />
});

// Types for synchronization
interface WeatherData {
  temp: number;
  heatIndex: number;
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveWeather() {
      try {
        const getLiveWeather = httpsCallable(functions, "getLiveWeather");
        const result = await getLiveWeather();
        setWeather(result.data as WeatherData);
      } catch (err) {
        console.error("Cloud Function Error:", err);
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
      bgGradient: "from-red-600 to-rose-700",
      textColor: "text-red-600"
    };
    if (index >= 33) return { 
      label: "CAUTION", 
      bgGradient: "from-amber-400 to-orange-500",
      textColor: "text-orange-500"
    };
    return { 
      label: "GOOD", 
      bgGradient: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-600"
    };
  };

  const status = getStatus(weather?.heatIndex || 35);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      {/* Dynamic Header */}
      <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-[1001] border-b border-slate-100 py-6 px-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-black tracking-tighter italic uppercase transition-colors duration-700 ${status.textColor}`}>
              SAFE-RUN PH
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 md:p-16 space-y-20">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Pass the data down as props */}
            <WeatherBadge weather={weather} loading={loading} status={status} />
          </div>
        </section>
      </div>

      <footer className="py-20 text-center border-t border-slate-100 bg-white mt-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.8em] transition-colors duration-700 ${status.textColor} opacity-30`}>
          Safe-Run PH
        </p>
      </footer>
    </main>
  );
}