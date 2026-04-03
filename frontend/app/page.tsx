"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureBadge from "@/components/TemperatureBadge";
import RunCommendation from "@/components/RunCommendation";
import WeatherForecastCard from "@/components/WeatherForecastCard"; // ⚡ Import the new card
import recommendations from "@/lib/recommendations.json";

export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = (await httpsCallable(functions, "getLiveWeather")()) as any;
        const weatherData = res.data;
        setWeather(weatherData);
        setWeatherLoading(false);

        const heatIndex = weatherData.temp;
        let category: "GOOD" | "CAUTION" | "DANGER" = "GOOD";

        if (heatIndex >= 41) category = "DANGER";
        else if (heatIndex >= 33) category = "CAUTION";

        const pool = (recommendations as any)[category];
        const randomAdvice = pool[Math.floor(Math.random() * pool.length)];

        setRecommendation(randomAdvice);
      } catch (err) {
        console.error("Safe-Run Error:", err);
      }
    }
    init();
  }, []);

  const status =
    weather?.temp >= 41
      ? {
          bgGradient: "from-red-600 to-rose-700",
          textColor: "text-red-600",
          label: "DANGER",
        }
      : weather?.temp >= 33
        ? {
            bgGradient: "from-amber-400 to-orange-500",
            textColor: "text-orange-500",
            label: "CAUTION",
          }
        : {
            bgGradient: "from-emerald-500 to-teal-600",
            textColor: "text-emerald-600",
            label: "GOOD",
          };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 md:p-16">
      <h1
        className={`w-full text-center mt-6 sm:mt-0 md:mt-0 md:text-left text-2xl font-black italic uppercase mb-8 md:mb-12 ${status.textColor}`}
      >
        SAFE-RUN PH
      </h1>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <TemperatureBadge
          weather={weather}
          loading={weatherLoading}
          status={status}
        />
        <div className="lg:col-span-2">
          <RunCommendation
            recommendation={recommendation}
            loading={weatherLoading}
            status={status}
          />
        </div>

        <div className="lg:col-span-3">
          <WeatherForecastCard
            weather={weather}
            loading={weatherLoading}
            status={status}
          />
        </div>

        <div className="lg:col-span-3 py-6 md:py-12 text-center">
          <p className="text-slate-300 font-black italic uppercase text-[10px] tracking-[0.5em]">
            Safe-Run PH
          </p>
        </div>
      </div>
    </main>
  );
}
