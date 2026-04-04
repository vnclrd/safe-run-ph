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
    <main className="min-h-screen bg-slate-50 pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
      <div 
        className={`
          flex items-center justify-center rounded-[2rem] overflow-hidden 
          transition-all duration-1000 ease-in-out
          ${showHero ? "h-[90dvh] mb-4" : "h-[20dvh] sm:h-[20dvh] md:h-[35dvh] mb-4 md:mt-10 md:mb-0"}
        `}
      >
        <h2 
          className={`
            text-4xl sm:text-6xl
            font-black italic uppercase leading-none text-center tracking-tighter 
            transition-all duration-1000 ease-out transform
            ${isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
            ${status.textColor}
          `}
        >
          {greeting}
          <br />
          Runner!
        </h2>
      </div>

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