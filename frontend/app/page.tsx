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
    <main className="min-h-screen bg-slate-50 p-8 md:p-16">
      <h1
        className={`text-2xl font-black italic uppercase mb-12 ${status.textColor}`}
      >
        SAFE-RUN PH
      </h1>

      {/* Container Grid */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* ROW 1: Quick Stats */}
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

        {/* ROW 2: Deep Dive (Scrollable) */}
        <div className="lg:col-span-3">
          <WeatherForecastCard
            weather={weather}
            loading={weatherLoading}
            status={status}
          />
        </div>

        {/* Footer / Space for extra scroll */}
        <div className="lg:col-span-3 py-12 text-center">
          <p className="text-slate-300 font-black italic uppercase text-xs tracking-[0.5em]">
            Safe-Run PH
          </p>
        </div>
      </div>
    </main>
  );
}
