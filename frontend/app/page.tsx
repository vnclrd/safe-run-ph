"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureBadge from "@/components/TemperatureBadge";
import RunCommendation from "@/components/RunCommendation";
import WeatherForecastCard from "@/components/WeatherForecastCard";
import recommendations from "@/lib/recommendations.json";

export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning,");
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Good morning,");
      else if (hour >= 12 && hour < 18) setGreeting("Good afternoon,");
      else if (hour >= 18 && hour <= 23) setGreeting("Good evening,");
      else setGreeting("Good morning,");
    };

    updateGreeting();

    async function init() {
      try {
        const res = (await httpsCallable(functions, "getLiveWeather")()) as any;
        const weatherData = res.data;
        setWeather(weatherData);
        setWeatherLoading(false);

        setTimeout(() => {
          setShowHero(false);
        }, 1000);

        const heatIndex = weatherData.temp;
        let category: "GOOD" | "CAUTION" | "DANGER" = "GOOD";

        if (heatIndex >= 41) category = "DANGER";
        else if (heatIndex >= 33) category = "CAUTION";

        const pool = (recommendations as any)[category];
        const randomAdvice = pool[Math.floor(Math.random() * pool.length)];

        setRecommendation(randomAdvice);
      } catch (err) {
        console.error("Safe-Run Error:", err);
        setWeatherLoading(false);
        setShowHero(false);
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
  <main className="min-h-screen bg-slate-50 overflow-x-hidden pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
    <div
      className={`
        flex items-center justify-center rounded-[2rem] overflow-hidden 
        transition-all duration-1000 ease-in-out
        ${showHero ? "h-[90dvh] mb-4" : "h-[10dvh] sm:h-[25dvh] md:h-[10dvh] md:mt-4 mb-4 md:mb-8"}
      `}
    >
      <h2
        className={`
          ${showHero ? "text-4xl sm:text-5xl md:text-6xl lg:text-6xl" : "text-3xl sm:text-2xl md:text-4xl"}
          font-black italic uppercase leading-[0.9] sm:leading-none text-center tracking-tighter 
          sm:whitespace-nowrap
          transition-all duration-1000 ease-in-out transform
          ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24"}
          ${status.textColor}
        `}
      >
        {greeting} 
        <br className="sm:hidden" />
        {" "}Runner!
      </h2>
    </div>

    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
      {/* --- ROW 1 --- */}
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

      {/* --- ROW 2: Metric Grid (Left) & Forecast (Right) --- */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-75">
        <MiniMetricCard
          label="Humidity"
          value={weatherLoading ? "---" : `${weather?.humidity || 0}%`}
          status={status}
        />
        <MiniMetricCard
          label="Precipitation"
          value={weatherLoading ? "---" : `${weather?.precip || 0}mm`}
          status={status}
        />
        <MiniMetricCard
          label="UV Index"
          value={weatherLoading ? "---" : (weather?.uvIndex || 0)}
          status={status}
        />
        <MiniMetricCard
          label="Wind Speed"
          value={weatherLoading ? "---" : `${weather?.windSpeed || 0}km/h`}
          status={status}
        />
      </div>

      <div className="lg:col-span-2">
        <WeatherForecastCard
          weather={weather}
          loading={weatherLoading}
          status={status}
        />
      </div>

      {/* --- FOOTER --- */}
      <div className="lg:col-span-3 py-6 md:py-12 text-center">
        <p className="text-slate-300 font-black italic uppercase text-[10px] tracking-[0.5em]">
          Safe-Run PH
        </p>
      </div>
    </div>
  </main>
);

  // Helper Component for the 4 Small Cards
  function MiniMetricCard({ label, value, status }: any) {
    return (
      <div className="flex flex-col justify-center items-center p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-700">
        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
          {label}
        </p>
        <p
          className={`text-xl sm:text-2xl font-black italic ${status.textColor}`}
        >
          {value}
        </p>
      </div>
    );
  }
}
