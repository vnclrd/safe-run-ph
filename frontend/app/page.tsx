"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureBadge from '@/components/TemperatureBadge';
import RunCommendation from '@/components/RunCommendation';

export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    async function initWeather() {
      try {
        const getLiveWeather = httpsCallable(functions, "getLiveWeather");
        const result = await getLiveWeather() as any;
        
        setWeather(result.data);
        setWeatherLoading(false);

        const getRunRecommendation = httpsCallable(functions, "getRunRecommendation");
        const aiResult = await getRunRecommendation({ 
          temp: result.data.temp, 
          heatIndex: result.data.heatIndex 
        }) as any;

        setRecommendation(aiResult.data.recommendation);
      } catch (err) {
        console.error(err);
      } finally {
        setAiLoading(false);
      }
    }
    initWeather();
  }, []);

  const getStatus = (index: number) => {
    if (index >= 41) return { label: "DANGER", bgGradient: "from-red-600 to-rose-700", textColor: "text-red-600" };
    if (index >= 33) return { label: "CAUTION", bgGradient: "from-amber-400 to-orange-500", textColor: "text-orange-500" };
    return { label: "GOOD", bgGradient: "from-emerald-500 to-teal-600", textColor: "text-emerald-600" };
  };

  const status = getStatus(weather?.heatIndex || 35);

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-[1001] border-b border-slate-100 py-6 px-10">
        <h1 className={`text-2xl font-black italic uppercase transition-colors duration-700 ${status.textColor}`}>
          SAFE-RUN PH
        </h1>
      </nav>

      <div className="max-w-6xl mx-auto p-8 md:p-16 space-y-20">
        <section className="grid lg:grid-cols-3 gap-8 items-start">
          <TemperatureBadge weather={weather} loading={weatherLoading} status={status} />
          <div className="lg:col-span-2">
            <RunCommendation recommendation={recommendation} loading={aiLoading} status={status} />
          </div>
        </section>
      </div>
    </main>
  );
}