"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Logic Engine Imports
import { analyzeWeather, fetchWeatherData } from "@/lib/logicEngine";

// Components
import TemperatureCard from "@/components/TemperatureCard";
import RunAbility from "@/components/RunAbility";
import MetricCards from "@/components/MetricCards";
import RunCommendationCard, { getTimeOfDay } from "@/components/RunCommendationCard";
import GraphCard from "@/components/GraphCard";
import TemperatureForecastCard from "@/components/TemperatureForecastCard";
import FreeSpaceCard from "@/components/FreeSpaceCard";

export default function Home() {
  // UI & Lifecycle States
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [isBranding, setIsBranding] = useState(false);
  const [greeting, setGreeting] = useState("Good morning,");
  const [timeOfDay, setTimeOfDay] = useState<ReturnType<typeof getTimeOfDay>>("umaga");

  const HeatMapCard = dynamic(() => import("@/components/HeatMapCard"), {
    ssr: false,
    loading: () => <div className="w-full h-[22rem] rounded-[2rem] bg-white animate-pulse" />
  });

  // 1. Lifecycle Effects & Data Orchestration
  useEffect(() => {
    setIsMounted(true);

    const updateTimeBasedState = () => {
      const hour = new Date().getHours();
      setGreeting(hour >= 5 && hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,");
      setTimeOfDay(getTimeOfDay(hour));
    };

    updateTimeBasedState();
    const clock = setInterval(updateTimeBasedState, 1000);
    const brandingTimer = setTimeout(() => setIsBranding(true), 1000);
    const heroTimer = setTimeout(() => setShowHero(false), 2000);

    const getCoords = (): Promise<{ lat: number; lon: number } | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
    };

    async function initializeWeather() {
      try {
        const coords = await getCoords();
        const data = await fetchWeatherData(coords); //  Call Fetch from logicEngine
        setWeather(data);
        setWeatherLoading(false);
        setTimeout(() => setShowHero(false), 1000);
      } catch (err) {
        setWeatherLoading(false);
        setShowHero(false);
      }
    }

    initializeWeather();

    return () => { clearInterval(clock); clearTimeout(brandingTimer); clearTimeout(heroTimer); };
  }, []);

  // 2. Structural Analysis (Powered by Logic Engine)
  const { status, recommendation, metrics, runScore } = useMemo(() => analyzeWeather(weather), [weather]);

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
      <div
        className={`
          flex items-center justify-center rounded-[2rem] overflow-hidden 
          transition-all duration-1000 ease-in-out
          ${showHero ? "h-[90dvh] mb-4" : "h-[5dvh] md:mt-4 mb-4 md:mb-8"}
        `}
      >
        <h2
          className={`
            ${showHero ? "text-3xl sm:text-5xl md:text-6xl lg:text-6xl" : "text-3xl sm:text-2xl md:text-4xl"}
            font-black italic leading-[0.9] sm:leading-none text-center tracking-tighter 
            lg:whitespace-nowrap
            transition-all duration-1000 ease-in-out transform
            ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24"}
            ${status.textColor}
          `}
        >
          <div className="relative h-[2.5rem] flex items-center justify-center">
            {/* Greeting */}
            <span
              className={`absolute transition-opacity duration-300 ease-in-out text-center ${isBranding ? "opacity-0" : "opacity-100"
                }`}
            >
              <span className="whitespace-nowrap">{greeting}</span>
              <br />
              <span>Runner!</span>
            </span>

            {/* Branding */}
            <span
              className={`absolute transition-opacity duration-300 ease-in-out text-center whitespace-nowrap ${isBranding ? "opacity-100" : "opacity-0"
                }`}
            >
              Safe-Run PH
            </span>
          </div>
        </h2>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <TemperatureCard
          weather={weather}
          loading={weatherLoading}
          status={status}
        />

        <RunAbility
          loading={weatherLoading}
          status={status}
          runScore={runScore || "0.00"}
          shortAdvice={recommendation?.title || "Evaluating..."}
        />

        <MetricCards
          weather={weather}
          loading={weatherLoading}
          humidity={metrics?.humidity || { desc: "", color: "text-slate-400" }}
          precip={metrics?.precip || { desc: "", color: "text-slate-400" }}
          currentUv={metrics?.uv || { desc: "", color: "text-slate-400", percent: 0, status: "" }}
          wind={metrics?.wind || { desc: "", color: "text-slate-400" }}
        />

        <div className="lg:col-span-2">
          <RunCommendationCard
            recommendation={recommendation}
            loading={weatherLoading}
            status={status}
            timeOfDay={timeOfDay}
          />
        </div>

        <GraphCard
          weather={weather}
          loading={weatherLoading}
          status={status}
        />

        <div className="lg:col-span-2">
          <TemperatureForecastCard weather={weather} loading={weatherLoading} status={status} />
        </div>

        <div className="hidden lg:block lg:row-span-2"> 
          <FreeSpaceCard status={status} loading={weatherLoading} /> 
        </div> 

        <div className="lg:col-span-2">
          <HeatMapCard weather={weather} loading={weatherLoading} status={status} />
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